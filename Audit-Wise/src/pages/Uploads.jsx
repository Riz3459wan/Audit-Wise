import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WarningIcon from "@mui/icons-material/Warning";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import DescriptionIcon from "@mui/icons-material/Description";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { db, dbHelpers, PLAN_LIMITS } from "../database/db";
import { ocrService } from "../services/ocrService";

const PLAN_LIMITS_CONFIG = {
  free: { maxUploads: PLAN_LIMITS.free, maxFileSize: 5 * 1024 * 1024 },
  pro: { maxUploads: PLAN_LIMITS.pro, maxFileSize: 25 * 1024 * 1024 },
  business: {
    maxUploads: PLAN_LIMITS.business,
    maxFileSize: 100 * 1024 * 1024,
  },
};

const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx";

const DOC_MIME_TYPES = {
  PDF: "application/pdf",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  XLS: "application/vnd.ms-excel",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  AI_ANALYZING: "ai_analyzing",
  ANALYSED: "analysed",
  COMPLETED: "completed",
  ERROR: "error",
};

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";
  const now = new Date();
  const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

function createUploadItem(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: STATUS.PENDING,
    progress: 0,
    ocrProgress: 0,
    error: null,
    extractedText: null,
    aiResult: null,
  };
}

function getStatusColor(status) {
  switch (status) {
    case STATUS.COMPLETED:
    case STATUS.ANALYSED:
      return "success";
    case STATUS.ERROR:
      return "error";
    case STATUS.PROCESSING:
    case STATUS.AI_ANALYZING:
      return "warning";
    default:
      return "info";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case STATUS.COMPLETED:
    case STATUS.ANALYSED:
      return <CheckCircleIcon sx={{ color: "#4caf50" }} />;
    case STATUS.ERROR:
      return <ErrorIcon sx={{ color: "#f44336" }} />;
    default:
      return <InsertDriveFileIcon sx={{ color: "#6366f1" }} />;
  }
}

function getStatusChipLabel(upload) {
  if (upload.status === STATUS.AI_ANALYZING) {
    return navigator.onLine ? "Cloud AI" : "Local AI";
  }
  if (upload.status === STATUS.PROCESSING) return "OCR";
  return upload.status;
}

function getStatusMessage(upload) {
  if (upload.status === STATUS.AI_ANALYZING) {
    if (upload.ocrProgress < 20)
      return navigator.onLine
        ? "Connecting to AI service..."
        : "Running local analysis...";
    if (upload.ocrProgress < 60)
      return navigator.onLine
        ? "AI analyzing document..."
        : "Processing document...";
    return "Finalizing results...";
  }

  if (upload.status === STATUS.PROCESSING) {
    if (upload.type === DOC_MIME_TYPES.PDF) {
      if (upload.ocrProgress < 30) return "Loading PDF document...";
      if (upload.ocrProgress < 70) return "Extracting text from PDF...";
      return "Finalizing PDF extraction...";
    }
    if (upload.type?.startsWith("image/")) {
      if (upload.ocrProgress < 30) return "Processing image...";
      if (upload.ocrProgress < 70) return "Extracting text from image...";
      return "Finalizing image analysis...";
    }
    if (
      upload.type === DOC_MIME_TYPES.DOC ||
      upload.type === DOC_MIME_TYPES.DOCX
    ) {
      if (upload.ocrProgress < 30) return "Loading Word document...";
      if (upload.ocrProgress < 70) return "Extracting text from document...";
      return "Processing document content...";
    }
    if (
      upload.type === DOC_MIME_TYPES.XLS ||
      upload.type === DOC_MIME_TYPES.XLSX
    ) {
      if (upload.ocrProgress < 30) return "Loading Excel file...";
      if (upload.ocrProgress < 70) return "Extracting data from spreadsheet...";
      return "Processing spreadsheet content...";
    }
  }

  return null;
}

