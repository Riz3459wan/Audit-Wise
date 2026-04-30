import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import * as XLSX from "xlsx";
import { HfInference } from "@huggingface/inference";

const pdfjsVersion = "4.10.38";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

const MAX_PDF_PAGES = 50;
const MAX_SUMMARY_LENGTH = 500;
const MAX_TRANSACTIONS_DISPLAY = 20;

const RISK_THRESHOLDS = {
  LOW: 35,
  HIGH: 65,
};

const RISK_WEIGHTS = {
  BASE: 15,
  ERROR_MAX: 25,
  ERROR_PER: 5,
  WARN_MAX: 15,
  WARN_PER: 3,
  FAILED_TXN: 25,
  FRAUD: 30,
  VIOLATION: 25,
  NEGATIVE_PROFIT: 30,
  HIGH_DEBIT: 15,
  LARGE_TXN_COUNT: 10,
};

let hfClient = null;

function getHuggingFaceClient() {
  if (!hfClient) {
    const token = import.meta.env.VITE_HF_TOKEN;
    if (token && token !== "hf_YOUR_TOKEN_HERE") {
      hfClient = new HfInference(token);
    }
  }
  return hfClient;
}

function parseAmount(str) {
  if (!str) return 0;
  const cleaned = String(str)
    .toString()
    .replace(/[£$₹,]/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function extractTransactionsFromText(text) {
  const transactions = [];
  const seen = new Set();

  if (!text || typeof text !== "string") {
    return transactions;
  }

  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const transactionPattern =
      /(TXN\d+)\s+(Credit|Debit)\s+([\d,]+)\s+(Completed|Failed|Pending)/i;
    let match = transactionPattern.exec(line);

    if (match) {
      const id = match[1];
      const type = match[2];
      const amount = parseAmount(match[3]);
      const status = match[4].toUpperCase();

      let date = new Date().toISOString().split("T")[0];
      for (
        let j = Math.max(0, i - 5);
        j <= Math.min(lines.length - 1, i + 5);
        j++
      ) {
        const dateMatch = lines[j].match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          date = dateMatch[1];
          break;
        }
      }

      const key = `${date}_${id}_${amount}`;
      if (!seen.has(key) && amount > 0) {
        seen.add(key);
        transactions.push({
          date: date,
          id: id,
          type: type,
          amount: amount,
          status: status,
          description: "",
        });
      }
      continue;
    }

    const simplePattern =
      /(Credit|Debit)\s+([\d,]+)\s+(Completed|Failed|Pending)?/i;
    match = simplePattern.exec(line);

    if (match && !line.match(/TXN\d+/i)) {
      const type = match[1];
      const amount = parseAmount(match[2]);
      const status = match[3] ? match[3].toUpperCase() : "COMPLETED";

      let date = new Date().toISOString().split("T")[0];
      for (
        let j = Math.max(0, i - 5);
        j <= Math.min(lines.length - 1, i + 5);
        j++
      ) {
        const dateMatch = lines[j].match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          date = dateMatch[1];
          break;
        }
      }

      const key = `${date}_${type}_${amount}`;
      if (!seen.has(key) && amount > 0 && amount < 1000000000) {
        seen.add(key);
        transactions.push({
          date: date,
          id: `TXN${transactions.length + 1}`,
          type: type,
          amount: amount,
          status: status,
          description: "",
        });
      }
    }
  }

  let revenueFromSummary = 0;
  let expensesFromSummary = 0;

  for (const line of lines) {
    const revenueMatch = line.match(/Revenue:?\s*[£$₹]?\s*([\d,]+)/i);
    if (revenueMatch) {
      revenueFromSummary = parseAmount(revenueMatch[1]);
      const key = `summary_revenue_${revenueFromSummary}`;
      if (!seen.has(key) && revenueFromSummary > 0) {
        seen.add(key);
        transactions.push({
          date: new Date().toISOString().split("T")[0],
          id: `REV_SUMMARY`,
          type: "Credit",
          amount: revenueFromSummary,
          status: "COMPLETED",
          description: "Revenue from financial summary",
        });
      }
    }

    const expensesMatch = line.match(/Expenses?:?\s*[£$₹]?\s*([\d,]+)/i);
    if (expensesMatch) {
      expensesFromSummary = parseAmount(expensesMatch[1]);
      const key = `summary_expenses_${expensesFromSummary}`;
      if (!seen.has(key) && expensesFromSummary > 0) {
        seen.add(key);
        transactions.push({
          date: new Date().toISOString().split("T")[0],
          id: `EXP_SUMMARY`,
          type: "Debit",
          amount: expensesFromSummary,
          status: "COMPLETED",
          description: "Expenses from financial summary",
        });
      }
    }
  }

  let headers = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (
      line.match(/Date.*Transaction.*Type.*Amount.*Status/i) ||
      line.match(/Date.*Transaction.*Debit.*Credit/i) ||
      line.match(/Date.*Debit.*Credit.*Balance/i) ||
      line.match(/Date\s+Transaction ID\s+Type\s+Amount/i)
    ) {
      headers = line.split(/[,\t|]{1,}/).map((h) => h.trim().toLowerCase());
      continue;
    }

    if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
      const parts = line.split(/[,\t|]{1,}/).map((p) => p.trim());
      let date = parts[0] || null;
      let id = null;
      let type = null;
      let amount = 0;
      let status = "COMPLETED";
      let description = "";

      for (let j = 1; j < parts.length; j++) {
        const value = parts[j];
        if (!value || value === "") continue;

        if (value.match(/^TXN\d+/i)) {
          id = value;
        } else if (value.match(/^Credit$/i)) {
          type = "Credit";
        } else if (value.match(/^Debit$/i)) {
          type = "Debit";
        } else if (value.match(/^[\d,]+(?:\.\d{2})?$/)) {
          amount = parseAmount(value);
        } else if (value.match(/^Completed$|^Failed$|^Pending$/i)) {
          status = value.toUpperCase();
        } else if (value.length > 2 && !value.match(/^\d/)) {
          description = value;
        }
      }

      if (headers.length > 0 && !type) {
        for (let j = 1; j < parts.length && j < headers.length; j++) {
          const header = headers[j];
          const value = parts[j];

          if (header.includes("type")) {
            if (value.match(/credit/i)) type = "Credit";
            else if (value.match(/debit/i)) type = "Debit";
          } else if (header.includes("amount")) {
            amount = parseAmount(value);
          } else if (header.includes("status")) {
            status = value.toUpperCase();
          } else if (header.includes("id") || header.includes("txn")) {
            id = value;
          } else if (header.includes("description")) {
            description = value;
          }
        }
      }

      if (date && amount > 0 && type) {
        const key = `${date}_${id || type}_${amount}`;
        if (!seen.has(key)) {
          seen.add(key);
          transactions.push({
            date: date,
            id: id || `TXN${transactions.length + 1}`,
            type: type,
            amount: amount,
            status: status,
            description: description,
          });
        }
      } else if (date && amount > 0 && !type) {
        const key = `${date}_amount_${amount}`;
        if (!seen.has(key)) {
          seen.add(key);
          let inferredType = "Credit";
          if (
            description.toLowerCase().includes("debit") ||
            description.toLowerCase().includes("purchase") ||
            description.toLowerCase().includes("supplies")
          ) {
            inferredType = "Debit";
          }
          transactions.push({
            date: date,
            id: id || `TXN${transactions.length + 1}`,
            type: inferredType,
            amount: amount,
            status: status,
            description: description,
          });
        }
      }
    }
  }

  const tablePattern =
    /\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(TXN\d+)\s*\|\s*(Credit|Debit)\s*\|\s*([\d,]+)\s*\|\s*(Completed|Failed|Pending)\s*\|/gi;
  let tableMatch;
  while ((tableMatch = tablePattern.exec(text)) !== null) {
    const date = tableMatch[1];
    const id = tableMatch[2];
    const type = tableMatch[3];
    const amount = parseAmount(tableMatch[4]);
    const status = tableMatch[5].toUpperCase();

    const key = `${date}_${id}_${amount}`;
    if (!seen.has(key) && amount > 0 && amount < 1000000000) {
      seen.add(key);
      transactions.push({
        date: date,
        id: id,
        type: type,
        amount: amount,
        status: status,
        description: "",
      });
    }
  }

  const inlinePattern =
    /(TXN\d+).*?(Credit|Debit).*?([\d,]+).*?(Completed|Failed|Pending)/gi;
  let inlineMatch;
  while ((inlineMatch = inlinePattern.exec(text)) !== null) {
    const id = inlineMatch[1];
    const type = inlineMatch[2];
    const amount = parseAmount(inlineMatch[3]);
    const status = inlineMatch[4].toUpperCase();

    let date = new Date().toISOString().split("T")[0];
    const contextStart = Math.max(0, inlineMatch.index - 100);
    const contextEnd = Math.min(text.length, inlineMatch.index + 100);
    const context = text.substring(contextStart, contextEnd);
    const dateMatch = context.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      date = dateMatch[1];
    }

    const key = `${date}_${id}_${amount}`;
    if (!seen.has(key) && amount > 0) {
      seen.add(key);
      transactions.push({
        date: date,
        id: id,
        type: type,
        amount: amount,
        status: status,
        description: "",
      });
    }
  }

  const numberPattern = /(Credit|Debit)\s+([\d,]+)/gi;
  let numberMatch;
  while ((numberMatch = numberPattern.exec(text)) !== null) {
    const type = numberMatch[1];
    const amount = parseAmount(numberMatch[2]);

    if (amount > 0 && amount < 1000000000 && !seen.has(`${type}_${amount}`)) {
      let date = new Date().toISOString().split("T")[0];
      const contextStart = Math.max(0, numberMatch.index - 200);
      const contextEnd = Math.min(text.length, numberMatch.index + 200);
      const context = text.substring(contextStart, contextEnd);
      const dateMatch = context.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        date = dateMatch[1];
      }

      const key = `${date}_${type}_${amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        transactions.push({
          date: date,
          id: `TXN${transactions.length + 1}`,
          type: type,
          amount: amount,
          status: "COMPLETED",
          description: "",
        });
      }
    }
  }

  const uniqueTransactions = [];
  const uniqueKeys = new Set();
  for (const t of transactions) {
    const key = `${t.date}_${t.type}_${t.amount}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      uniqueTransactions.push(t);
    }
  }

  return uniqueTransactions;
}

