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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LoginIcon from "@mui/icons-material/Login";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate } from "react-router-dom";

import { ocrService } from "../services/ocrService";
import { dbHelpers } from "../database/db";
import { tabSession } from "../utils/tabSession";

const TrialUpload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [trialData, setTrialData] = useState(() => {
    const saved = sessionStorage.getItem("trial_analyses");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    sessionStorage.setItem("trial_analyses", JSON.stringify(trialData));
  }, [trialData]);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const newUploads = files.map((file) => ({
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
      isGuestMode: true,
    }));

    setUploads((prev) => [...prev, ...newUploads]);
    setError("");
    setSnackbarMessage(`${files.length} file(s) added for trial analysis`);
    setSnackbarOpen(true);
    event.target.value = "";
  };

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
      throw new Error(error.message || "Failed to process document");
    }
  };

  const handleProcessAndAnalyze = async (uploadItem) => {
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

      const analysisData = {
        id: uploadItem.id,
        fileName: uploadItem.file.name,
        fileSize: uploadItem.file.size,
        fileType: uploadItem.file.type,
        extractedText: ocrResult.text,
        analyzedAt: new Date().toISOString(),
        aiResult: {
          sentiment: aiResult.sentiment,
          confidence: aiResult.confidence,
          riskLevel: aiResult.riskLevel,
          riskScore: aiResult.riskScore,
          summary: aiResult.summary,
          keyFindings: aiResult.keyFindings,
          recommendations: aiResult.recommendations,
          wordCount: aiResult.wordCount,
          mode: aiResult.mode,
          analysis: aiResult.analysis,
        },
        isGuestAnalysis: true,
      };

      setTrialData((prev) => [...prev, analysisData]);

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadItem.id
            ? {
                ...u,
                status: "analysed",
                aiResult: aiResult,
                mode: aiResult.mode,
                documentId: uploadItem.id,
              }
            : u,
        ),
      );

      setSnackbarMessage(
        `Analysis complete! ${aiResult.sentiment} sentiment detected with ${(aiResult.confidence * 100).toFixed(1)}% confidence`,
      );
      setSnackbarOpen(true);

      return true;
    } catch (err) {
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

  const handleAnalyzeOnly = async (upload) => {
    setIsAnalysing(true);
    setError("");
    await handleProcessAndAnalyze(upload);
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
      await handleProcessAndAnalyze(upload);
    }

    setIsAnalysing(false);
  };

  const handleViewAnalysis = (upload) => {
    if (upload.status === "analysed" && upload.aiResult) {
      setPendingAnalysis(upload);
    }
  };

  const handleSaveToAccount = () => {
    if (tabSession.isActive()) {
      saveTrialDataToAccount();
    } else {
      setLoginDialogOpen(true);
    }
  };

  const saveTrialDataToAccount = async () => {
    const user = tabSession.get();
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    setIsSaving(true);
    setError("");
    let savedCount = 0;

    try {
      for (const analysis of trialData) {
        const usage = await dbHelpers.getUserMonthlyUsage(user.userId);
        if (usage.used >= usage.total) {
          setError(
            `Upload limit reached. Please upgrade your plan to save more documents.`,
          );
          break;
        }

        const documentData = {
          fileName: analysis.fileName,
          fileSize: analysis.fileSize,
          fileType: analysis.fileType,
          filePath: null,
          status: "completed",
          extractedText: analysis.extractedText,
          confidence: analysis.aiResult.confidence || 0.9,
        };

        const documentId = await dbHelpers.saveDocument(
          user.userId,
          documentData,
        );

        const analysisData = {
          extractedText: analysis.extractedText,
          confidence: analysis.aiResult.confidence || 0.8,
          modelUsed:
            analysis.aiResult.mode === "cloud_ai"
              ? "hugging-face-distilbert"
              : "local-analysis",
          language: "en",
          analysis: analysis.aiResult.analysis,
          sentiment: analysis.aiResult.sentiment,
          riskLevel: analysis.aiResult.riskLevel,
          keyFindings: JSON.stringify(analysis.aiResult.keyFindings || []),
          recommendations: JSON.stringify(
            analysis.aiResult.recommendations || [],
          ),
          mode: analysis.aiResult.mode,
          wordCount: analysis.aiResult.wordCount || 0,
          summary: analysis.aiResult.summary || "",
        };

        await dbHelpers.saveAnalyseResult(
          documentId,
          user.userId,
          analysisData,
        );
        savedCount++;
      }

      if (savedCount > 0) {
        setTrialData([]);
        setUploads([]);
        sessionStorage.removeItem("trial_analyses");
        setSnackbarMessage(
          `Successfully saved ${savedCount} analysis(es) to your account!`,
        );
        setSnackbarOpen(true);

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoginRedirect = () => {
    setLoginDialogOpen(false);
    sessionStorage.setItem("redirectAfterLogin", "true");
    sessionStorage.setItem("pendingTrialData", JSON.stringify(trialData));
    navigate("/login");
  };

  const removeUpload = (id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const clearCompleted = () => {
    setUploads((prev) =>
      prev.filter((u) => u.status !== "completed" && u.status !== "analysed"),
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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

  const hasPendingUploads = uploads.some((u) => u.status === "pending");
  const hasAnalysedUploads =
    uploads.some((u) => u.status === "analysed") || trialData.length > 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
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
          <Typography variant="h4" fontWeight="bold">
            Try AuditWise Free
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Upload and analyze documents without signing up. Save results by
            creating an account.
          </Typography>
        </Box>
        {hasAnalysedUploads && (
          <Button
            variant="contained"
            startIcon={
              isSaving ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSaveToAccount}
            disabled={isSaving}
            sx={{
              background: "linear-gradient(90deg, #10b981, #059669)",
              "&:hover": {
                background: "linear-gradient(90deg, #059669, #047857)",
              },
            }}
          >
            {isSaving ? "Saving..." : "Save to Account"}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: "15px",
              cursor: "pointer",
              "&:hover": {
                borderColor: "#6366f1",
                backgroundColor: "rgba(99, 102, 241, 0.02)",
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              style={{ display: "none" }}
              onChange={handleFileSelect}
              disabled={isAnalysing}
            />
            <CloudUploadIcon sx={{ fontSize: 60, color: "#6366f1", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & drop files here or click to browse
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supports: JPG, PNG, PDF, DOC, DOCX (Max 25MB per file)
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: "block", mt: 1 }}
            >
              <strong>Try for free </strong>- No signup required! Save results
              by creating an account.
            </Typography>
          </Paper>
        </Grid>

        {uploads.length > 0 && (
          <Grid item xs={12}>
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
                    (u) => u.status === "completed" || u.status === "analysed",
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
                          disabled={isAnalysing}
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
                          {upload.isGuestMode && (
                            <Chip
                              label="Trial"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
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
                                {upload.status === "ai_analyzing" &&
                                navigator.onLine
                                  ? "AI analyzing document..."
                                  : "Processing document..."}
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
                              <Button
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                                onClick={() => handleViewAnalysis(upload)}
                              >
                                View Details
                              </Button>
                            </Typography>
                          )}
                          {upload.status === "pending" && (
                            <Box sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleAnalyzeOnly(upload)}
                                disabled={isAnalysing}
                              >
                                Analyze Document
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
          </Grid>
        )}

        {hasPendingUploads && (
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={isAnalysing}
              onClick={handleAnalyzeAll}
              sx={{
                py: 2,
                background: "linear-gradient(90deg, #6366f1, #38bdf8)",
                borderRadius: "15px",
              }}
              startIcon={
                isAnalysing ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  <AnalyticsIcon />
                )
              }
            >
              {isAnalysing ? "Analyzing Documents..." : "Analyze All Documents"}
            </Button>
          </Grid>
        )}

        {trialData.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: "15px", bgcolor: "action.hover" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trial Summary
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  You have {trialData.length} analysis(es).
                  {!tabSession.isActive() &&
                    " Create an account to save them permanently!"}
                </Typography>
                <Divider sx={{ my: 2 }} />
                {trialData.slice(0, 3).map((item, idx) => (
                  <Box key={idx} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{item.fileName}</strong> -{" "}
                      {item.aiResult.sentiment} risk ({item.aiResult.riskLevel})
                    </Typography>
                  </Box>
                ))}
                {trialData.length > 3 && (
                  <Typography variant="caption" color="textSecondary">
                    +{trialData.length - 3} more analyses
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)}>
        <DialogTitle>Save Your Analysis Results</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have {trialData.length} analysis(es) ready to save. Create a
            free account or login to:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              ✓ Save all your analyses permanently
            </Typography>
            <Typography variant="body2">
              ✓ Access results from any device
            </Typography>
            <Typography variant="body2">
              ✓ Generate professional reports
            </Typography>
            <Typography variant="body2">✓ Track your audit history</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)} color="secondary">
            Continue Trial
          </Button>
          <Button
            onClick={handleLoginRedirect}
            variant="contained"
            startIcon={<LoginIcon />}
            sx={{ background: "linear-gradient(90deg, #6366f1, #38bdf8)" }}
          >
            Login / Sign Up
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!pendingAnalysis}
        onClose={() => setPendingAnalysis(null)}
        maxWidth="md"
        fullWidth
      >
        {pendingAnalysis && pendingAnalysis.aiResult && (
          <>
            <DialogTitle>
              Analysis Results: {pendingAnalysis.name}
              <Chip
                label={pendingAnalysis.aiResult.riskLevel}
                size="small"
                sx={{ ml: 2 }}
                color={
                  pendingAnalysis.aiResult.riskLevel === "HIGH"
                    ? "error"
                    : pendingAnalysis.aiResult.riskLevel === "LOW"
                      ? "success"
                      : "warning"
                }
              />
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Sentiment Analysis
                  </Typography>
                  <Typography variant="h6">
                    {pendingAnalysis.aiResult.sentiment}
                  </Typography>
                  <Typography variant="body2">
                    Confidence:{" "}
                    {(pendingAnalysis.aiResult.confidence * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Summary
                  </Typography>
                  <Typography variant="body2">
                    {pendingAnalysis.aiResult.summary}
                  </Typography>
                </Grid>
                {pendingAnalysis.aiResult.keyFindings && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Key Findings
                    </Typography>
                    <ul style={{ marginTop: 0 }}>
                      {pendingAnalysis.aiResult.keyFindings.map(
                        (finding, i) => (
                          <li key={i}>{finding}</li>
                        ),
                      )}
                    </ul>
                  </Grid>
                )}
                {pendingAnalysis.aiResult.recommendations && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Recommendations
                    </Typography>
                    <ul style={{ marginTop: 0 }}>
                      {pendingAnalysis.aiResult.recommendations.map(
                        (rec, i) => (
                          <li key={i}>{rec}</li>
                        ),
                      )}
                    </ul>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPendingAnalysis(null)}>Close</Button>
              {!tabSession.isActive() && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setPendingAnalysis(null);
                    setLoginDialogOpen(true);
                  }}
                  startIcon={<SaveIcon />}
                >
                  Save to Account
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default TrialUpload;