const UploadQueueItem = React.memo(
  ({ upload, isAnalysing, onRemove, onAnalyzeOnly, onAnalyzeAndView }) => {
    const statusMessage = getStatusMessage(upload);
    const isProcessing =
      upload.status === STATUS.PROCESSING ||
      upload.status === STATUS.AI_ANALYZING;

    return (
      <ListItem
        divider
        secondaryAction={
          (upload.status === STATUS.PENDING ||
            upload.status === STATUS.ERROR) && (
            <IconButton
              edge="end"
              onClick={() => onRemove(upload.id)}
              disabled={isAnalysing}
              aria-label="Remove upload"
            >
              <DeleteIcon />
            </IconButton>
          )
        }
      >
        <ListItemIcon>{getStatusIcon(upload.status)}</ListItemIcon>
        <ListItemText
          primary={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="body1" fontWeight="medium" component="span">
                {upload.name.length > 40
                  ? `${upload.name.substring(0, 40)}...`
                  : upload.name}
              </Typography>
              <Chip
                label={getStatusChipLabel(upload)}
                size="small"
                color={getStatusColor(upload.status)}
                variant="outlined"
              />
            </Box>
          }
          secondary={
            <React.Fragment>
              <Typography
                variant="caption"
                color="textSecondary"
                component="span"
              >
                {formatFileSize(upload.size)}
              </Typography>

              {isProcessing && (
                <Box component="span" sx={{ mt: 1, display: "block" }}>
                  <LinearProgress
                    variant="determinate"
                    value={upload.ocrProgress || 0}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                  {statusMessage && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      component="span"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      {statusMessage}
                    </Typography>
                  )}
                </Box>
              )}

              {upload.error && (
                <Typography
                  variant="caption"
                  color="error"
                  component="span"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {upload.error}
                </Typography>
              )}

              {upload.aiResult && (
                <Typography
                  variant="caption"
                  color="success.main"
                  component="span"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  ✓ Analysis Complete — Sentiment: {upload.aiResult.sentiment} |
                  Risk: {upload.aiResult.riskLevel}
                </Typography>
              )}

              {upload.status === STATUS.PENDING && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => onAnalyzeOnly(upload)}
                    disabled={isAnalysing}
                    sx={{ mr: 1 }}
                  >
                    Analyze
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => onAnalyzeAndView(upload)}
                    disabled={isAnalysing}
                  >
                    Analyze & View Dashboard
                  </Button>
                </Box>
              )}
            </React.Fragment>
          }
        />
      </ListItem>
    );
  },
);

UploadQueueItem.displayName = "UploadQueueItem";