function calculateTransactionStats(transactions) {
  let totalCredit = 0;
  let totalDebit = 0;
  let failedCount = 0;
  let pendingCount = 0;
  let completedCount = 0;

  for (const txn of transactions) {
    if (txn.type === "Credit") totalCredit += txn.amount;
    if (txn.type === "Debit") totalDebit += txn.amount;
    if (txn.status === "FAILED") failedCount++;
    if (txn.status === "PENDING") pendingCount++;
    if (txn.status === "COMPLETED") completedCount++;
  }

  return { totalCredit, totalDebit, failedCount, pendingCount, completedCount };
}

function extractAuditData(text) {
  const transactions = extractTransactionsFromText(text);
  const stats = calculateTransactionStats(transactions);

  let revenue = stats.totalCredit;
  let expenses = stats.totalDebit;
  let profit = revenue - expenses;

  const profitMargin =
    revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(2)) : 0;

  return {
    revenue,
    expenses,
    profit,
    profitMargin,
    transactions,
    totalCredit: stats.totalCredit,
    totalDebit: stats.totalDebit,
    failedCount: stats.failedCount,
    pendingCount: stats.pendingCount,
    completedCount: stats.completedCount,
  };
}

function calculateRisk(text, data) {
  const lowerText = text.toLowerCase();
  let riskScore = RISK_WEIGHTS.BASE;

  const errorCount = (lowerText.match(/error/g) || []).length;
  const warnCount = (lowerText.match(/warn/g) || []).length;

  riskScore += Math.min(
    RISK_WEIGHTS.ERROR_MAX,
    errorCount * RISK_WEIGHTS.ERROR_PER,
  );
  riskScore += Math.min(
    RISK_WEIGHTS.WARN_MAX,
    warnCount * RISK_WEIGHTS.WARN_PER,
  );

  if (data.failedCount > 0) riskScore += RISK_WEIGHTS.FAILED_TXN;
  if (data.profit < 0) riskScore += RISK_WEIGHTS.NEGATIVE_PROFIT;
  if (data.totalDebit > data.totalCredit * 1.2 && data.totalCredit > 0)
    riskScore += RISK_WEIGHTS.HIGH_DEBIT;

  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel = "MEDIUM";
  if (riskScore >= RISK_THRESHOLDS.HIGH) riskLevel = "HIGH";
  else if (riskScore <= RISK_THRESHOLDS.LOW) riskLevel = "LOW";

  return { riskScore, riskLevel };
}

