import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  AlertTitle,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DescriptionIcon from "@mui/icons-material/Description";
import WarningIcon from "@mui/icons-material/Warning";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TimelineIcon from "@mui/icons-material/Timeline";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { db } from "../database/db";
import { useAuth } from "../hooks/useAuth";

const PIE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const TREND_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const ANOMALY_KEYWORDS = ["failed", "error", "warning", "loss", "irregular"];

const MAX_RECENT_DOCS = 10;
const MAX_TRANSACTIONS_DISPLAY = 10;

function formatCurrency(amount, currency = "INR") {
  if (amount === null || amount === undefined) return "₹0";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Number(amount).toLocaleString()}`;
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateString);
  }
}

function getRiskColor(score) {
  if (score == null) return "#6b7280";
  if (score < 35) return "#10b981";
  if (score < 65) return "#f59e0b";
  return "#ef4444";
}

function getRiskLabel(score) {
  if (score == null) return "Not Available";
  if (score < 35) return "Low Risk";
  if (score < 65) return "Medium Risk";
  return "High Risk";
}

function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    case "low":
      return "#10b981";
    default:
      return "#6b7280";
  }
}

function detectDocumentType(text) {
  const lower = (text || "").toLowerCase();
  if (lower.includes("bank statement") || lower.includes("account statement"))
    return "bank_statement";
  if (lower.includes("invoice")) return "invoice";
  if (lower.includes("tax") || lower.includes("gst")) return "tax_document";
  if (lower.includes("receipt")) return "receipt";
  return "financial_document";
}

function safeParseJSON(value, fallback = []) {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function generateTrendDataFromTransactions(transactions) {
  if (!transactions || transactions.length === 0) {
    return TREND_MONTHS.map((month) => ({
      month,
      revenue: 0,
      expenses: 0,
      profit: 0,
    }));
  }

  const monthlyData = {};
  TREND_MONTHS.forEach((month) => {
    monthlyData[month] = { revenue: 0, expenses: 0 };
  });

  transactions.forEach((txn) => {
    const date = new Date(txn.date);
    const monthIndex = date.getMonth();
    const monthName = TREND_MONTHS[monthIndex];

    if (monthName && txn.status === "COMPLETED") {
      if (txn.type === "Credit") {
        monthlyData[monthName].revenue += txn.amount;
      } else if (txn.type === "Debit") {
        monthlyData[monthName].expenses += txn.amount;
      }
    }
  });

  return TREND_MONTHS.map((month) => ({
    month,
    revenue: monthlyData[month].revenue,
    expenses: monthlyData[month].expenses,
    profit: monthlyData[month].revenue - monthlyData[month].expenses,
  }));
}

function generateCategoryDataFromTransactions(transactions) {
  if (!transactions || transactions.length === 0) {
    return [{ name: "No Data", value: 1 }];
  }

  const debitTransactions = transactions.filter(
    (txn) => txn.type === "Debit" && txn.status === "COMPLETED",
  );
  const totalDebits = debitTransactions.reduce(
    (sum, txn) => sum + txn.amount,
    0,
  );

  if (totalDebits === 0) {
    return [{ name: "No Expenses", value: 1 }];
  }

  const categories = {};
  debitTransactions.forEach((txn) => {
    let category = "Other";
    const desc = (txn.description || txn.id || "").toLowerCase();

    if (desc.includes("salary") || desc.includes("payroll"))
      category = "Salaries";
    else if (desc.includes("marketing") || desc.includes("advertising"))
      category = "Marketing";
    else if (desc.includes("rent") || desc.includes("lease")) category = "Rent";
    else if (desc.includes("utility") || desc.includes("electricity"))
      category = "Utilities";
    else if (desc.includes("software") || desc.includes("subscription"))
      category = "Software";
    else if (desc.includes("travel") || desc.includes("transport"))
      category = "Travel";

    categories[category] = (categories[category] || 0) + txn.amount;
  });

  return Object.entries(categories).map(([name, value]) => ({ name, value }));
}

function parseAnomalies(findings) {
  return findings
    .filter((f) => {
      const text = typeof f === "string" ? f : f.finding || "";
      return ANOMALY_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));
    })
    .slice(0, 3)
    .map((f, idx) => ({
      type: `anomaly_${idx + 1}`,
      description: typeof f === "string" ? f : f.finding || f,
      severity: idx === 0 ? "high" : "medium",
    }));
}

function calculateFinancialMetrics(document, analysis) {
  const keyFindings = safeParseJSON(analysis.keyFindings, []);
  const recommendations = safeParseJSON(analysis.recommendations, []);
  const transactions = safeParseJSON(analysis.transactions, []);

  const revenue = analysis.revenue || 0;
  const expenses = analysis.expenses || 0;
  const netProfit = analysis.profit || 0;
  const profitMargin = analysis.profitMargin || 0;
  const riskScore = analysis.riskScore || 50;
  const anomaliesCount = analysis.anomalies || analysis.failedCount || 0;
  const totalCredit = analysis.totalCredit || 0;
  const totalDebit = analysis.totalDebit || 0;

  return {
    totalRevenue: revenue,
    totalExpenses: expenses,
    netProfit,
    profitMargin,
    riskScore,
    severity: analysis.riskLevel || "Medium",
    anomaliesCount,
    totalCredit,
    totalDebit,
    currency: "INR",
    revenueData: generateTrendDataFromTransactions(transactions),
    categoryData: generateCategoryDataFromTransactions(transactions),
    anomalies: parseAnomalies(keyFindings),
    keyFindings,
    recommendations,
    sentiment: analysis.sentiment || "Neutral",
    confidence: analysis.confidence || 0.8,
    wordCount: analysis.wordCount || 0,
    summary: analysis.summary || "",
    documentType: detectDocumentType(analysis.extractedText || ""),
    transactions,
    failedCount: analysis.failedCount || 0,
  };
}

const TransactionTable = React.memo(
  ({ transactions, isMobile, formatCurrencyFn }) => {
    if (!transactions?.length) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <ReceiptIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography color="textSecondary">
            No transaction data available
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead sx={{ bgcolor: "#6366f1" }}>
            <TableRow>
              {["Date", "Transaction ID", "Type", "Amount", "Status"].map(
                (h) => (
                  <TableCell
                    key={h}
                    align={h === "Amount" ? "right" : "left"}
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    {h}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.slice(0, MAX_TRANSACTIONS_DISPLAY).map((txn, idx) => (
              <TableRow key={`${txn.id}-${idx}`} hover>
                <TableCell>{txn.date}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {txn.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={txn.type}
                    size="small"
                    sx={{
                      bgcolor: txn.type === "Credit" ? "#10b981" : "#ef4444",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight="bold">
                    {formatCurrencyFn(txn.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={txn.status}
                    size="small"
                    sx={{
                      bgcolor:
                        txn.status === "COMPLETED"
                          ? "#10b981"
                          : txn.status === "FAILED"
                            ? "#ef4444"
                            : "#f59e0b",
                      color: "white",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {transactions.length > MAX_TRANSACTIONS_DISPLAY && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="textSecondary">
              Showing {MAX_TRANSACTIONS_DISPLAY} of {transactions.length}{" "}
              transactions
            </Typography>
          </Box>
        )}
      </TableContainer>
    );
  },
);

TransactionTable.displayName = "TransactionTable";

const KeyMetricsGrid = React.memo(({ metrics, isMobile }) => {
  const metricsData = [
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue, metrics.currency),
      icon: <AttachMoneyIcon />,
      bgColor: "#10b981",
    },
    {
      title: "Net Profit",
      value: formatCurrency(metrics.netProfit, metrics.currency),
      icon: metrics.netProfit >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />,
      bgColor: metrics.netProfit >= 0 ? "#10b981" : "#ef4444",
    },
    {
      title: "Profit Margin",
      value: `${metrics.profitMargin}%`,
      icon: <AssessmentIcon />,
      bgColor: "#6366f1",
    },
    {
      title: "Risk Score",
      value: metrics.riskScore,
      icon: <WarningIcon />,
      bgColor: getRiskColor(metrics.riskScore),
    },
    {
      title: "Sentiment",
      value: metrics.sentiment || "Neutral",
      icon: <TimelineIcon />,
      bgColor: getSeverityColor(metrics.severity),
    },
    {
      title: "Anomalies",
      value: metrics.anomaliesCount,
      icon: <ErrorIcon />,
      bgColor: "#f59e0b",
    },
  ];

  return (
    <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
      {metricsData.map((metric, idx) => (
        <Grid item xs={12} sm={6} md={4} key={idx}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: metric.bgColor,
              boxShadow: 3,
              transition: "transform 0.2s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.8)", mb: 1 }}
                  >
                    {metric.title}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ color: "#ffffff" }}
                  >
                    {metric.value}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    width: 48,
                    height: 48,
                    color: "white",
                  }}
                >
                  {metric.icon}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
});

KeyMetricsGrid.displayName = "KeyMetricsGrid";

const RevenueChart = React.memo(({ data, currency }) => {
  const hasData =
    data?.length > 0 && data.some((d) => d.revenue !== 0 || d.expenses !== 0);

  if (!hasData) {
    return (
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Revenue & Profit Analysis
          </Typography>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <BarChartIcon
              sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
            />
            <Typography color="textSecondary">
              No revenue data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Revenue & Profit Analysis
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Revenue vs Expenses vs Profit Trend (Last 6 Months)
        </Typography>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => formatCurrency(v, currency)}
            />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip
              formatter={(value, name) => [
                formatCurrency(value, currency),
                name === "profit"
                  ? "Profit"
                  : name === "revenue"
                    ? "Revenue"
                    : "Expenses",
              ]}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="#10b981"
              name="Revenue"
              barSize={40}
              radius={[8, 8, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="expenses"
              fill="#ef4444"
              name="Expenses"
              barSize={40}
              radius={[8, 8, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="profit"
              stroke="#6366f1"
              strokeWidth={3}
              name="Profit"
              dot={{ fill: "#6366f1", r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

RevenueChart.displayName = "RevenueChart";

const ExpenseDistribution = React.memo(({ data, currency }) => {
  const hasData =
    data?.length > 0 &&
    data.some(
      (d) => d.value !== 0 && d.name !== "No Data" && d.name !== "No Expenses",
    );

  if (!hasData) {
    return (
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Expense Distribution
          </Typography>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <PieChartIcon
              sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
            />
            <Typography color="textSecondary">
              No expense data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Expense Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <RechartsTooltip
              formatter={(value) => formatCurrency(value, currency)}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

ExpenseDistribution.displayName = "ExpenseDistribution";

const RiskAssessment = React.memo(({ metrics }) => {
  const riskScore = metrics.riskScore || 0;
  const riskColor = getRiskColor(riskScore);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Risk Assessment
        </Typography>

        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <CircularProgress
              variant="determinate"
              value={riskScore}
              size={120}
              thickness={8}
              sx={{ color: riskColor }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                {riskScore}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={getRiskLabel(riskScore)}
            sx={{
              mt: 2,
              display: "block",
              bgcolor: riskColor,
              color: "white",
              fontWeight: "bold",
              width: "fit-content",
              mx: "auto",
            }}
          />
        </Box>

        <LinearProgress
          variant="determinate"
          value={riskScore}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 2,
            "& .MuiLinearProgress-bar": { bgcolor: riskColor },
          }}
        />

        {metrics.anomalies?.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Detected Anomalies ({metrics.anomalies.length})
            </Typography>
            {metrics.anomalies.map((anomaly, idx) => (
              <Alert
                key={idx}
                severity={anomaly.severity === "high" ? "error" : "warning"}
                sx={{ mb: 1.5 }}
              >
                <AlertTitle>
                  {anomaly.type?.replace(/_/g, " ").toUpperCase()}
                </AlertTitle>
                {anomaly.description}
              </Alert>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
});

RiskAssessment.displayName = "RiskAssessment";

const InsightsPanel = React.memo(({ metrics }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Key Findings
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {metrics.keyFindings?.length > 0 ? (
            <List>
              {metrics.keyFindings.map((finding, idx) => (
                <ListItem key={idx} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#10b981", width: 32, height: 32 }}>
                      <CheckCircleIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={finding}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No specific findings available
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={6}>
      <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Recommendations
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {metrics.recommendations?.length > 0 ? (
            <List>
              {metrics.recommendations.map((rec, idx) => (
                <ListItem key={idx} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#6366f1", width: 32, height: 32 }}>
                      {idx + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={rec}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No specific recommendations available
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  </Grid>
));

InsightsPanel.displayName = "InsightsPanel";

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [error, setError] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

  const applyDocumentAnalysis = useCallback((doc, analysis) => {
    setSelectedDocument(doc);
    setSelectedAnalysis(analysis);
    const metrics = calculateFinancialMetrics(doc, analysis);
    setFinancialMetrics(metrics);
    const txns = safeParseJSON(analysis.transactions, []);
    setSelectedTransactions(txns);
    setShowTransactions(false);
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const docs = await db.documents
        .where("userId")
        .equals(user.id)
        .reverse()
        .limit(MAX_RECENT_DOCS)
        .toArray();

      if (docs.length === 0) {
        setRecentDocuments([]);
        setFinancialMetrics(null);
        setSelectedTransactions([]);
        return;
      }

      setRecentDocuments(docs);

      const latestDoc = docs[0];
      const analysis = await db.analyseResult
        .where("documentId")
        .equals(latestDoc.id)
        .first();

      if (analysis) {
        applyDocumentAnalysis(latestDoc, analysis);
      } else {
        setFinancialMetrics(null);
        setSelectedTransactions([]);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
      setFinancialMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [user, applyDocumentAnalysis]);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, loadDashboardData]);

  const handleDocumentSelect = useCallback(
    async (doc) => {
      try {
        const analysis = await db.analyseResult
          .where("documentId")
          .equals(doc.id)
          .first();

        if (analysis) {
          applyDocumentAnalysis(doc, analysis);
        } else {
          setError("No analysis found for this document");
        }
      } catch (err) {
        console.error("Failed to load document:", err);
        setError("Failed to load document analysis");
      }
    },
    [applyDocumentAnalysis],
  );

  const hasTransactionData = useMemo(
    () =>
      financialMetrics &&
      (financialMetrics.totalCredit > 0 ||
        financialMetrics.totalDebit > 0 ||
        financialMetrics.transactions?.length > 0),
    [financialMetrics],
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="textSecondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (!financialMetrics || recentDocuments.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CloudUploadIcon
          sx={{ fontSize: 80, color: "text.secondary", mb: 2 }}
        />
        <Typography variant="h5" gutterBottom>
          No Financial Data Available
        </Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          Upload and analyze documents to see your financial dashboard
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate("/upload")}
          startIcon={<CloudUploadIcon />}
          sx={{ background: "linear-gradient(90deg, #6366f1, #38bdf8)" }}
        >
          Upload Documents
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" mb={1}>
            Financial Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            AI-powered financial insights from your documents
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={loadDashboardData}
              color="primary"
              aria-label="Refresh"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => navigate("/upload")}
          >
            Upload More
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          {selectedDocument && (
            <Card
              sx={{
                borderRadius: 3,
                mb: 3,
                bgcolor: "background.paper",
                boxShadow: 2,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Avatar
                    sx={{
                      bgcolor: getRiskColor(financialMetrics.riskScore),
                      width: 56,
                      height: 56,
                    }}
                  >
                    <DescriptionIcon />
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="h6" fontWeight="bold" noWrap>
                      {selectedDocument.fileName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {financialMetrics.documentType
                        ?.replace(/_/g, " ")
                        .toUpperCase()}{" "}
                      • Analyzed on {formatDate(selectedDocument.scannedAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={`Confidence: ${(
                        financialMetrics.confidence * 100
                      ).toFixed(0)}%`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`Risk: ${financialMetrics.riskScore}`}
                      sx={{
                        bgcolor: getRiskColor(financialMetrics.riskScore),
                        color: "#ffffff",
                        fontWeight: "bold",
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {selectedAnalysis?.summary && (
            <Alert
              severity="info"
              sx={{ mb: 3, borderRadius: 3, boxShadow: 1 }}
            >
              <AlertTitle>Analysis Summary</AlertTitle>
              {selectedAnalysis.summary}
            </Alert>
          )}

          <KeyMetricsGrid metrics={financialMetrics} isMobile={isMobile} />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={6}>
              <RevenueChart
                data={financialMetrics.revenueData}
                currency={financialMetrics.currency}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <ExpenseDistribution
                data={financialMetrics.categoryData}
                currency={financialMetrics.currency}
              />
            </Grid>
          </Grid>

          {hasTransactionData && (
            <Card sx={{ borderRadius: 3, mb: 3, boxShadow: 2 }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  mb={2}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Transaction Summary
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowTransactions((prev) => !prev)}
                  >
                    {showTransactions
                      ? "Hide Details"
                      : "View All Transactions"}
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {[
                    {
                      label: "Total Credit",
                      value: formatCurrency(financialMetrics.totalCredit),
                      bg: "#10b981",
                    },
                    {
                      label: "Total Debit",
                      value: formatCurrency(financialMetrics.totalDebit),
                      bg: "#ef4444",
                    },
                    {
                      label: "Failed Transactions",
                      value:
                        financialMetrics.failedCount ||
                        financialMetrics.anomaliesCount ||
                        0,
                      bg: "#f59e0b",
                    },
                  ].map((item) => (
                    <Grid item xs={4} key={item.label}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          bgcolor: item.bg,
                          color: "white",
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="caption">{item.label}</Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {showTransactions && (
                  <Box sx={{ mt: 3 }}>
                    <TransactionTable
                      transactions={financialMetrics.transactions || []}
                      isMobile={isMobile}
                      formatCurrencyFn={formatCurrency}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          <Box sx={{ mb: 3 }}>
            <RiskAssessment metrics={financialMetrics} />
          </Box>

          <InsightsPanel metrics={financialMetrics} />
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 2,
              position: "sticky",
              top: 70,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "#6366f1",
                color: "white",
                borderRadius: "12px 12px 0 0",
              }}
            >
              <Typography variant="h6">Recent Documents</Typography>
              <Typography variant="caption">
                {recentDocuments.length} document(s)
              </Typography>
            </Box>

            {recentDocuments.length > 0 ? (
              <List sx={{ maxHeight: 500, overflow: "auto" }}>
                {recentDocuments.map((doc, index) => (
                  <ListItemButton
                    key={doc.id}
                    onClick={() => handleDocumentSelect(doc)}
                    selected={selectedDocument?.id === doc.id}
                    divider={index < recentDocuments.length - 1}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "#10b981" }}>
                        <DescriptionIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {doc.fileName.length > 25
                            ? `${doc.fileName.substring(0, 25)}...`
                            : doc.fileName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(doc.scannedAt)}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <DescriptionIcon
                  sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="textSecondary">
                  No documents yet
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => navigate("/upload")}
                >
                  Upload Now
                </Button>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialDashboard;
