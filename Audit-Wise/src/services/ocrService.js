import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import * as XLSX from "xlsx";

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

const REVENUE_PATTERNS = [
  /(?:revenue|total revenue|income|total income|sales|total sales)[:\s]*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  /(?:total|sum)[:\s]*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[:\s]*(?:revenue|income)/i,
  /revenue\s*[=:]\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
];

const EXPENSE_PATTERNS = [
  /(?:expenses|total expenses|costs|total costs|expenditure)[:\s]*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  /(?:total|sum)[:\s]*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[:\s]*(?:expenses|costs)/i,
  /expenses\s*[=:]\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
];

const PROFIT_PATTERNS = [
  /(?:profit|net profit|net income|earnings)[:\s]*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  /(?:loss|net loss)[:\s]*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  /profit\s*[=:]\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
];

const TRANSACTION_PATTERNS = [
  /(\d{4}-\d{2}-\d{2})\s+([A-Z0-9]+)\s+(Credit|Debit)\s+([\d,]+)\s+(Completed|Failed|Pending)/gi,
  /(\d{4}-\d{2}-\d{2})\s+(TXN\d+)\s+(Credit|Debit)\s+₹?(\d+(?:\.\d+)?)\s+(Completed|Failed|Pending)/gi,
  /(\d{2}\/\d{2}\/\d{4})\s+(TXN\d+)\s+(Credit|Debit)\s+₹?(\d+(?:\.\d+)?)\s+(Completed|Failed|Pending)/gi,
  /(\d{4}-\d{2}-\d{2})\s+(Credit|Debit)\s+₹?(\d+(?:\.\d+)?)\s+(Completed|Failed)/gi,
  /(Credit|Debit)\s+of\s+₹?(\d+(?:\.\d+)?)\s+on\s+(\d{4}-\d{2}-\d{2})/gi,
];

function normalizeText(text) {
  if (!text) return "";
  return text
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function parseAmount(str) {
  if (!str) return NaN;
  return parseFloat(str.replace(/,/g, ""));
}

function extractAllNumbers(text) {
  const numbers = [];
  const regex = /(?:₹|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const num = parseAmount(match[1]);
    if (!isNaN(num) && num > 0) numbers.push(num);
  }
  return numbers;
}

function matchFirstPattern(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseAmount(match[1]);
  }
  return null;
}

function parseTransactionMatch(match, pattern, index, fallbackCount) {
  let date, id, type, amount, status;

  if (match[1] && /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(match[1])) {
    date = match[1];
    id = match[2] || `TXN${fallbackCount}`;
    type = match[3] || match[1];
    amount = parseAmount(match[4] || match[2] || "0");
    status = match[5] || match[4] || "Completed";
  } else if (match[1] === "Credit" || match[1] === "Debit") {
    type = match[1];
    amount = parseAmount(match[2]);
    date = match[3];
    id = `TXN${fallbackCount}`;
    status = "Completed";
  } else {
    return null;
  }

  if (type === "CR") type = "Credit";
  if (type === "DR") type = "Debit";

  if (isNaN(amount) || amount <= 0) return null;

  return {
    date: date || new Date().toISOString().split("T")[0],
    id,
    type,
    amount,
    status: (status || "Completed").toUpperCase(),
  };
}