function determineSentiment(apiSentiment, data, riskLevel) {
  if (apiSentiment) return apiSentiment;

  if (riskLevel === "HIGH") return "NEGATIVE";
  if (data.profit > 0 && data.profitMargin > 20) return "POSITIVE";
  if (data.profit > 0) return "POSITIVE";
  if (data.profit < 0) return "NEGATIVE";
  return "NEUTRAL";
}

function generateKeyFindings(text, data) {
  const findings = [];

  if (data.transactions.length > 0) {
    findings.push(`Total ${data.transactions.length} transactions analyzed`);
  } else {
    findings.push(`No transactions found in document`);
  }

  if (data.totalCredit > 0) {
    findings.push(`Total Revenue: ₹${data.totalCredit.toLocaleString()}`);
  }

  if (data.totalDebit > 0) {
    findings.push(`Total Expenses: ₹${data.totalDebit.toLocaleString()}`);
  }

  if (data.profit !== 0) {
    if (data.profit > 0) {
      findings.push(
        `Net Profit: ₹${data.profit.toLocaleString()} (${data.profitMargin}% margin)`,
      );
    } else {
      findings.push(`Net Loss: ₹${Math.abs(data.profit).toLocaleString()}`);
    }
  }

  const creditCount = data.transactions.filter(
    (t) => t.type === "Credit",
  ).length;
  const debitCount = data.transactions.filter((t) => t.type === "Debit").length;

  if (creditCount > 0) {
    findings.push(
      `${creditCount} credit transaction(s) totaling ₹${data.totalCredit.toLocaleString()}`,
    );
  }

  if (debitCount > 0) {
    findings.push(
      `${debitCount} debit transaction(s) totaling ₹${data.totalDebit.toLocaleString()}`,
    );
  }

  if (data.failedCount > 0) {
    findings.push(
      `${data.failedCount} failed transaction(s) detected - Requires investigation`,
    );
  }

  if (findings.length === 0) {
    findings.push(
      "Document processed successfully - no financial transactions detected",
    );
  }

  return findings.slice(0, 6);
}

