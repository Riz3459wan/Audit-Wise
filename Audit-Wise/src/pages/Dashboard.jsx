import React, { useState, useEffect } from "react";
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
import {
  LineChart,
  Line,
  BarChart,
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
  ComposedChart,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { db } from "../database/db";
import { useAuth } from "../hooks/useAuth";

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

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const docs = await db.documents
        .where("userId")
        .equals(user.id)
        .reverse()
        .limit(10)
        .toArray();

      if (docs.length > 0) {
        setRecentDocuments(docs);
        const latestDoc = docs[0];
        const analysis = await db.analyseResult
          .where("documentId")
          .equals(latestDoc.id)
          .first();

        if (analysis) {
          setSelectedDocument(latestDoc);
          setSelectedAnalysis(analysis);
          const metrics = calculateFinancialMetrics(latestDoc, analysis);
          setFinancialMetrics(metrics);
        } else {
          setFinancialMetrics(null);
        }
      } else {
        setFinancialMetrics(null);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data");
      setFinancialMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialMetrics = (document, analysis) => {
    const extractedText = analysis.extractedText || "";

    let keyFindings = [];
    let recommendations = [];

    try {
      if (analysis.keyFindings) {
        keyFindings =
          typeof analysis.keyFindings === "string"
            ? JSON.parse(analysis.keyFindings)
            : analysis.keyFindings;
      }
    } catch {
      keyFindings = [];
    }

    try {
      if (analysis.recommendations) {
        recommendations =
          typeof analysis.recommendations === "string"
            ? JSON.parse(analysis.recommendations)
            : analysis.recommendations;
      }
    } catch {
      recommendations = [];
    }

    const numbers = extractNumbers(extractedText);

    let totalRevenue = 0;
    let totalExpenses = 0;
    let netProfit = 0;
    let profitMargin = 0;

    if (numbers.length >= 2) {
      const sorted = numbers.sort((a, b) => b - a);
      totalRevenue = sorted[0] || 0;
      totalExpenses = sorted[1] || 0;
      netProfit = totalRevenue - totalExpenses;
      profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    }

    const revenueData = generateTrendData(totalRevenue, totalExpenses);
    const categoryData = generateCategoryData(totalExpenses);
    const riskScore = mapRiskLevelToScore(analysis.riskLevel);
    const anomaliesCount = countAnomaliesInText(extractedText, keyFindings);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      riskScore,
      severity: analysis.riskLevel || "Medium",
      anomaliesCount,
      currency: detectCurrency(extractedText),
      revenueData,
      categoryData,
      anomalies: parseAnomalies(keyFindings),
      keyFindings: keyFindings.map((f) =>
        typeof f === "string" ? f : f.finding || "",
      ),
      recommendations: recommendations.map((r) =>
        typeof r === "string" ? r : r.recommendation || "",
      ),
      sentiment: analysis.sentiment || "Neutral",
      confidence: analysis.confidence || 0.8,
      wordCount: analysis.wordCount || 0,
      summary: analysis.summary || "",
      documentType: detectDocumentType(extractedText),
    };
  };

  const extractNumbers = (text) => {
    if (!text) return [];
    const matches = text.match(/\d+(?:,\d{3})*(?:\.\d{2})?/g) || [];
    return matches
      .map((m) => parseFloat(m.replace(/,/g, "")))
      .filter((n) => n > 100 && n < 10000000)
      .slice(0, 10);
  };

  const detectCurrency = (text) => {
    if (!text) return "INR";
    if (text.includes("₹") || text.includes("INR")) return "INR";
    if (text.includes("$") || text.includes("USD")) return "USD";
    if (text.includes("€") || text.includes("EUR")) return "EUR";
    return "INR";
  };

  const mapRiskLevelToScore = (riskLevel) => {
    const level = (riskLevel || "medium").toLowerCase();
    if (level.includes("low")) return 25;
    if (level.includes("medium") || level.includes("moderate")) return 50;
    if (level.includes("high")) return 75;
    return 50;
  };

  const countAnomaliesInText = (text, findings) => {
    let count = 0;
    const anomalyKeywords = [
      "unusual",
      "anomaly",
      "irregular",
      "suspicious",
      "warning",
      "alert",
    ];
    const lowerText = (text || "").toLowerCase();
    anomalyKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) count++;
    });
    return Math.max(count, findings.length > 0 ? 1 : 0);
  };

  const parseAnomalies = (findings) => {
    return findings
      .filter((f) => {
        const text = typeof f === "string" ? f : f.finding || "";
        return (
          text.toLowerCase().includes("unusual") ||
          text.toLowerCase().includes("anomaly") ||
          text.toLowerCase().includes("warning")
        );
      })
      .slice(0, 3)
      .map((f, idx) => ({
        type: `anomaly_${idx + 1}`,
        description: typeof f === "string" ? f : f.finding || f,
        severity: idx === 0 ? "high" : "medium",
      }));
  };

  const detectDocumentType = (text) => {
    const lowerText = (text || "").toLowerCase();
    if (
      lowerText.includes("bank statement") ||
      lowerText.includes("account statement")
    )
      return "bank_statement";
    if (lowerText.includes("invoice")) return "invoice";
    if (lowerText.includes("tax") || lowerText.includes("gst"))
      return "tax_document";
    if (lowerText.includes("receipt")) return "receipt";
    return "financial_document";
  };

  const generateTrendData = (revenue, expenses) => {
    const months = ["Jan", "Feb", "Mar"];
    return months.map((month, idx) => {
      const variance = 0.85 + idx * 0.075;
      const r = Math.round(revenue * variance);
      const e = Math.round(expenses * variance);
      return {
        month,
        revenue: r,
        expenses: e,
        profit: r - e,
      };
    });
  };

  const generateCategoryData = (totalExpenses) => {
    const categories = [
      { name: "Operations", percentage: 0.4 },
      { name: "Salaries", percentage: 0.3 },
      { name: "Marketing", percentage: 0.15 },
      { name: "Utilities", percentage: 0.1 },
      { name: "Other", percentage: 0.05 },
    ];

    return categories.map((cat) => ({
      name: cat.name,
      value: Math.round(totalExpenses * cat.percentage),
    }));
  };

  const formatCurrency = (amount, currency = "INR") => {
    if (amount === null || amount === undefined) return "N/A";
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (err) {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      return dateString;
    }
  };

  const getRiskColor = (score) => {
    if (!score && score !== 0) return "#6b7280";
    if (score < 30) return "#10b981";
    if (score < 60) return "#f59e0b";
    return "#ef4444";
  };

  const getRiskLabel = (score) => {
    if (!score && score !== 0) return "Not Available";
    if (score < 30) return "Low Risk";
    if (score < 60) return "Medium Risk";
    return "High Risk";
  };

  const getSeverityColor = (severity) => {
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
  };

  const handleDocumentSelect = async (doc) => {
    try {
      const analysis = await db.analyseResult
        .where("documentId")
        .equals(doc.id)
        .first();

      if (analysis) {
        setSelectedDocument(doc);
        setSelectedAnalysis(analysis);
        const metrics = calculateFinancialMetrics(doc, analysis);
        setFinancialMetrics(metrics);
      }
    } catch (err) {
      console.error("Failed to load document:", err);
      setError("Failed to load document analysis");
    }
  };

  const KeyMetricsGrid = ({ metrics }) => {
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
        icon:
          metrics.netProfit >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />,
        bgColor: metrics.netProfit >= 0 ? "#10b981" : "#ef4444",
      },
      {
        title: "Profit Margin",
        value: `${metrics.profitMargin.toFixed(1)}%`,
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
        icon: <WarningIcon />,
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
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
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
  };

  const RevenueChart = ({ data, currency }) => {
    if (
      !data ||
      data.length === 0 ||
      (data[0].revenue === 0 && data[0].expenses === 0)
    ) {
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
            Revenue vs Expenses vs Profit Trend
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                yAxisId="left"
                tickFormatter={(value) => formatCurrency(value, currency)}
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
  };

  const ExpenseDistribution = ({ data, currency }) => {
    if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
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

    const COLORS = [
      "#6366f1",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];

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
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
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
  };

  const RiskAssessment = ({ metrics }) => {
    const riskScore = metrics.riskScore || 0;

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
                sx={{ color: getRiskColor(riskScore) }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
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
                bgcolor: getRiskColor(riskScore),
                color: "white",
                fontWeight: "bold",
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
              "& .MuiLinearProgress-bar": { bgcolor: getRiskColor(riskScore) },
            }}
          />

          {metrics.anomalies && metrics.anomalies.length > 0 && (
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
  };

  const InsightsPanel = ({ metrics }) => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Key Findings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {metrics.keyFindings && metrics.keyFindings.length > 0 ? (
                <List>
                  {metrics.keyFindings.map((finding, idx) => (
                    <ListItem key={idx} disablePadding>
                      <ListItemAvatar>
                        <Avatar
                          sx={{ bgcolor: "#10b981", width: 32, height: 32 }}
                        >
                          {idx + 1}
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
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recommendations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {metrics.recommendations && metrics.recommendations.length > 0 ? (
                <List>
                  {metrics.recommendations.map((rec, idx) => (
                    <ListItem key={idx} disablePadding>
                      <ListItemAvatar>
                        <Avatar
                          sx={{ bgcolor: "#6366f1", width: 32, height: 32 }}
                        >
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
    );
  };

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
            <IconButton onClick={loadDashboardData} color="primary">
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
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedDocument.fileName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {financialMetrics.documentType
                        ?.replace(/_/g, " ")
                        .toUpperCase()}{" "}
                      • Analyzed on {formatDate(selectedDocument.scannedAt)}
                    </Typography>
                  </Box>
                  <Box>
                    <Chip
                      label={`Confidence: ${(financialMetrics.confidence * 100).toFixed(0)}%`}
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1 }}
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

          <KeyMetricsGrid metrics={financialMetrics} />

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

          <Box sx={{ mb: 3 }}>
            <RiskAssessment metrics={financialMetrics} />
          </Box>

          <InsightsPanel metrics={financialMetrics} />
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            sx={{ borderRadius: 3, boxShadow: 2, position: "sticky", top: 20 }}
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
                            ? doc.fileName.substring(0, 25) + "..."
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
