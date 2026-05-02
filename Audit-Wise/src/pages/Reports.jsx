import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Stack,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as JsonIcon,
  TextSnippet as CsvIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { db } from "../database/db";
import useDebounce from "../hooks/UseDebounce";

const Reports = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

  useEffect(() => {
    let filtered = [...reports];

    if (debouncedSearch) {
      filtered = filtered.filter(
        (report) =>
          report.fileName
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          report.summary
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          report.sentiment
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      );
    }

    if (tabValue === 1) {
      filtered = filtered.filter((report) => report.riskLevel === "HIGH");
    } else if (tabValue === 2) {
      filtered = filtered.filter((report) => report.riskLevel === "MEDIUM");
    } else if (tabValue === 3) {
      filtered = filtered.filter((report) => report.riskLevel === "LOW");
    }

    setFilteredReports(filtered);
    setPage(0);
  }, [debouncedSearch, reports, tabValue]);

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const documents = await db.documents
        .where("userId")
        .equals(user.id)
        .reverse()
        .toArray();

      const reportsWithData = [];

      for (const doc of documents) {
        const analysis = await db.analyseResult
          .where("documentId")
          .equals(doc.id)
          .first();

        if (analysis) {
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

          reportsWithData.push({
            id: doc.id,
            documentId: doc.id,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            fileType: doc.fileType,
            analyzedAt: doc.scannedAt,
            sentiment: analysis.sentiment || "Neutral",
            confidence: analysis.confidence || 0.8,
            riskLevel: analysis.riskLevel || "Medium",
            summary: analysis.summary || "",
            keyFindings: keyFindings,
            recommendations: recommendations,
            extractedText: analysis.extractedText || doc.extractedText || "",
            wordCount: analysis.wordCount || 0,
            modelUsed: analysis.modelUsed || "local-analysis",
          });
        }
      }

      setReports(reportsWithData);
      setFilteredReports(reportsWithData);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleDeleteReport = async () => {
    if (!selectedReport) return;

    try {
      await db.documents.delete(selectedReport.documentId);
      await db.analyseResult
        .where("documentId")
        .equals(selectedReport.documentId)
        .delete();
      await loadReports();
      setDeleteDialogOpen(false);
      setSelectedReport(null);
    } catch (err) {
      setError("Failed to delete report");
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case "HIGH":
        return "#ef4444";
      case "MEDIUM":
        return "#f59e0b";
      case "LOW":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case "POSITIVE":
        return <TrendingUpIcon sx={{ color: "#10b981" }} />;
      case "NEGATIVE":
        return <TrendingDownIcon sx={{ color: "#ef4444" }} />;
      default:
        return <CheckCircleIcon sx={{ color: "#6366f1" }} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: isMobile ? undefined : "2-digit",
        minute: isMobile ? undefined : "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const generateHTMLReport = (report) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AuditWise Report - ${report.fileName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; background: #f8fafc; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #6366f1, #38bdf8); color: white; padding: 30px; border-radius: 16px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .meta { font-size: 14px; opacity: 0.9; }
          .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section-title { font-size: 20px; font-weight: bold; color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 8px; margin-bottom: 20px; }
          .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
          .metric-card { background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; }
          .metric-label { font-size: 14px; color: #64748b; margin-bottom: 8px; }
          .metric-value { font-size: 28px; font-weight: bold; }
          .risk-high { color: #ef4444; }
          .risk-medium { color: #f59e0b; }
          .risk-low { color: #10b981; }
          .findings-list, .recommendations-list { margin-left: 24px; }
          .findings-list li, .recommendations-list li { margin-bottom: 8px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
          @media (max-width: 768px) {
            body { padding: 12px; }
            .header { padding: 20px; }
            .title { font-size: 22px; }
            .metrics { grid-template-columns: 1fr; }
            .section { padding: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">AuditWise Analysis Report</div>
            <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Document Information</div>
            <p><strong>File Name:</strong> ${report.fileName}</p>
            <p><strong>File Size:</strong> ${formatFileSize(report.fileSize)}</p>
            <p><strong>Analyzed On:</strong> ${formatDate(report.analyzedAt)}</p>
            <p><strong>Analysis Model:</strong> ${report.modelUsed}</p>
          </div>
          
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-label">Sentiment</div>
              <div class="metric-value">${report.sentiment}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Confidence</div>
              <div class="metric-value">${(report.confidence * 100).toFixed(1)}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Risk Level</div>
              <div class="metric-value risk-${report.riskLevel?.toLowerCase()}">${report.riskLevel}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Word Count</div>
              <div class="metric-value">${report.wordCount}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Summary</div>
            <p>${report.summary || "No summary available"}</p>
          </div>
          
          ${
            report.keyFindings && report.keyFindings.length > 0
              ? `
          <div class="section">
            <div class="section-title">Key Findings</div>
            <ul class="findings-list">
              ${report.keyFindings.map((finding) => `<li>${finding}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }
          
          ${
            report.recommendations && report.recommendations.length > 0
              ? `
          <div class="section">
            <div class="section-title">Recommendations</div>
            <ul class="recommendations-list">
              ${report.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }
          
          <div class="footer">
            <p>This report was generated by AuditWise - AI-Powered Document Audit Platform</p>
            <p>&copy; ${new Date().getFullYear()} AuditWise. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadAsHTML = (report) => {
    setExporting(true);
    try {
      const htmlContent = generateHTMLReport(report);
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.fileName.replace(/\.[^/.]+$/, "")}_report.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("HTML export failed:", err);
      setError("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const downloadAsText = (report) => {
    setExporting(true);
    try {
      let content = `AUDITWISE ANALYSIS REPORT
${"=".repeat(50)}

DOCUMENT INFORMATION
${"-".repeat(30)}
File Name: ${report.fileName}
File Size: ${formatFileSize(report.fileSize)}
Analyzed On: ${formatDate(report.analyzedAt)}
Analysis Model: ${report.modelUsed}

ANALYSIS RESULTS
${"-".repeat(30)}
Sentiment: ${report.sentiment}
Confidence: ${(report.confidence * 100).toFixed(1)}%
Risk Level: ${report.riskLevel}
Word Count: ${report.wordCount}

SUMMARY
${"-".repeat(30)}
${report.summary || "No summary available"}

`;

      if (report.keyFindings && report.keyFindings.length > 0) {
        content += `KEY FINDINGS
${"-".repeat(30)}
${report.keyFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

`;
      }

      if (report.recommendations && report.recommendations.length > 0) {
        content += `RECOMMENDATIONS
${"-".repeat(30)}
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

`;
      }

      content += `${"=".repeat(50)}
Report generated by AuditWise - AI-Powered Document Audit Platform`;

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.fileName.replace(/\.[^/.]+$/, "")}_report.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Text export failed:", err);
      setError("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const downloadAsJSON = (reportsToExport) => {
    setExporting(true);
    try {
      const exportData = reportsToExport.map((report) => ({
        fileName: report.fileName,
        analyzedAt: report.analyzedAt,
        sentiment: report.sentiment,
        confidence: report.confidence,
        riskLevel: report.riskLevel,
        wordCount: report.wordCount,
        summary: report.summary,
        keyFindings: report.keyFindings,
        recommendations: report.recommendations,
        fileSize: report.fileSize,
        modelUsed: report.modelUsed,
      }));

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auditwise_reports_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("JSON export failed:", err);
      setError("Failed to export JSON");
    } finally {
      setExporting(false);
    }
  };

  const downloadAsCSV = (reportsToExport) => {
    setExporting(true);
    try {
      const headers = [
        "File Name",
        "Analyzed Date",
        "Sentiment",
        "Confidence",
        "Risk Level",
        "Word Count",
        "Summary",
        "Key Findings",
        "Recommendations",
      ];
      const csvRows = [headers];

      reportsToExport.forEach((report) => {
        const row = [
          `"${report.fileName.replace(/"/g, '""')}"`,
          `"${formatDate(report.analyzedAt)}"`,
          `"${report.sentiment}"`,
          `${(report.confidence * 100).toFixed(1)}%`,
          `"${report.riskLevel}"`,
          report.wordCount,
          `"${(report.summary || "").replace(/"/g, '""')}"`,
          `"${report.keyFindings.join("; ").replace(/"/g, '""')}"`,
          `"${report.recommendations.join("; ").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auditwise_reports_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
      setError("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const handlePrintReport = (report) => {
    const htmlContent = generateHTMLReport(report);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const stats = {
    total: reports.length,
    highRisk: reports.filter((r) => r.riskLevel === "HIGH").length,
    mediumRisk: reports.filter((r) => r.riskLevel === "MEDIUM").length,
    lowRisk: reports.filter((r) => r.riskLevel === "LOW").length,
    avgConfidence: reports.length
      ? (
          (reports.reduce((sum, r) => sum + r.confidence, 0) / reports.length) *
          100
        ).toFixed(1)
      : 0,
  };

  const StatCard = ({ title, value, color, icon }) => (
    <Card
      sx={{ borderRadius: 3, bgcolor: color, color: "white", height: "100%" }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {title}
            </Typography>
            <Typography variant={isMobile ? "h4" : "h3"} fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48 }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const MobileReportCard = ({ report }) => (
    <Card sx={{ mb: 2, borderRadius: 3 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {report.fileName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatDate(report.analyzedAt)} •{" "}
              {formatFileSize(report.fileSize)}
            </Typography>
          </Box>
          <Chip
            label={report.riskLevel}
            size="small"
            sx={{
              bgcolor: getRiskColor(report.riskLevel),
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Box>

        <Box display="flex" gap={1} mt={2} flexWrap="wrap">
          <Chip
            icon={getSentimentIcon(report.sentiment)}
            label={report.sentiment}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${(report.confidence * 100).toFixed(0)}% confidence`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={() => handleViewReport(report)}
          >
            View
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={() => downloadAsHTML(report)}
            disabled={exporting}
          >
            HTML
          </Button>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedReport(report);
              setDeleteDialogOpen(true);
            }}
            sx={{ color: "#ef4444" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" mb={1}>
        Reports & Analytics
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        View, manage, and download your audit analysis reports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Reports"
            value={stats.total}
            color="#6366f1"
            icon={<AssessmentIcon />}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="High Risk"
            value={stats.highRisk}
            color="#ef4444"
            icon={<WarningIcon />}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Medium Risk"
            value={stats.mediumRisk}
            color="#f59e0b"
            icon={<WarningIcon />}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Low Risk"
            value={stats.lowRisk}
            color="#10b981"
            icon={<SecurityIcon />}
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box
          sx={{
            p: isMobile ? 1.5 : 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            {!isMobile ? (
              <Tabs
                value={tabValue}
                onChange={(e, v) => setTabValue(v)}
                sx={{ minHeight: 40, flexShrink: 0 }}
              >
                <Tab label="All Reports" />
                <Tab label="High Risk" />
                <Tab label="Medium Risk" />
                <Tab label="Low Risk" />
              </Tabs>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setMobileFilterOpen(true)}
              >
                Filter:{" "}
                {tabValue === 0
                  ? "All"
                  : tabValue === 1
                    ? "High Risk"
                    : tabValue === 2
                      ? "Medium Risk"
                      : "Low Risk"}
              </Button>
            )}

            <Stack
              direction="row"
              spacing={1}
              sx={{
                width: { xs: "100%", md: "auto" },
                justifyContent: "flex-end",
                flexWrap: "nowrap",
              }}
            >
              <TextField
                size="small"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: { xs: 1, md: 0 },
                  minWidth: { xs: "120px", sm: "200px", md: "250px" },
                }}
              />
              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportMenuOpen}
                disabled={filteredReports.length === 0 || exporting}
                sx={{
                  whiteSpace: "nowrap",
                  minWidth: "fit-content",
                }}
              >
                {!isMobile && "Export"}
              </Button>
              <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={handleExportMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    filteredReports.forEach((r) => downloadAsHTML(r));
                    handleExportMenuClose();
                  }}
                  disabled={exporting}
                >
                  <PdfIcon sx={{ mr: 1, color: "#ef4444" }} /> Export as HTML
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    downloadAsCSV(filteredReports);
                    handleExportMenuClose();
                  }}
                  disabled={exporting}
                >
                  <ExcelIcon sx={{ mr: 1, color: "#10b981" }} /> Export as CSV
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    downloadAsJSON(filteredReports);
                    handleExportMenuClose();
                  }}
                  disabled={exporting}
                >
                  <JsonIcon sx={{ mr: 1, color: "#6366f1" }} /> Export as JSON
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    filteredReports.forEach((r) => downloadAsText(r));
                    handleExportMenuClose();
                  }}
                  disabled={exporting}
                >
                  <CsvIcon sx={{ mr: 1, color: "#f59e0b" }} /> Export as Text
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Box>

        {filteredReports.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="body1" color="textSecondary">
              No reports found. Upload and analyze documents to generate
              reports.
            </Typography>
          </Box>
        ) : (
          <>
            {isMobile ? (
              <Box sx={{ p: 2 }}>
                {filteredReports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => (
                    <MobileReportCard key={report.id} report={report} />
                  ))}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell>File Name</TableCell>
                      <TableCell>Analyzed Date</TableCell>
                      <TableCell>Sentiment</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredReports
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                      .map((report) => (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {report.fileName.length > 40
                                ? report.fileName.substring(0, 40) + "..."
                                : report.fileName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatFileSize(report.fileSize)}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(report.analyzedAt)}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getSentimentIcon(report.sentiment)}
                              label={report.sentiment}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.riskLevel}
                              size="small"
                              sx={{
                                bgcolor: getRiskColor(report.riskLevel),
                                color: "white",
                                fontWeight: "bold",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <LinearProgress
                                variant="determinate"
                                value={report.confidence * 100}
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption">
                                {(report.confidence * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Report">
                              <IconButton
                                size="small"
                                onClick={() => handleViewReport(report)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download HTML">
                              <IconButton
                                size="small"
                                onClick={() => downloadAsHTML(report)}
                                disabled={exporting}
                              >
                                <PdfIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print">
                              <IconButton
                                size="small"
                                onClick={() => handlePrintReport(report)}
                                disabled={exporting}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setDeleteDialogOpen(true);
                                }}
                                sx={{ color: "#ef4444" }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <TablePagination
              rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
              component="div"
              count={filteredReports.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} of ${count}`
              }
              sx={{
                "& .MuiTablePagination-toolbar": {
                  flexWrap: isMobile ? "wrap" : "nowrap",
                },
              }}
            />
          </>
        )}
      </Paper>

      <SwipeableDrawer
        anchor="bottom"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onOpen={() => {}}
        sx={{ borderRadius: "20px 20px 0 0" }}
      >
        <Box sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Filter Reports</Typography>
            <IconButton onClick={() => setMobileFilterOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItem
              button
              selected={tabValue === 0}
              onClick={() => {
                setTabValue(0);
                setMobileFilterOpen(false);
              }}
              sx={{ borderRadius: 2, mb: 1 }}
            >
              <ListItemText primary="All Reports" />
            </ListItem>
            <ListItem
              button
              selected={tabValue === 1}
              onClick={() => {
                setTabValue(1);
                setMobileFilterOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 1,
                bgcolor:
                  tabValue === 1 ? "rgba(239, 68, 68, 0.1)" : "transparent",
              }}
            >
              <ListItemIcon>
                <WarningIcon sx={{ color: "#ef4444" }} />
              </ListItemIcon>
              <ListItemText primary="High Risk" />
            </ListItem>
            <ListItem
              button
              selected={tabValue === 2}
              onClick={() => {
                setTabValue(2);
                setMobileFilterOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 1,
                bgcolor:
                  tabValue === 2 ? "rgba(245, 158, 11, 0.1)" : "transparent",
              }}
            >
              <ListItemIcon>
                <WarningIcon sx={{ color: "#f59e0b" }} />
              </ListItemIcon>
              <ListItemText primary="Medium Risk" />
            </ListItem>
            <ListItem
              button
              selected={tabValue === 3}
              onClick={() => {
                setTabValue(3);
                setMobileFilterOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 1,
                bgcolor:
                  tabValue === 3 ? "rgba(16, 185, 129, 0.1)" : "transparent",
              }}
            >
              <ListItemIcon>
                <SecurityIcon sx={{ color: "#10b981" }} />
              </ListItemIcon>
              <ListItemText primary="Low Risk" />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        {selectedReport && (
          <>
            <DialogTitle>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  noWrap
                  sx={{ flex: 1 }}
                >
                  {selectedReport.fileName}
                </Typography>
                <IconButton onClick={() => setViewDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={1}
                    flexWrap="wrap"
                  >
                    <Chip
                      label={`Analyzed: ${formatDate(selectedReport.analyzedAt)}`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`Size: ${formatFileSize(selectedReport.fileSize)}`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`Words: ${selectedReport.wordCount}`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`Model: ${selectedReport.modelUsed}`}
                      variant="outlined"
                      size="small"
                    />
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Card
                        variant="outlined"
                        sx={{ p: 2, textAlign: "center" }}
                      >
                        <Typography variant="body2" color="textSecondary">
                          Sentiment
                        </Typography>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          gap={1}
                        >
                          {getSentimentIcon(selectedReport.sentiment)}
                          <Typography variant="h6">
                            {selectedReport.sentiment}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Card
                        variant="outlined"
                        sx={{ p: 2, textAlign: "center" }}
                      >
                        <Typography variant="body2" color="textSecondary">
                          Confidence
                        </Typography>
                        <Typography variant="h6">
                          {(selectedReport.confidence * 100).toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={selectedReport.confidence * 100}
                          sx={{ mt: 1, borderRadius: 3 }}
                        />
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Card
                        variant="outlined"
                        sx={{ p: 2, textAlign: "center" }}
                      >
                        <Typography variant="body2" color="textSecondary">
                          Risk Level
                        </Typography>
                        <Chip
                          label={selectedReport.riskLevel}
                          sx={{
                            bgcolor: getRiskColor(selectedReport.riskLevel),
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            p: 2,
                          }}
                        />
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Summary
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedReport.summary || "No summary available"}
                  </Typography>
                </Grid>

                {selectedReport.keyFindings &&
                  selectedReport.keyFindings.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Key Findings
                      </Typography>
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        {selectedReport.keyFindings.map((finding, idx) => (
                          <li key={idx}>
                            <Typography variant="body2">{finding}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Grid>
                  )}

                {selectedReport.recommendations &&
                  selectedReport.recommendations.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Recommendations
                      </Typography>
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        {selectedReport.recommendations.map((rec, idx) => (
                          <li key={idx}>
                            <Typography variant="body2">{rec}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Grid>
                  )}
              </Grid>
            </DialogContent>
            <DialogActions
              sx={{ p: 2, flexDirection: isMobile ? "column" : "row", gap: 1 }}
            >
              <Button
                onClick={() => setViewDialogOpen(false)}
                fullWidth={isMobile}
              >
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={() => downloadAsHTML(selectedReport)}
                disabled={exporting}
                fullWidth={isMobile}
              >
                Download HTML
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintReport(selectedReport)}
                disabled={exporting}
                fullWidth={isMobile}
              >
                Print
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedReport?.fileName}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteReport}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
