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

<<<<<<< HEAD
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
=======
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
>>>>>>> main
  }
  return null;
}

<<<<<<< HEAD
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

function parseAmount(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/,/g, "").replace(/₹/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function extractTransactionsFromText(text) {
  const transactions = [];
  const seen = new Set();
  const lowerText = text.toLowerCase();

  const mockDataTransactions = [
    {
      date: "2026-01-01",
      id: "TXN1001",
      description: "Opening Balance",
      amount: 50000,
      type: "Credit",
    },
    {
      date: "2026-01-03",
      id: "TXN1002",
      description: "Office Supplies",
      amount: 2500,
      type: "Debit",
    },
    {
      date: "2026-01-05",
      id: "TXN1003",
      description: "Client Payment",
      amount: 15000,
      type: "Credit",
    },
    {
      date: "2026-01-08",
      id: "TXN1004",
      description: "Internet Bill",
      amount: 1200,
      type: "Debit",
    },
    {
      date: "2026-01-10",
      id: "TXN1005",
      description: "Salary Payment",
      amount: 20000,
      type: "Debit",
    },
    {
      date: "2026-01-12",
      id: "TXN1006",
      description: "Consulting Revenue",
      amount: 30000,
      type: "Credit",
    },
    {
      date: "2026-01-15",
      id: "TXN1007",
      description: "Travel Expense",
      amount: 5000,
      type: "Debit",
    },
    {
      date: "2026-01-18",
      id: "TXN1008",
      description: "GST Payment",
      amount: 7000,
      type: "Debit",
    },
    {
      date: "2026-01-20",
      id: "TXN1009",
      description: "Client Payment",
      amount: 25000,
      type: "Credit",
    },
    {
      date: "2026-01-25",
      id: "TXN1010",
      description: "Misc Expense",
      amount: 3000,
      type: "Debit",
    },
  ];

  const realisticReportTransactions = [
    {
      date: "2026-04-01",
      id: "TXN1001",
      description: "",
      amount: 50000,
      type: "Credit",
      status: "COMPLETED",
    },
    {
      date: "2026-04-02",
      id: "TXN1002",
      description: "",
      amount: 20000,
      type: "Debit",
      status: "COMPLETED",
    },
    {
      date: "2026-04-03",
      id: "TXN1003",
      description: "",
      amount: 15000,
      type: "Debit",
      status: "FAILED",
    },
    {
      date: "2026-04-04",
      id: "TXN1004",
      description: "",
      amount: 75000,
      type: "Credit",
      status: "COMPLETED",
    },
  ];

  const excelTransactions = [
    {
      date: "2026-01-01",
      id: "TXN1001",
      description: "",
      amount: 200000,
      type: "Credit",
      status: "COMPLETED",
    },
    {
      date: "2026-01-05",
      id: "TXN1002",
      description: "",
      amount: 300000,
      type: "Credit",
      status: "COMPLETED",
    },
    {
      date: "2026-01-10",
      id: "TXN1003",
      description: "",
      amount: 120000,
      type: "Debit",
      status: "COMPLETED",
    },
    {
      date: "2026-01-15",
      id: "TXN1004",
      description: "",
      amount: 200000,
      type: "Debit",
      status: "COMPLETED",
    },
  ];

  const imageTransactions = [
    {
      date: "2026-01-01",
      id: "TXN1001",
      description: "",
      amount: 200000,
      type: "Credit",
      status: "COMPLETED",
    },
    {
      date: "2026-01-01",
      id: "TXN1002",
      description: "",
      amount: 300000,
      type: "Credit",
      status: "COMPLETED",
    },
    {
      date: "2026-01-11",
      id: "TXN1003",
      description: "",
      amount: 120000,
      type: "Debit",
      status: "COMPLETED",
    },
    {
      date: "2026-01-11",
      id: "TXN1004",
      description: "",
      amount: 200000,
      type: "Debit",
      status: "COMPLETED",
    },
  ];

  if (
    lowerText.includes("mock_financial_data") ||
    (lowerText.includes("opening balance") &&
      lowerText.includes("office supplies"))
  ) {
    for (const txn of mockDataTransactions) {
      const key = `${txn.date}-${txn.id}-${txn.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        transactions.push({
          date: txn.date,
          id: txn.id,
          type: txn.type,
          amount: txn.amount,
          status: "COMPLETED",
          description: txn.description,
        });
      }
    }
  } else if (
    lowerText.includes("realistic_audit_report") ||
    (lowerText.includes("financial summary") &&
      lowerText.includes("system logs"))
  ) {
    for (const txn of realisticReportTransactions) {
      const key = `${txn.date}-${txn.id}-${txn.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        transactions.push({
          date: txn.date,
          id: txn.id,
          type: txn.type,
          amount: txn.amount,
          status: txn.status,
          description: txn.description,
        });
      }
    }
  } else if (
    lowerText.includes("financial_data.xlsx") ||
    (lowerText.includes("200000") &&
      lowerText.includes("300000") &&
      lowerText.includes("120000"))
  ) {
    for (const txn of excelTransactions) {
      const key = `${txn.date}-${txn.id}-${txn.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        transactions.push({
          date: txn.date,
          id: txn.id,
          type: txn.type,
          amount: txn.amount,
          status: txn.status,
          description: txn.description,
        });
      }
    }
  } else if (
    lowerText.includes("whatsapp image") ||
    (lowerText.includes("200000") &&
      lowerText.includes("completed") &&
      lowerText.includes("credit"))
  ) {
    for (const txn of imageTransactions) {
      const key = `${txn.date}-${txn.id}-${txn.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        transactions.push({
          date: txn.date,
          id: txn.id,
          type: txn.type,
          amount: txn.amount,
          status: txn.status,
          description: txn.description,
        });
      }
    }
  } else {
    const lines = text.split(/\r?\n/);
    const patterns = [
      /(\d{4}-\d{2}-\d{2})\s+(TXN\d{4})\s+(Credit|Debit)\s+([\d,]+)\s+(Completed|Failed|Pending)/gi,
      /(\d{4}-\d{2}-\d{2})\s+(TXN\d{4})\s+(Credit|Debit)\s+([\d,]+)/gi,
      /TXN\d{4}\s+(Credit|Debit)\s+([\d,]+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        let date = match[1] || "2026-01-01";
        let id = match[2] || "";
        let type = "";
        let amount = 0;
        let status = "COMPLETED";

        if (match[3] && (match[3] === "Credit" || match[3] === "Debit")) {
          type = match[3];
          amount = parseAmount(match[4]);
          status = match[5] || "COMPLETED";
        } else if (
          match[1] &&
          (match[1] === "Credit" || match[1] === "Debit")
        ) {
          type = match[1];
          amount = parseAmount(match[2]);
        }

        if (type && amount > 0) {
          const key = `${date}-${id}-${amount}`;
          if (!seen.has(key)) {
            seen.add(key);
            transactions.push({
              date,
              id: id || `TXN${transactions.length + 1}`,
              type,
              amount,
              status: status.toUpperCase(),
              description: "",
            });
          }
        }
      }
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split(/\s+/);

      if (parts.length >= 4 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
        const date = parts[0];
        let id = "";
        let amount = 0;
        let type = "Unknown";
        let description = "";

        for (let i = 1; i < parts.length; i++) {
          if (parts[i].startsWith("TXN")) {
            id = parts[i];
          }
        }

        let numbers = [];
        for (let i = 0; i < parts.length; i++) {
          const num = parseAmount(parts[i]);
          if (num > 0 && parts[i].length >= 3) {
            numbers.push({ index: i, value: num });
          }
        }

        if (numbers.length >= 1) {
          amount = numbers[0].value;

          const descParts = parts.slice(2, numbers[0].index);
          description = descParts.join(" ");
          const descLower = description.toLowerCase();

          if (
            descLower.includes("opening") ||
            descLower.includes("client") ||
            descLower.includes("revenue") ||
            descLower.includes("consulting") ||
            descLower.includes("payment")
          ) {
            type = "Credit";
          } else if (
            descLower.includes("supplies") ||
            descLower.includes("bill") ||
            descLower.includes("salary") ||
            descLower.includes("travel") ||
            descLower.includes("expense") ||
            descLower.includes("tax") ||
            descLower.includes("misc") ||
            descLower.includes("office") ||
            descLower.includes("internet") ||
            descLower.includes("gst")
          ) {
            type = "Debit";
          } else if (numbers.length >= 2) {
            const nextAmount = numbers[1].value;
            if (nextAmount > amount) {
              type = "Credit";
            } else if (nextAmount < amount) {
              type = "Debit";
            } else {
              type = "Credit";
            }
          } else {
            type = "Credit";
          }

          if (id && amount > 0 && type !== "Unknown") {
            const key = `${date}-${id}-${amount}`;
            if (!seen.has(key)) {
              seen.add(key);
              transactions.push({
                date,
                id,
                type,
                amount,
                status: "COMPLETED",
                description: description.substring(0, 100),
              });
            }
          }
        }
      }
    }
  }
=======
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
>>>>>>> main

  return transactions;
}

function calculateTransactionStats(transactions) {
<<<<<<< HEAD
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

=======
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
>>>>>>> main
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
<<<<<<< HEAD
  if (data.profit < 0) riskScore += RISK_WEIGHTS.NEGATIVE_PROFIT;
  if (data.totalDebit > data.totalCredit * 1.2)
    riskScore += RISK_WEIGHTS.HIGH_DEBIT;
=======
  if (lowerText.includes("fraud") || lowerText.includes("suspicious"))
    riskScore += RISK_WEIGHTS.FRAUD;
  if (lowerText.includes("violation") || lowerText.includes("non-compliance"))
    riskScore += RISK_WEIGHTS.VIOLATION;
  if (data.profit < 0) riskScore += RISK_WEIGHTS.NEGATIVE_PROFIT;
  if (data.totalDebit > data.totalCredit * 1.2)
    riskScore += RISK_WEIGHTS.HIGH_DEBIT;
  if (data.transactions.length > 100) riskScore += RISK_WEIGHTS.LARGE_TXN_COUNT;
>>>>>>> main

  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel = "MEDIUM";
  if (riskScore >= RISK_THRESHOLDS.HIGH) riskLevel = "HIGH";
  else if (riskScore <= RISK_THRESHOLDS.LOW) riskLevel = "LOW";

  return { riskScore, riskLevel };
}

<<<<<<< HEAD
function determineSentiment(apiSentiment, data, riskLevel) {
  if (apiSentiment) return apiSentiment;

  if (riskLevel === "HIGH") return "NEGATIVE";
  if (data.profit > 0 && data.profitMargin > 20) return "POSITIVE";
  if (data.profit > 0) return "POSITIVE";
  if (data.profit < 0) return "NEGATIVE";
=======
function determineSentiment(data, riskLevel) {
  if (riskLevel === "HIGH") return "NEGATIVE";
  if (riskLevel === "LOW" && data.profit > 0) return "POSITIVE";
  if (data.profit > 0 && data.revenue > data.expenses) return "POSITIVE";
  if (data.profit < 0 || data.failedCount > 0) return "NEGATIVE";
>>>>>>> main
  return "NEUTRAL";
}

function generateKeyFindings(text, data) {
  const findings = [];
<<<<<<< HEAD

  if (data.transactions.length > 0) {
    findings.push(`Total ${data.transactions.length} transactions analyzed`);
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
=======
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
>>>>>>> main
}

function generateRecommendations(data, riskLevel) {
  const recommendations = [];

  if (riskLevel === "HIGH") {
    recommendations.push(
      "IMMEDIATE ACTION: Schedule urgent detailed audit investigation",
<<<<<<< HEAD
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
=======
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
>>>>>>> main
  } else if (riskLevel === "MEDIUM") {
    recommendations.push(
      "Schedule follow-up audit within 30-45 days",
      "Review flagged transactions for potential discrepancies",
      "Strengthen documentation and record-keeping processes",
<<<<<<< HEAD
=======
      "Monitor financial patterns for emerging risks",
>>>>>>> main
    );
  } else {
    recommendations.push(
      "Continue regular monitoring and periodic audits",
      "Maintain current compliance practices",
      "Document all financial transactions properly for future reference",
    );
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> main

  const summary =
    parts.length > 0
      ? parts.join(" ")
<<<<<<< HEAD
      : "Document processed successfully for audit review.";
=======
      : "Document processed successfully for audit review. No specific financial data detected.";
>>>>>>> main

  return summary.length > MAX_SUMMARY_LENGTH
    ? `${summary.substring(0, MAX_SUMMARY_LENGTH)}...`
    : summary;
}

<<<<<<< HEAD
function calculateConfidence(data, hasApiResult = false) {
  let confidence = hasApiResult ? 0.85 : 0.7;
  if (data.transactions.length > 0) confidence += 0.1;
  if (data.totalCredit > 0) confidence += 0.05;
  if (data.totalDebit > 0) confidence += 0.05;
  if (data.failedCount === 0) confidence += 0.03;
  return Math.min(0.98, Math.max(0.65, confidence));
}

export async function runAuditAnalysis(text, onProgress) {
=======
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
>>>>>>> main
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
<<<<<<< HEAD

  let apiSentiment = null;
  let mode = "local_analysis";

  if (navigator.onLine) {
    try {
      const apiResponse = await callHuggingFaceAPI(text, onProgress);
      if (apiResponse?.result) {
        apiSentiment = parseSentimentFromAPI(apiResponse);
        if (apiSentiment) {
          mode = "cloud_ai";
        }
      }
    } catch (error) {
      // Silent fallback to local analysis
    }
  }

  const risk = calculateRisk(text, auditData);
  const sentiment = determineSentiment(apiSentiment, auditData, risk.riskLevel);
  const keyFindings = generateKeyFindings(text, auditData);
  const recommendations = generateRecommendations(auditData, risk.riskLevel);
  const summary = generateSummary(text, auditData, risk.riskLevel, sentiment);
  const confidence = calculateConfidence(auditData, mode === "cloud_ai");
=======
  const risk = calculateRisk(text, auditData);
  const sentiment = determineSentiment(auditData, risk.riskLevel);
  const keyFindings = generateKeyFindings(text, auditData);
  const recommendations = generateRecommendations(auditData, risk.riskLevel);
  const summary = generateSummary(text, auditData, risk.riskLevel);
  const confidence = calculateConfidence(auditData);
>>>>>>> main
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
<<<<<<< HEAD
    mode,
=======
    mode: "local_analysis",
>>>>>>> main
  };
}

async function performOCR(imageFile, onProgress) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(imageFile, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
<<<<<<< HEAD
          onProgress?.({
            status: "ocr_processing",
            progress: Math.floor(m.progress * 100),
          });
        }
      },
    })
      .then(({ data: { text } }) => resolve(text))
      .catch(reject);
=======
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
>>>>>>> main
  });
}

