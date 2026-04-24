import React, { useRef, useState, useEffect } from "react";
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

const Uploads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [monthlyUsage, setMonthlyUsage] = useState({
    used: 0,
    total: 5,
    remaining: 5,
    baseLimit: 5,
    extraUploads: 0,
  });
  const planLimits = {
    free: { maxUploads: PLAN_LIMITS.free, maxFileSize: 5 * 1024 * 1024 },
    pro: { maxUploads: PLAN_LIMITS.pro, maxFileSize: 25 * 1024 * 1024 },
    business: {
      maxUploads: PLAN_LIMITS.business,
      maxFileSize: 100 * 1024 * 1024,
    },
  };

  useEffect(() => {
    if (user) {
      loadRecentUploads();
      loadMonthlyUsage();
    }
  }, [user]);

  const loadRecentUploads = async () => {
    try {
      const docs = await db.documents
        .where("userId")
        .equals(user.id)
        .reverse()
        .limit(10)
        .toArray();
      setRecentUploads(docs);
    } catch (err) {
      setError("Failed to load recent uploads");
    }
  };

  const loadMonthlyUsage = async () => {
    try {
      if (!user) return;
      const usage = await dbHelpers.getUserMonthlyUsage(user.id);
      setMonthlyUsage(usage);
    } catch (err) {
      console.error("Failed to load usage statistics:", err);
      setError("Failed to load usage statistics");
    }
  };

  const checkUploadLimit = async (fileCount) => {
    try {
      const usage = await dbHelpers.getUserMonthlyUsage(user.id);
      if (usage.used + fileCount > usage.total) {
        setError(
          `You have reached your limit of ${usage.total} uploads this month. ${usage.extraUploads > 0 ? "Purchase more extra uploads or upgrade plan." : "Upgrade plan or purchase extra uploads."}`,
        );
        return false;
      }
      return true;
    } catch (err) {
      setError("Failed to check upload limit");
      return false;
    }
  };

  const checkFileSize = (file) => {
    const plan = user?.plan?.toLowerCase() || "free";
    const maxSize = planLimits[plan]?.maxFileSize;

    if (file.size > maxSize) {
      setError(
        `${file.name} exceeds ${plan} plan limit of ${maxSize / (1024 * 1024)}MB`,
      );
      return false;
    }
    return true;
  };

  const handleFileSelect = async (event) => {
    console.log(event)
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    const canUpload = await checkUploadLimit(files.length);
    if (!canUpload) return;

    const validFiles = [];
    for (const file of files) {
      if (!checkFileSize(file)) continue;
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const newUploads = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
      progress: 0,
      ocrProgress: 0,
      error: null,
      extractedText: null,
      aiResult: null,
    }));

    setUploads((prev) => [...prev, ...newUploads]);
    setError("");
  };3

  const processDocumentWithOCR = async (uploadItem, onProgress) => {
    onProgress?.({ status: "ocr_started", progress: 10 });
    let result;
    try {
      if (uploadItem.file.type === "application/pdf") {
        result = await ocrService.extractTextFromPDF(
          uploadItem.file,
          onProgress,
        );
      } else if (
        uploadItem.file.type === "application/msword" ||
        uploadItem.file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        result = await ocrService.extractTextFromDOC(
          uploadItem.file,
          onProgress,
        );
      } else {
        result = await ocrService.extractTextFromImage(
          uploadItem.file,
          onProgress,
        );
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("OCR processing error:", error);
      throw new Error(error.message || "Failed to process document");
    }
  };
console.log(uploads)
  const handleProcessAndAnalyze = async (
    uploadItem,
    shouldRedirect = false,
  ) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === uploadItem.id
          ? { ...u, status: "processing", ocrProgress: 0 }
          : u,
      ),
    );

    try {
      const ocrResult = await processDocumentWithOCR(uploadItem, (progress) => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadItem.id
              ? { ...u, ocrProgress: progress.progress }
              : u,
          ),
        );
      });

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadItem.id
            ? {
                ...u,
                status: "ai_analyzing",
                ocrProgress: 10,
                extractedText: ocrResult.text,
              }
            : u,
        ),
      );

      const aiResult = await ocrService.analyzeWithAI(
        ocrResult.text,
        (progress) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadItem.id
                ? { ...u, ocrProgress: progress.progress }
                : u,
            ),
          );
        },
      );

      const canSave = await checkUploadLimit(1);
      if (!canSave) {
        throw new Error("Upload limit reached");
      }

      const documentData = {
        fileName: uploadItem.file.name,
        fileSize: uploadItem.file.size,
        fileType: uploadItem.file.type,
        filePath: URL.createObjectURL(uploadItem.file),
        status: "completed",
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
      };

      await dbHelpers.saveAnalyseResult(documentId, user.id, analysisData);

      await loadMonthlyUsage();
      await loadRecentUploads();

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadItem.id
            ? {
                ...u,
                status: "analysed",
                documentId,
                aiResult: aiResult,
                mode: aiResult.mode,
              }
            : u,
        ),
      );
      if (shouldRedirect) {
        navigate("/dashboard");
      }
      return true;
    } catch (err) {
      console.error("Processing error:", err);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadItem.id
            ? { ...u, status: "error", error: err.message }
            : u,
        ),
      );
      return false;
    }
  };

  const handleAnalyzeAndView = async (upload) => {
    setIsAnalysing(true);
    setError("");
    await handleProcessAndAnalyze(upload, true);
    setIsAnalysing(false);
  };

  const handleAnalyzeOnly = async (upload) => {
    setIsAnalysing(true);
    setError("");
    await handleProcessAndAnalyze(upload, false);
    setIsAnalysing(false);
  };

  const handleAnalyzeAll = async () => {
    const pendingUploads = uploads.filter((u) => u.status === "pending");
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
  };

  const handleRecentItemClick = async (doc) => {
    const analysisResult = await db.analyseResult
      .where("documentId")
      .equals(doc.id)
      .first();

    if (analysisResult) {
      navigate("/dashboard");
    } else {
      setError("Analysis data not found for this document");
    }
  };

  const removeUpload = (id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const clearCompleted = () => {
    setUploads((prev) =>
      prev.filter((u) => u.status !== "completed" && u.status !== "analysed"),
    );
  };

  const deleteRecentUpload = async (docId) => {
    try {
      await db.documents.delete(docId);
      await db.analyseResult.where("documentId").equals(docId).delete();
      await loadRecentUploads();
      await loadMonthlyUsage();
    } catch (err) {
      setError("Failed to delete upload");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "analysed":
        return "success";
      case "error":
        return "error";
      case "processing":
      case "analysing":
      case "ai_analyzing":
        return "warning";
      default:
        return "info";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "analysed":
        return <CheckCircleIcon sx={{ color: "#4caf50" }} />;
      case "error":
        return <ErrorIcon sx={{ color: "#f44336" }} />;
      default:
        return <InsertDriveFileIcon sx={{ color: "#6366f1" }} />;
    }
  };

  const getPlanColor = () => {
    const plan = user?.plan?.toLowerCase() || "free";
    switch (plan) {
      case "pro":
        return "#6366f1";
      case "business":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  };

  const getUploadWarning = () => {
    const remaining = monthlyUsage.remaining;
    if (remaining <= 0) return "danger";
    if (remaining <= 2) return "warning";
    return "ok";
  };

  const hasPendingUploads = uploads.some((u) => u.status === "pending");

  const getStatusMessage = (upload) => {
    if (upload.status === "ai_analyzing") {
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
    if (upload.status === "processing") {
      if (upload.type === "application/pdf") {
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
        upload.type === "application/msword" ||
        upload.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        if (upload.ocrProgress < 30) return "Loading Word document...";
        if (upload.ocrProgress < 70) return "Extracting text from document...";
        return "Processing document content...";
      }
    }
    return null;
  };

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
              sx={{
                p: 4,
                textAlign: "center",
                border: "2px dashed",
                borderColor:
                  monthlyUsage.remaining <= 0 ? "#f44336" : "divider",
                borderRadius: "15px",
                backgroundColor: "transparent",
                cursor: monthlyUsage.remaining <= 0 ? "not-allowed" : "pointer",
                opacity: monthlyUsage.remaining <= 0 ? 0.5 : 1,
                ":hover": {
                  borderColor:
                    monthlyUsage.remaining <= 0 ? "#f44336" : "#6366f1",
                  backgroundColor:
                    monthlyUsage.remaining <= 0
                      ? "transparent"
                      : "rgba(99, 102, 241, 0.02)",
                },
                
              }}
              onClick={() =>
                monthlyUsage.remaining > 0 && fileInputRef.current?.click()
              }
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={handleFileSelect}
                disabled={
                  isUploading || isAnalysing || monthlyUsage.remaining <= 0
                }
              />
              <CloudUploadIcon
                sx={{
                  fontSize: 60,
                  color: monthlyUsage.remaining <= 0 ? "#f44336" : "#6366f1",
                  mb: 2,
                }}
              />
              <Typography variant="h6" gutterBottom>
                {monthlyUsage.remaining <= 0
                  ? "Monthly Limit Reached"
                  : "Drag & drop files here or click to browse"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supports: JPG, PNG, PDF, DOC, DOCX (Max{" "}
                {planLimits[user?.plan?.toLowerCase() || "free"]?.maxFileSize /
                  (1024 * 1024)}
                MB per file)
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", mt: 1 }}
              >
                {navigator.onLine ? "☁ Cloud AI Mode" : "📴 Offline Mode"} -
                Process & Analyze in one click
              </Typography>
              {monthlyUsage.remaining <= 0 && (
                <Button
                  variant="contained"
                  sx={{
                    mt: 2,
                    background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                  }}
                  onClick={() => navigate("/price")}
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
                    Upload Queue ({uploads.length} files)
                  </Typography>
                  <Box>
                    {uploads.some(
                      (u) =>
                        u.status === "completed" || u.status === "analysed",
                    ) && (
                      <Button
                        size="small"
                        onClick={clearCompleted}
                        sx={{ mr: 1 }}
                      >
                        Clear Completed
                      </Button>
                    )}
                  </Box>
                </Box>

                <List sx={{ maxHeight: 400, overflow: "auto" }}>
                  {uploads.map((upload) => (
                    <ListItem
                      key={upload.id}
                      divider
                      secondaryAction={
                        (upload.status === "pending" ||
                          upload.status === "error") && (
                          <IconButton
                            edge="end"
                            onClick={() => removeUpload(upload.id)}
                            disabled={isUploading || isAnalysing}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemIcon>
                        {getStatusIcon(upload.status)}
                      </ListItemIcon>
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
                            <Typography
                              variant="body1"
                              fontWeight="medium"
                              component="span"
                            >
                              {upload.name.length > 40
                                ? upload.name.substring(0, 40) + "..."
                                : upload.name}
                            </Typography>
                            <Chip
                              label={
                                upload.status === "ai_analyzing"
                                  ? navigator.onLine
                                    ? "Cloud AI"
                                    : "Local AI"
                                  : upload.status === "processing"
                                    ? "OCR"
                                    : upload.status
                              }
                              size="small"
                              color={getStatusColor(upload.status)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              component="span"
                            >
                              {formatFileSize(upload.size)}
                            </Typography>
                            {(upload.status === "processing" ||
                              upload.status === "ai_analyzing") && (
                              <Box
                                component="span"
                                sx={{ mt: 1, display: "block" }}
                              >
                                <LinearProgress
                                  variant="determinate"
                                  value={upload.ocrProgress || 0}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                  component="span"
                                  sx={{ mt: 0.5, display: "block" }}
                                >
                                  {getStatusMessage(upload)}
                                </Typography>
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
                                ✓ Analysis Complete - Sentiment:{" "}
                                {upload.aiResult.sentiment} | Risk:{" "}
                                {upload.aiResult.riskLevel}
                              </Typography>
                            )}
                            {upload.status === "pending" && (
                              <Box sx={{ mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => handleAnalyzeOnly(upload)}
                                  disabled={isAnalysing}
                                  sx={{ mr: 1 }}
                                >
                                  Analyze
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleAnalyzeAndView(upload)}
                                  disabled={isAnalysing}
                                >
                                  Analyze & View Dashboard
                                </Button>
                              </Box>
                            )}
                          </>
                        }
                      />
                    </ListItem>
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
                      divider={index < recentUploads.length - 1}
                      secondaryAction={
                        <IconButton
                          edge="end"
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
                              ? doc.fileName.substring(0, 40) + "..."
                              : doc.fileName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="textSecondary">
                            {formatFileSize(doc.fileSize)} •{" "}
                            {formatDate(doc.scannedAt)}
                            {doc.extractedText && " • Analyzed"}
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
                  <Typography
                    variant="body2"
                    color={
                      getUploadWarning() === "danger"
                        ? "#f44336"
                        : getUploadWarning() === "warning"
                          ? "#f59e0b"
                          : "#10b981"
                    }
                  >
                    {monthlyUsage.remaining} remaining this month
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(monthlyUsage.used / monthlyUsage.total) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#e5e7eb",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        getUploadWarning() === "danger"
                          ? "#f44336"
                          : getUploadWarning() === "warning"
                            ? "#f59e0b"
                            : "#6366f1",
                    },
                  }}
                />
                {monthlyUsage.remaining <= 2 && monthlyUsage.remaining > 0 && (
                  <Alert
                    severity="warning"
                    sx={{ mt: 2 }}
                    icon={<WarningIcon />}
                  >
                    You have only {monthlyUsage.remaining} uploads left this
                    month.
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
                {monthlyUsage.remaining === 0 && (
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