function generateRecommendations(data, riskLevel) {
  const recommendations = [];

  if (riskLevel === "HIGH") {
    recommendations.push(
      "IMMEDIATE ACTION: Schedule urgent detailed audit investigation",
      "Review all transactions for potential discrepancies",
      "Implement enhanced internal controls",
    );
    if (data.profit < 0) {
      recommendations.push(
        "Conduct comprehensive financial review to address losses",
      );
    }
    if (data.failedCount > 0) {
      recommendations.push(
        `Investigate ${data.failedCount} failed transaction(s) immediately`,
      );
    }
  } else if (riskLevel === "MEDIUM") {
    recommendations.push(
      "Schedule follow-up audit within 30-45 days",
      "Review flagged transactions for potential discrepancies",
      "Strengthen documentation and record-keeping processes",
    );
  } else {
    recommendations.push(
      "Continue regular monitoring and periodic audits",
      "Maintain current compliance practices",
      "Document all financial transactions properly for future reference",
    );
  }

  if (data.profit > 0 && data.profitMargin > 50) {
    recommendations.push(
      "Excellent profit margin maintained. Consider expansion opportunities.",
    );
  } else if (data.profit > 0 && data.profitMargin > 25) {
    recommendations.push(
      "Good profitability. Continue monitoring expenses to maintain margins.",
    );
  }

  if (data.totalDebit > data.totalCredit && data.totalCredit > 0) {
    recommendations.push("Review expense patterns as debits exceed credits");
  }

  if (data.failedCount > 0) {
    recommendations.push(
      `Review and resolve ${data.failedCount} failed transaction(s)`,
    );
  }

  return recommendations.slice(0, 5);
}

function generateSummary(text, data, riskLevel, sentiment) {
  const parts = [];

  if (data.transactions.length > 0) {
    parts.push(
      `Analysis of ${data.transactions.length} financial transactions shows`,
    );
  } else {
    parts.push(`No transactions found in the document.`);
  }

  if (data.totalCredit > 0 || data.totalDebit > 0) {
    parts.push(
      `total revenue of ₹${data.totalCredit.toLocaleString()} and expenses of ₹${data.totalDebit.toLocaleString()}.`,
    );
  }

  if (data.profit !== 0) {
    if (data.profit > 0) {
      parts.push(
        `Net profit of ₹${data.profit.toLocaleString()} with a profit margin of ${data.profitMargin}%.`,
      );
    } else if (data.profit < 0) {
      parts.push(`Net loss of ₹${Math.abs(data.profit).toLocaleString()}.`);
    }
  }

  if (data.failedCount > 0) {
    parts.push(
      `${data.failedCount} failed transaction(s) detected requiring investigation.`,
    );
  }

  const sentimentText =
    sentiment === "POSITIVE"
      ? "Positive"
      : sentiment === "NEGATIVE"
        ? "Negative"
        : "Neutral";
  parts.push(
    `Overall sentiment is ${sentimentText.toLowerCase()} with ${riskLevel.toLowerCase()} risk level.`,
  );

  const summary =
    parts.length > 0
      ? parts.join(" ")
      : "Document processed successfully for audit review.";

  return summary.length > MAX_SUMMARY_LENGTH
    ? `${summary.substring(0, MAX_SUMMARY_LENGTH)}...`
    : summary;
}