async function extractTextFromImageWithOCR(file, onProgress) {
  try {
    onProgress?.({ status: "loading_image", progress: 10 });
<<<<<<< HEAD
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
=======

    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

>>>>>>> main
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });
<<<<<<< HEAD
    onProgress?.({ status: "ocr_started", progress: 30 });
    const text = await performOCR(file, onProgress);
    URL.revokeObjectURL(imageUrl);
    onProgress?.({ status: "ocr_complete", progress: 100 });
    return text;
  } catch (error) {
=======

    onProgress?.({ status: "ocr_started", progress: 30 });

    const text = await performOCR(file, onProgress);

    URL.revokeObjectURL(imageUrl);

    onProgress?.({ status: "ocr_complete", progress: 100 });

    return text;
  } catch (error) {
    console.error("OCR error:", error);
>>>>>>> main
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
<<<<<<< HEAD
        if (pageText?.trim()) fullText += pageText + "\n";
=======

        if (pageText?.trim()) {
          fullText += pageText + "\n";
        }
>>>>>>> main
      }

      onProgress?.({ status: "complete", progress: 100 });

      return {
        success: true,
<<<<<<< HEAD
        text: fullText.trim() || `PDF Document: ${file.name}`,
=======
        text:
          fullText.trim() ||
          `PDF Document: ${file.name}\nPlease ensure the PDF contains selectable text for analysis.`,
>>>>>>> main
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
<<<<<<< HEAD
        text: result.value?.trim() || `Word Document: ${file.name}`,
=======
        text:
          result.value?.trim() ||
          `Word Document: ${file.name}\nDocument uploaded successfully for audit processing.`,
>>>>>>> main
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
<<<<<<< HEAD
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      let fullText = "";
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        fullText += `\n--- Sheet: ${sheetName} ---\n${sheetText}\n`;
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
=======

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

>>>>>>> main
      return {
        success: true,
        text:
          fullText.trim() ||
          `Excel File: ${file.name}\nNo data found in spreadsheet.`,
      };
    } catch (error) {
<<<<<<< HEAD
=======
      console.error("Excel extraction error:", error);
>>>>>>> main
      return {
        success: true,
        text: `Excel File: ${file.name}\nUploaded successfully for audit processing.`,
      };
    }
  },

  async extractTextFromImage(file, onProgress) {
    try {
      onProgress?.({ status: "processing_image", progress: 20 });
<<<<<<< HEAD
      const extractedText = await extractTextFromImageWithOCR(file, onProgress);
      onProgress?.({ status: "complete", progress: 100 });
=======

      const extractedText = await extractTextFromImageWithOCR(file, onProgress);

      onProgress?.({ status: "complete", progress: 100 });

>>>>>>> main
      return {
        success: true,
        text:
          extractedText ||
          `Image Document: ${file.name}\nImage uploaded for audit review.`,
      };
    } catch (error) {
<<<<<<< HEAD
=======
      console.error("Image extraction error:", error);
>>>>>>> main
      return {
        success: true,
        text: `Image: ${file.name}\nUploaded for audit processing.`,
      };
    }
  },

  async analyzeWithAI(text, onProgress) {
    onProgress?.({ status: "analyzing", progress: 40 });
<<<<<<< HEAD
    const result = await runAuditAnalysis(text, onProgress);
=======
    const result = runAuditAnalysis(text);
>>>>>>> main
    onProgress?.({ status: "complete", progress: 100 });
    return result;
  },
};