const Uploads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [uploads, setUploads] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [monthlyUsage, setMonthlyUsage] = useState({
    used: 0,
    total: 5,
    remaining: 5,
    baseLimit: 5,
    extraUploads: 0,
  });

  const userPlan = user?.plan?.toLowerCase() || "free";
  const planConfig = PLAN_LIMITS_CONFIG[userPlan] ?? PLAN_LIMITS_CONFIG.free;

  const getPlanColor = useCallback(() => {
    switch (userPlan) {
      case "pro":
        return "#6366f1";
      case "business":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  }, [userPlan]);

  const getUploadWarning = useCallback(() => {
    if (monthlyUsage.remaining <= 0) return "danger";
    if (monthlyUsage.remaining <= 2) return "warning";
    return "ok";
  }, [monthlyUsage.remaining]);

  const loadRecentUploads = useCallback(async () => {
    if (!user) return;
    try {
      const docs = await db.documents
        .where("userId")
        .equals(user.id)
        .reverse()
        .limit(10)
        .toArray();
      setRecentUploads(docs);
    } catch (err) {
      console.error("Failed to load recent uploads:", err);
      setError("Failed to load recent uploads");
    }
  }, [user]);

  const loadMonthlyUsage = useCallback(async () => {
    if (!user) return;
    try {
      const usage = await dbHelpers.getUserMonthlyUsage(user.id);
      setMonthlyUsage(usage);
    } catch (err) {
      console.error("Failed to load usage statistics:", err);
      setError("Failed to load usage statistics");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRecentUploads();
      loadMonthlyUsage();
    }
  }, [user, loadRecentUploads, loadMonthlyUsage]);

  const checkUploadLimit = useCallback(
    async (fileCount) => {
      try {
        const usage = await dbHelpers.getUserMonthlyUsage(user.id);
        if (usage.used + fileCount > usage.total) {
          setError(
            `You have reached your limit of ${usage.total} uploads this month. ${
              usage.extraUploads > 0
                ? "Purchase more extra uploads or upgrade plan."
                : "Upgrade plan or purchase extra uploads."
            }`,
          );
          return false;
        }
        return true;
      } catch {
        setError("Failed to check upload limit");
        return false;
      }
    },
    [user],
  );

  const checkFileSize = useCallback(
    (file) => {
      if (file.size > planConfig.maxFileSize) {
        setError(
          `${file.name} exceeds ${userPlan} plan limit of ${
            planConfig.maxFileSize / (1024 * 1024)
          }MB`,
        );
        return false;
      }
      return true;
    },
    [planConfig, userPlan],
  );

  const handleFileSelect = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = "";

      if (files.length === 0) return;

      const canUpload = await checkUploadLimit(files.length);
      if (!canUpload) return;

      const validFiles = files.filter((file) => checkFileSize(file));
      if (validFiles.length === 0) return;

      const newUploads = validFiles.map(createUploadItem);
      setUploads((prev) => [...prev, ...newUploads]);
      setError("");
    },
    [checkUploadLimit, checkFileSize],
  );

  const processDocumentWithOCR = useCallback(async (uploadItem, onProgress) => {
    onProgress?.({ status: "ocr_started", progress: 10 });

    const { type, file } = uploadItem;

    let result;
    if (type === DOC_MIME_TYPES.PDF) {
      result = await ocrService.extractTextFromPDF(file, onProgress);
    } else if (type === DOC_MIME_TYPES.DOC || type === DOC_MIME_TYPES.DOCX) {
      result = await ocrService.extractTextFromDOC(file, onProgress);
    } else if (type === DOC_MIME_TYPES.XLS || type === DOC_MIME_TYPES.XLSX) {
      result = await ocrService.extractTextFromExcel(file, onProgress);
    } else {
      result = await ocrService.extractTextFromImage(file, onProgress);
    }

    if (!result.success) throw new Error(result.error || "OCR failed");
    return result;
  }, []);

  const updateUpload = useCallback((id, patch) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    );
  }, []);

  const handleProcessAndAnalyze = useCallback(
    async (uploadItem, shouldRedirect = false) => {
      updateUpload(uploadItem.id, {
        status: STATUS.PROCESSING,
        ocrProgress: 0,
      });

      try {
        const ocrResult = await processDocumentWithOCR(uploadItem, (progress) =>
          updateUpload(uploadItem.id, { ocrProgress: progress.progress }),
        );

        updateUpload(uploadItem.id, {
          status: STATUS.AI_ANALYZING,
          ocrProgress: 10,
          extractedText: ocrResult.text,
        });

        const aiResult = await ocrService.analyzeWithAI(
          ocrResult.text,
          (progress) =>
            updateUpload(uploadItem.id, { ocrProgress: progress.progress }),
        );

        const canSave = await checkUploadLimit(1);
        if (!canSave) throw new Error("Upload limit reached");

        const documentData = {
          fileName: uploadItem.file.name,
          fileSize: uploadItem.file.size,
          fileType: uploadItem.file.type,
          filePath: URL.createObjectURL(uploadItem.file),
          status: STATUS.COMPLETED,
          extractedText: ocrResult.text,
          confidence: ocrResult.confidence || 0.9,
        };

        const documentId = await dbHelpers.saveDocument(user.id, documentData);

        const analysisData = {
          extractedText: ocrResult.text,
          confidence: aiResult.confidence || 0.8,
          modelUsed:
            aiResult.mode === "cloud_ai"
              ? "hugging-face-distilbert"
              : "local-analysis",
          language: "en",
          analysis: aiResult.analysis,
          sentiment: aiResult.sentiment,
          riskLevel: aiResult.riskLevel,
          keyFindings: JSON.stringify(aiResult.keyFindings || []),
          recommendations: JSON.stringify(aiResult.recommendations || []),
          mode: aiResult.mode,
          wordCount: aiResult.wordCount || 0,
          charCount: aiResult.charCount || 0,
          summary: aiResult.summary || "",
          revenue: aiResult.revenue || 0,
          expenses: aiResult.expenses || 0,
          profit: aiResult.profit || 0,
          profitMargin: aiResult.profitMargin || 0,
          totalCredit: aiResult.totalCredit || 0,
          totalDebit: aiResult.totalDebit || 0,
          riskScore: aiResult.riskScore || 50,
          anomalies: aiResult.anomalies || 0,
          failedCount: aiResult.failedCount || 0,
          pendingCount: aiResult.pendingCount || 0,
          completedCount: aiResult.completedCount || 0,
          transactions: JSON.stringify(aiResult.transactions || []),
        };

        await dbHelpers.saveAnalyseResult(documentId, user.id, analysisData);
        await loadMonthlyUsage();
        await loadRecentUploads();

        updateUpload(uploadItem.id, {
          status: STATUS.ANALYSED,
          documentId,
          aiResult,
          mode: aiResult.mode,
        });

        if (shouldRedirect) navigate("/dashboard");
        return true;
      } catch (err) {
        console.error("Processing error:", err);
        updateUpload(uploadItem.id, {
          status: STATUS.ERROR,
          error: err.message || "Processing failed",
        });
        return false;
      }
    },
    [
      processDocumentWithOCR,
      checkUploadLimit,
      updateUpload,
      user,
      loadMonthlyUsage,
      loadRecentUploads,
      navigate,
    ],
  );

  const handleAnalyzeAndView = useCallback(
    async (upload) => {
      setIsAnalysing(true);
      setError("");
      await handleProcessAndAnalyze(upload, true);
      setIsAnalysing(false);
    },
    [handleProcessAndAnalyze],
  );

  const handleAnalyzeOnly = useCallback(
    async (upload) => {
      setIsAnalysing(true);
      setError("");
      await handleProcessAndAnalyze(upload, false);
      setIsAnalysing(false);
    },
    [handleProcessAndAnalyze],
  );

  const handleAnalyzeAll = useCallback(async () => {
    const pendingUploads = uploads.filter((u) => u.status === STATUS.PENDING);
    if (pendingUploads.length === 0) {
      setError("No documents ready for processing");
      return;
    }
    setIsAnalysing(true);
    setError("");
    for (const upload of pendingUploads) {
      await handleProcessAndAnalyze(upload, false);
    }
    setIsAnalysing(false);
  }, [uploads, handleProcessAndAnalyze]);

  const handleRecentItemClick = useCallback(
    async (doc) => {
      try {
        const analysisResult = await db.analyseResult
          .where("documentId")
          .equals(doc.id)
          .first();
        if (analysisResult) {
          navigate("/dashboard");
        } else {
          setError("Analysis data not found for this document");
        }
      } catch (err) {
        console.error("Failed to load analysis:", err);
        setError("Failed to load document analysis");
      }
    },
    [navigate],
  );

  const removeUpload = useCallback((id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) =>
      prev.filter(
        (u) => u.status !== STATUS.COMPLETED && u.status !== STATUS.ANALYSED,
      ),
    );
  }, []);

  const deleteRecentUpload = useCallback(
    async (docId) => {
      try {
        await db.documents.delete(docId);
        await db.analyseResult.where("documentId").equals(docId).delete();
        await loadRecentUploads();
        await loadMonthlyUsage();
      } catch (err) {
        console.error("Failed to delete upload:", err);
        setError("Failed to delete upload");
      }
    },
    [loadRecentUploads, loadMonthlyUsage],
  );

  const hasPendingUploads = uploads.some((u) => u.status === STATUS.PENDING);
  const hasCompletedUploads = uploads.some(
    (u) => u.status === STATUS.COMPLETED || u.status === STATUS.ANALYSED,
  );
  const warningLevel = getUploadWarning();
  const usagePercent =
    monthlyUsage.total > 0 ? (monthlyUsage.used / monthlyUsage.total) * 100 : 0;
  const progressBarColor =
    warningLevel === "danger"
      ? "#f44336"
      : warningLevel === "warning"
        ? "#f59e0b"
        : "#6366f1";
  const remainingColor =
    warningLevel === "danger"
      ? "#f44336"
      : warningLevel === "warning"
        ? "#f59e0b"
        : "#10b981";
  const isLimitReached = monthlyUsage.remaining <= 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Upload Documents
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        Upload audit documents for AI-powered processing and analysis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Paper
              role="button"
              tabIndex={isLimitReached ? -1 : 0}
              aria-label="Upload files"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (!isLimitReached) fileInputRef.current?.click();
                }
              }}
              sx={{
                p: 4,
                textAlign: "center",
                border: "2px dashed",
                borderColor: isLimitReached ? "#f44336" : "divider",
                borderRadius: "15px",
                backgroundColor: "transparent",
                cursor: isLimitReached ? "not-allowed" : "pointer",
                opacity: isLimitReached ? 0.5 : 1,
                outline: "none",
                "&:hover": {
                  borderColor: isLimitReached ? "#f44336" : "#6366f1",
                  backgroundColor: isLimitReached
                    ? "transparent"
                    : "rgba(99, 102, 241, 0.02)",
                },
                "&:focus-visible": {
                  boxShadow: "0 0 0 3px rgba(99,102,241,0.4)",
                },
              }}
              onClick={() => !isLimitReached && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept={ACCEPTED_FILE_TYPES}
                style={{ display: "none" }}
                onChange={handleFileSelect}
                disabled={isAnalysing || isLimitReached}
              />

              <CloudUploadIcon
                sx={{
                  fontSize: 60,
                  color: isLimitReached ? "#f44336" : "#6366f1",
                  mb: 2,
                }}
              />
              <Typography variant="h6" gutterBottom>
                {isLimitReached
                  ? "Monthly Limit Reached"
                  : "Drag & drop files here or click to browse"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supports: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX (Max{" "}
                {planConfig.maxFileSize / (1024 * 1024)}MB per file)
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", mt: 1 }}
              >
                {navigator.onLine ? "☁ Cloud AI Mode" : "📴 Offline Mode"} —
                Process & Analyze in one click
              </Typography>

              {isLimitReached && (
                <Button
                  variant="contained"
                  sx={{
                    mt: 2,
                    background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/price");
                  }}
                >
                  Upgrade Plan
                </Button>
              )}
            </Paper>

            {uploads.length > 0 && (
              <Paper sx={{ borderRadius: "15px", overflow: "hidden" }}>
                <Box
                  sx={{
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6">
                    Upload Queue ({uploads.length}{" "}
                    {uploads.length === 1 ? "file" : "files"})
                  </Typography>
                  {hasCompletedUploads && (
                    <Button size="small" onClick={clearCompleted}>
                      Clear Completed
                    </Button>
                  )}
                </Box>

                <List sx={{ maxHeight: 400, overflow: "auto" }}>
                  {uploads.map((upload) => (
                    <UploadQueueItem
                      key={upload.id}
                      upload={upload}
                      isAnalysing={isAnalysing}
                      onRemove={removeUpload}
                      onAnalyzeOnly={handleAnalyzeOnly}
                      onAnalyzeAndView={handleAnalyzeAndView}
                    />
                  ))}
                </List>
              </Paper>
            )}

            {hasPendingUploads && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={isAnalysing}
                onClick={handleAnalyzeAll}
                sx={{
                  py: 2,
                  background: "linear-gradient(90deg, #10b981, #059669)",
                  borderRadius: "15px",
                  "&:hover": {
                    background: "linear-gradient(90deg, #059669, #047857)",
                  },
                }}
                startIcon={
                  isAnalysing ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    <AnalyticsIcon />
                  )
                }
              >
                {isAnalysing
                  ? navigator.onLine
                    ? "Running Cloud AI Analysis..."
                    : "Running Local Analysis..."
                  : "Analyze All Documents"}
              </Button>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Paper sx={{ borderRadius: "15px", overflow: "hidden" }}>
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#6366f1",
                  color: "white",
                }}
              >
                <Typography variant="h6">Recent Uploads</Typography>
                <Typography variant="caption">
                  Click any item to view analysis
                </Typography>
              </Box>

              {recentUploads.length > 0 ? (
                <List sx={{ maxHeight: 400, overflow: "auto" }}>
                  {recentUploads.slice(0, 5).map((doc, index) => (
                    <ListItem
                      key={doc.id}
                      divider={index < Math.min(recentUploads.length, 5) - 1}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="Delete document"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecentUpload(doc.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => handleRecentItemClick(doc)}
                    >
                      <ListItemIcon>
                        <CloudDoneIcon sx={{ color: "#10b981" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="medium">
                            {doc.fileName.length > 40
                              ? `${doc.fileName.substring(0, 40)}...`
                              : doc.fileName}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            component="span"
                          >
                            {formatFileSize(doc.fileSize)} •{" "}
                            {formatDate(doc.scannedAt)}
                            {doc.extractedText ? " • Analyzed" : ""}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <DescriptionIcon
                    sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    No recent uploads
                  </Typography>
                </Box>
              )}
            </Paper>

            <Card sx={{ borderRadius: "15px" }}>
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Your Plan
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{ color: getPlanColor(), textTransform: "capitalize" }}
                >
                  {user?.plan || "free"}
                </Typography>

                {monthlyUsage.extraUploads > 0 && (
                  <Typography variant="caption" color="success.main">
                    +{monthlyUsage.extraUploads} extra uploads purchased
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Monthly Usage (
                  {new Date().toLocaleString("default", { month: "long" })})
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    {monthlyUsage.used}/{monthlyUsage.total}
                  </Typography>
                  <Typography variant="body2" color={remainingColor}>
                    {monthlyUsage.remaining} remaining this month
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(usagePercent, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#e5e7eb",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: progressBarColor,
                    },
                  }}
                />

                {monthlyUsage.remaining > 0 && monthlyUsage.remaining <= 2 && (
                  <Alert
                    severity="warning"
                    sx={{ mt: 2 }}
                    icon={<WarningIcon />}
                  >
                    You have only {monthlyUsage.remaining} upload
                    {monthlyUsage.remaining === 1 ? "" : "s"} left this month.
                    <Button
                      size="small"
                      color="warning"
                      sx={{ ml: 1 }}
                      onClick={() => navigate("/price")}
                    >
                      Upgrade or Buy Extra
                    </Button>
                  </Alert>
                )}

                {isLimitReached && (
                  <Alert severity="error" sx={{ mt: 2 }} icon={<WarningIcon />}>
                    You've reached your monthly limit.
                    <Button
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                      onClick={() => navigate("/price")}
                    >
                      Upgrade Now or Buy Extra Uploads
                    </Button>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {uploads.length === 0 && recentUploads.length === 0 && (
        <Paper
          sx={{
            mt: 3,
            p: 6,
            textAlign: "center",
            borderRadius: "15px",
            backgroundColor: "transparent",
          }}
        >
          <DescriptionIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" color="textSecondary">
            No files uploaded yet
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Click the area above to select files for AI-powered audit
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Uploads;