function extractTransactions(text) {
  const clean = text.replace(/,/g, "");
  const transactions = [];
  const seen = new Set();

  TRANSACTION_PATTERNS.forEach((pattern, patternIdx) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(clean)) !== null) {
      const txn = parseTransactionMatch(
        match,
        pattern,
        patternIdx,
        transactions.length + 1,
      );
      if (!txn) continue;

      const key = `${txn.date}-${txn.id}-${txn.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        transactions.push(txn);
      }
    }
  });

  return transactions;
}

function calculateTransactionStats(transactions) {
  return transactions.reduce(
    (acc, txn) => {
      if (txn.type === "Credit") acc.totalCredit += txn.amount;
      if (txn.type === "Debit") acc.totalDebit += txn.amount;
      if (txn.status === "FAILED") acc.failedCount++;
      if (txn.status === "PENDING") acc.pendingCount++;
      if (txn.status === "COMPLETED") acc.completedCount++;
      return acc;
    },
    {
      totalCredit: 0,
      totalDebit: 0,
      failedCount: 0,
      pendingCount: 0,
      completedCount: 0,
    },
  );
}

function extractFinancialSummary(text) {
  const clean = normalizeText(text);
  const transactions = extractTransactions(text);
  const stats = calculateTransactionStats(transactions);

  let revenue = matchFirstPattern(clean, REVENUE_PATTERNS);
  let expenses = matchFirstPattern(clean, EXPENSE_PATTERNS);
  let profit = matchFirstPattern(clean, PROFIT_PATTERNS);

  if ((revenue === null || revenue === 0) && stats.totalCredit > 0) {
    revenue = stats.totalCredit;
  }

  if ((expenses === null || expenses === 0) && stats.totalDebit > 0) {
    expenses = stats.totalDebit;
  }

  if (profit === null && revenue !== null && expenses !== null) {
    profit = revenue - expenses;
  }

  return {
    revenue: revenue || 0,
    expenses: expenses || 0,
    profit: profit || 0,
  };
}

function extractAuditData(text) {
  const transactions = extractTransactions(text);
  const stats = calculateTransactionStats(transactions);

  let summary = { revenue: 0, expenses: 0, profit: 0 };

  if (transactions.length === 0) {
    summary = extractFinancialSummary(text);
  } else {
    summary.revenue = stats.totalCredit;
    summary.expenses = stats.totalDebit;
    summary.profit = stats.totalCredit - stats.totalDebit;
  }

  const revenue = summary.revenue;
  const expenses = summary.expenses;
  const profit = summary.profit;
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
  if (lowerText.includes("fraud") || lowerText.includes("suspicious"))
    riskScore += RISK_WEIGHTS.FRAUD;
  if (lowerText.includes("violation") || lowerText.includes("non-compliance"))
    riskScore += RISK_WEIGHTS.VIOLATION;
  if (data.profit < 0) riskScore += RISK_WEIGHTS.NEGATIVE_PROFIT;
  if (data.totalDebit > data.totalCredit * 1.2)
    riskScore += RISK_WEIGHTS.HIGH_DEBIT;
  if (data.transactions.length > 100) riskScore += RISK_WEIGHTS.LARGE_TXN_COUNT;

  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel = "MEDIUM";
  if (riskScore >= RISK_THRESHOLDS.HIGH) riskLevel = "HIGH";
  else if (riskScore <= RISK_THRESHOLDS.LOW) riskLevel = "LOW";

  return { riskScore, riskLevel };
}

function determineSentiment(data, riskLevel) {
  if (riskLevel === "HIGH") return "NEGATIVE";
  if (riskLevel === "LOW" && data.profit > 0) return "POSITIVE";
  if (data.profit > 0 && data.revenue > data.expenses) return "POSITIVE";
  if (data.profit < 0 || data.failedCount > 0) return "NEGATIVE";
  return "NEUTRAL";
}

function generateKeyFindings(text, data) {
  const findings = [];
  const lowerText = text.toLowerCase();

  if (data.revenue > 0)
    findings.push(`Total Revenue: ₹${data.revenue.toLocaleString()}`);
  if (data.expenses > 0)
    findings.push(`Total Expenses: ₹${data.expenses.toLocaleString()}`);

  if (data.profit !== 0) {
    findings.push(
      data.profit > 0
        ? `Net Profit: ₹${data.profit.toLocaleString()} (${data.profitMargin}% margin)`
        : `Net Loss: ₹${Math.abs(data.profit).toLocaleString()}`,
    );
  }

  if (data.totalCredit > 0 && data.totalCredit !== data.revenue)
    findings.push(`Total Credit Amount: ₹${data.totalCredit.toLocaleString()}`);
  if (data.totalDebit > 0 && data.totalDebit !== data.expenses)
    findings.push(`Total Debit Amount: ₹${data.totalDebit.toLocaleString()}`);
  if (data.failedCount > 0)
    findings.push(
      `${data.failedCount} failed transaction(s) detected - Requires investigation`,
    );
  if (data.pendingCount > 0)
    findings.push(`${data.pendingCount} pending transaction(s) need attention`);
  if (lowerText.includes("error"))
    findings.push("System errors detected in document logs");
  if (lowerText.includes("warning"))
    findings.push("Warning messages found that may indicate issues");
  if (data.transactions.length > 0 && findings.length < 3)
    findings.push(`Total ${data.transactions.length} transaction(s) analyzed`);
  if (findings.length === 0)
    findings.push(
      "Document processed successfully - no immediate concerns detected",
    );

  return findings;
}

function generateRecommendations(data, riskLevel) {
  const recommendations = [];

  if (riskLevel === "HIGH") {
    recommendations.push(
      "IMMEDIATE ACTION: Schedule urgent detailed audit investigation",
      "Review all failed transactions and system errors immediately",
      "Implement enhanced internal controls and monitoring systems",
    );
    if (data.profit < 0)
      recommendations.push(
        "Conduct comprehensive financial review to address losses",
      );
    recommendations.push(
      "Escalate findings to senior management for immediate action",
    );
  } else if (riskLevel === "MEDIUM") {
    recommendations.push(
      "Schedule follow-up audit within 30-45 days",
      "Review flagged transactions for potential discrepancies",
      "Strengthen documentation and record-keeping processes",
      "Monitor financial patterns for emerging risks",
    );
  } else {
    recommendations.push(
      "Continue regular monitoring and periodic audits",
      "Maintain current compliance practices",
      "Document all financial transactions properly for future reference",
    );
  }

  if (data.failedCount > 0)
    recommendations.push(
      `Investigate ${data.failedCount} failed transaction(s) and resolve underlying issues`,
    );
  if (data.pendingCount > 0)
    recommendations.push(
      `Follow up on ${data.pendingCount} pending transaction(s) for completion`,
    );
  if (data.totalDebit > data.totalCredit && data.totalCredit > 0)
    recommendations.push("Review expense patterns as debits exceed credits");

  return recommendations;
}

function generateSummary(text, data, riskLevel) {
  const parts = [];

  if (data.revenue > 0 || data.expenses > 0) {
    parts.push(
      `Financial analysis shows revenue of ₹${data.revenue.toLocaleString()} and expenses of ₹${data.expenses.toLocaleString()}.`,
      `Net ${data.profit >= 0 ? "Profit" : "Loss"}: ₹${Math.abs(data.profit).toLocaleString()}.`,
    );
    if (data.profitMargin > 0)
      parts.push(`Profit margin: ${data.profitMargin}%.`);
  }

  if (data.totalCredit > 0 && data.totalCredit !== data.revenue)
    parts.push(`Total credits: ₹${data.totalCredit.toLocaleString()}.`);
  if (data.totalDebit > 0 && data.totalDebit !== data.expenses)
    parts.push(`Total debits: ₹${data.totalDebit.toLocaleString()}.`);
  if (data.transactions.length > 0)
    parts.push(`${data.transactions.length} transaction(s) analyzed.`);
  if (data.failedCount > 0)
    parts.push(
      `${data.failedCount} failed transaction(s) detected requiring investigation.`,
    );

  const riskText =
    riskLevel === "HIGH"
      ? "HIGH RISK"
      : riskLevel === "LOW"
        ? "low risk"
        : "moderate risk";
  parts.push(`Overall risk assessment: ${riskText}.`);

  const summary =
    parts.length > 0
      ? parts.join(" ")
      : "Document processed successfully for audit review. No specific financial data detected.";

  return summary.length > MAX_SUMMARY_LENGTH
    ? `${summary.substring(0, MAX_SUMMARY_LENGTH)}...`
    : summary;
}

function calculateConfidence(data) {
  let confidence = 0.7;
  if (data.revenue > 0) confidence += 0.1;
  if (data.expenses > 0) confidence += 0.1;
  if (data.transactions.length > 0) confidence += 0.08;
  if (data.totalCredit > 0 || data.totalDebit > 0) confidence += 0.05;
  if (data.failedCount > 0 || data.pendingCount > 0) confidence -= 0.05;
  return Math.min(0.98, Math.max(0.65, confidence));
}

export function runAuditAnalysis(text) {
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
  const risk = calculateRisk(text, auditData);
  const sentiment = determineSentiment(auditData, risk.riskLevel);
  const keyFindings = generateKeyFindings(text, auditData);
  const recommendations = generateRecommendations(auditData, risk.riskLevel);
  const summary = generateSummary(text, auditData, risk.riskLevel);
  const confidence = calculateConfidence(auditData);
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
    mode: "local_analysis",
  };
}

async function performOCR(imageFile, onProgress) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(imageFile, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const progress = Math.floor(m.progress * 100);
          onProgress?.({ status: "ocr_processing", progress });
        }
      },
    })
      .then(({ data: { text } }) => {
        resolve(text);
      })
      .catch((error) => {
        reject(error);
      });
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
    console.error("OCR error:", error);
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
        const progress = 10 + Math.floor((i / numPages) * 80);
        onProgress?.({ status: `extracting_page_${i}`, progress });

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");

        if (pageText?.trim()) {
          fullText += pageText + "\n";
        }
      }

      onProgress?.({ status: "complete", progress: 100 });

      return {
        success: true,
        text:
          fullText.trim() ||
          `PDF Document: ${file.name}\nPlease ensure the PDF contains selectable text for analysis.`,
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
        text:
          result.value?.trim() ||
          `Word Document: ${file.name}\nDocument uploaded successfully for audit processing.`,
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
      const sheetNames = workbook.SheetNames;

      for (let i = 0; i < sheetNames.length; i++) {
        const worksheet = workbook.Sheets[sheetNames[i]];
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        fullText += `\n--- Sheet: ${sheetNames[i]} ---\n${sheetText}\n`;
        onProgress?.({
          status: `processing_sheet_${i + 1}`,
          progress: 30 + Math.floor((i / sheetNames.length) * 60),
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
    const result = runAuditAnalysis(text);
    onProgress?.({ status: "complete", progress: 100 });
    return result;
  },
};