function calculateConfidence(data, hasApiResult = false) {
  let confidence = hasApiResult ? 0.85 : 0.7;
  if (data.transactions.length > 0) confidence += 0.1;
  if (data.totalCredit > 0) confidence += 0.05;
  if (data.totalDebit > 0) confidence += 0.05;
  if (data.failedCount === 0) confidence += 0.03;
  return Math.min(0.98, Math.max(0.65, confidence));
}

async function callHuggingFaceAPI(text, onProgress) {
  if (!navigator.onLine) return null;

  const client = getHuggingFaceClient();
  if (!client) return null;

  const models = [
    "cardiffnlp/twitter-roberta-base-sentiment-latest",
    "finiteautomata/bertweet-base-sentiment-analysis",
  ];

  for (const model of models) {
    try {
      onProgress?.({ status: `analyzing_with_ai`, progress: 55 });

      const result = await client.textClassification({
        model: model,
        inputs: text.substring(0, 512),
        parameters: { truncation: true, max_length: 512 },
      });

      onProgress?.({ status: "api_success", progress: 80 });
      return { result, model };
    } catch (error) {
      continue;
    }
  }
  return null;
}

function parseSentimentFromAPI(apiResponse) {
  if (!apiResponse?.result) return null;

  try {
    const results = apiResponse.result;
    if (Array.isArray(results) && results.length > 0) {
      const topResult = results.reduce((prev, current) =>
        current.score > prev.score ? current : prev,
      );
      const label = topResult.label.toUpperCase();
      if (label.includes("POSITIVE")) return "POSITIVE";
      if (label.includes("NEGATIVE")) return "NEGATIVE";
      if (label.includes("NEUTRAL")) return "NEUTRAL";
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function runAuditAnalysis(text, onProgress) {
  if (!text?.trim()) {
    return {
      success: false,
      revenue: 0,
      expenses: 0,
      profit: 0,
      profitMargin: 0,
      totalCredit: 0,
      totalDebit: 0,
      anomalies: 0,
      failedCount: 0,
      pendingCount: 0,
      completedCount: 0,
      riskScore: 50,
      riskLevel: "MEDIUM",
      sentiment: "NEUTRAL",
      keyFindings: ["No text content found in document"],
      recommendations: ["Please upload a document with readable text"],
      transactions: [],
      summary: "Unable to analyze document - no text content found.",
      confidence: 0.5,
      wordCount: 0,
      charCount: 0,
      mode: "local_analysis",
    };
  }

  const auditData = extractAuditData(text);

  let apiSentiment = null;
  let mode = "local_analysis";

  if (navigator.onLine && auditData.transactions.length > 0) {
    try {
      const apiResponse = await callHuggingFaceAPI(text, onProgress);
      if (apiResponse?.result) {
        apiSentiment = parseSentimentFromAPI(apiResponse);
        if (apiSentiment) {
          mode = "cloud_ai";
        }
      }
    } catch (error) {}
  }

  const risk = calculateRisk(text, auditData);
  const sentiment = determineSentiment(apiSentiment, auditData, risk.riskLevel);
  const keyFindings = generateKeyFindings(text, auditData);
  const recommendations = generateRecommendations(auditData, risk.riskLevel);
  const summary = generateSummary(text, auditData, risk.riskLevel, sentiment);
  const confidence = calculateConfidence(auditData, mode === "cloud_ai");
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    success: true,
    revenue: auditData.revenue,
    expenses: auditData.expenses,
    profit: auditData.profit,
    profitMargin: auditData.profitMargin,
    totalCredit: auditData.totalCredit,
    totalDebit: auditData.totalDebit,
    anomalies: auditData.failedCount,
    failedCount: auditData.failedCount,
    pendingCount: auditData.pendingCount,
    completedCount: auditData.completedCount,
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
    sentiment,
    keyFindings,
    recommendations,
    transactions: auditData.transactions.slice(0, MAX_TRANSACTIONS_DISPLAY),
    summary,
    confidence,
    wordCount,
    charCount: text.length,
    mode,
  };
}

async function performOCR(imageFile, onProgress) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(imageFile, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.({
            status: "ocr_processing",
            progress: Math.floor(m.progress * 100),
          });
        }
      },
    })
      .then(({ data: { text } }) => resolve(text))
      .catch(reject);
  });
}

async function extractTextFromImageWithOCR(file, onProgress) {
  try {
    onProgress?.({ status: "loading_image", progress: 10 });
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });
    onProgress?.({ status: "ocr_started", progress: 30 });
    const text = await performOCR(file, onProgress);
    URL.revokeObjectURL(imageUrl);
    onProgress?.({ status: "ocr_complete", progress: 100 });
    return text;
  } catch (error) {
    throw error;
  }
}

export const ocrService = {
  async extractTextFromPDF(file, onProgress) {
    try {
      onProgress?.({ status: "loading_pdf", progress: 10 });
      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        disableFontFace: true,
      });

      const pdf = await loadingTask.promise;
      const numPages = Math.min(pdf.numPages, MAX_PDF_PAGES);
      let fullText = "";

      for (let i = 1; i <= numPages; i++) {
        onProgress?.({
          status: `extracting_page_${i}`,
          progress: 10 + Math.floor((i / numPages) * 80),
        });
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        if (pageText?.trim()) fullText += pageText + "\n";
      }

      onProgress?.({ status: "complete", progress: 100 });

      return {
        success: true,
        text: fullText.trim() || `PDF Document: ${file.name}`,
        pagesProcessed: numPages,
      };
    } catch (error) {
      console.error("PDF extraction error:", error);
      return {
        success: true,
        text: `PDF Document: ${file.name}\nDocument uploaded successfully for audit processing.`,
        pagesProcessed: 0,
      };
    }
  },

  async extractTextFromDOC(file, onProgress) {
    try {
      onProgress?.({ status: "processing_doc", progress: 30 });
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      onProgress?.({ status: "complete", progress: 100 });
      return {
        success: true,
        text: result.value?.trim() || `Word Document: ${file.name}`,
      };
    } catch (error) {
      console.error("DOC extraction error:", error);
      return {
        success: true,
        text: `Word Document: ${file.name}\nDocument uploaded successfully for audit processing.`,
      };
    }
  },

  async extractTextFromExcel(file, onProgress) {
    try {
      onProgress?.({ status: "processing_excel", progress: 30 });
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      let fullText = "";

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        fullText += `\n--- Sheet: ${sheetName} ---\n${csv}\n`;
        onProgress?.({
          status: `processing_sheet`,
          progress:
            30 +
            Math.floor(
              (workbook.SheetNames.indexOf(sheetName) /
                workbook.SheetNames.length) *
                60,
            ),
        });
      }

      onProgress?.({ status: "complete", progress: 100 });
      return {
        success: true,
        text:
          fullText.trim() ||
          `Excel File: ${file.name}\nNo data found in spreadsheet.`,
      };
    } catch (error) {
      console.error("Excel extraction error:", error);
      return {
        success: true,
        text: `Excel File: ${file.name}\nUploaded successfully for audit processing.`,
      };
    }
  },

  async extractTextFromImage(file, onProgress) {
    try {
      onProgress?.({ status: "processing_image", progress: 20 });
      const extractedText = await extractTextFromImageWithOCR(file, onProgress);
      onProgress?.({ status: "complete", progress: 100 });
      return {
        success: true,
        text:
          extractedText ||
          `Image Document: ${file.name}\nImage uploaded for audit review.`,
      };
    } catch (error) {
      console.error("Image extraction error:", error);
      return {
        success: true,
        text: `Image: ${file.name}\nUploaded for audit processing.`,
      };
    }
  },

  async analyzeWithAI(text, onProgress) {
    onProgress?.({ status: "analyzing", progress: 40 });
    const result = await runAuditAnalysis(text, onProgress);
    onProgress?.({ status: "complete", progress: 100 });
    return result;
  },
};
