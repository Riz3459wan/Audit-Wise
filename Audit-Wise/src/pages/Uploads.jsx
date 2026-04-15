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

import { useAuth } from "../hooks/useAuth";
import { db, dbHelpers } from "../database/db";

const Uploads = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [uploadLimit, setUploadLimit] = useState({
    used: 0,
    total: 5,
    remaining: 5,
  });

  const planLimits = {
    free: { maxUploads: 5, maxFileSize: 5 * 1024 * 1024 },
    pro: { maxUploads: 50, maxFileSize: 25 * 1024 * 1024 },
    business: { maxUploads: 200, maxFileSize: 100 * 1024 * 1024 },
  };

  useEffect(() => {
    if (user) {
      loadRecentUploads();
      loadUploadStats();
    }
  }, [user]);

  const loadRecentUploads = async () => {
    const docs = await db.documents
      .where("userId")
      .equals(user.id)
      .reverse()
      .limit(10)
      .toArray();
    setRecentUploads(docs);
  };

  const loadUploadStats = async () => {
    const totalUploads = await db.documents
      .where("userId")
      .equals(user.id)
      .count();
    const plan = user?.plan || "free";
    const maxUploads = planLimits[plan]?.maxUploads || 5;

    setUploadLimit({
      used: totalUploads,
      total: maxUploads,
      remaining: maxUploads - totalUploads,
    });
  };

  const checkUploadLimit = (fileCount) => {
    const plan = user?.plan || "free";
    const maxUploads = planLimits[plan]?.maxUploads;

    if (uploadLimit.used + fileCount > maxUploads) {
      setError(
        `You have reached your ${plan} plan limit of ${maxUploads} uploads. Upgrade to upload more.`,
      );
      return false;
    }
    return true;
  };

  const checkFileSize = (file) => {
    const plan = user?.plan || "free";
    const maxSize = planLimits[plan]?.maxFileSize;

    if (file.size > maxSize) {
      setError(
        `${file.name} exceeds ${plan} plan limit of ${maxSize / (1024 * 1024)}MB`,
      );
      return false;
    }
    return true;
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (!checkUploadLimit(files.length)) return;

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
      error: null,
    }));

    setUploads((prev) => [...prev, ...newUploads]);
    setError("");
  };

  const simulateUpload = async (uploadItem) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadItem.id ? { ...u, progress } : u)),
        );
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  };

  const processDocument = async (uploadItem) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === uploadItem.id ? { ...u, status: "processing" } : u,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const documentData = {
      fileName: uploadItem.file.name,
      fileSize: uploadItem.file.size,
      fileType: uploadItem.file.type,
      filePath: URL.createObjectURL(uploadItem.file),
      status: "completed",
    };

    const documentId = await dbHelpers.saveDocument(user.id, documentData);

    setUploads((prev) =>
      prev.map((u) =>
        u.id === uploadItem.id ? { ...u, status: "completed", documentId } : u,
      ),
    );

    await loadRecentUploads();
    await loadUploadStats();

    return documentId;
  };

  const handleUpload = async () => {
    const pendingUploads = uploads.filter((u) => u.status === "pending");
    if (pendingUploads.length === 0) return;

    if (!checkUploadLimit(pendingUploads.length)) return;

    setIsUploading(true);
    setError("");

    for (const upload of pendingUploads) {
      try {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: "uploading" } : u,
          ),
        );

        await simulateUpload(upload);
        await processDocument(upload);
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: "error", error: err.message }
              : u,
          ),
        );
        setError(`Failed to upload ${upload.name}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyse = async () => {
    const completedUploads = uploads.filter((u) => u.status === "completed");
    if (completedUploads.length === 0) {
      setError("No completed uploads to analyse");
      return;
    }

    setIsAnalysing(true);
    setError("");

    for (const upload of completedUploads) {
      try {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: "analysing" } : u,
          ),
        );

        await new Promise((resolve) => setTimeout(resolve, 2000));

        await dbHelpers.saveAnalyseResult(upload.documentId, user.id, {
          extractedText: "Sample extracted text from document",
          confidence: 0.95,
          modelUsed: "trocr-base-printed",
          language: "en",
        });

        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: "analysed" } : u,
          ),
        );
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: "error", error: err.message }
              : u,
          ),
        );
        setError(`Failed to analyse ${upload.name}`);
      }
    }

    setIsAnalysing(false);
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
    await db.documents.delete(docId);
    await loadRecentUploads();
    await loadUploadStats();
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
    const plan = user?.plan || "free";
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
    const remaining = uploadLimit.remaining;
    if (remaining <= 0) return "danger";
    if (remaining <= 2) return "warning";
    return "ok";
  };

  const hasCompletedUploads = uploads.some((u) => u.status === "completed");
  const hasPendingUploads = uploads.some((u) => u.status === "pending");

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Upload Documents
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        Upload audit documents for processing and analysis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid xs={12} md={7}>
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
                borderColor: uploadLimit.remaining <= 0 ? "#f44336" : "divider",
                borderRadius: "15px",
                backgroundColor: "transparent",
                cursor: uploadLimit.remaining <= 0 ? "not-allowed" : "pointer",
                opacity: uploadLimit.remaining <= 0 ? 0.5 : 1,
                "&:hover": {
                  borderColor:
                    uploadLimit.remaining <= 0 ? "#f44336" : "#6366f1",
                  backgroundColor:
                    uploadLimit.remaining <= 0
                      ? "transparent"
                      : "rgba(99, 102, 241, 0.02)",
                },
              }}
              onClick={() =>
                uploadLimit.remaining > 0 && fileInputRef.current?.click()
              }
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                style={{ display: "none" }}
                onChange={handleFileSelect}
                disabled={isUploading || uploadLimit.remaining <= 0}
              />
              <CloudUploadIcon
                sx={{
                  fontSize: 60,
                  color: uploadLimit.remaining <= 0 ? "#f44336" : "#6366f1",
                  mb: 2,
                }}
              />
              <Typography variant="h6" gutterBottom>
                {uploadLimit.remaining <= 0
                  ? "Upload Limit Reached"
                  : "Drag & drop files here or click to browse"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supports: PDF, JPG, PNG, DOC (Max{" "}
                {planLimits[user?.plan || "free"]?.maxFileSize / (1024 * 1024)}
                MB per file)
              </Typography>
              {uploadLimit.remaining <= 0 && (
                <Button
                  variant="contained"
                  sx={{
                    mt: 2,
                    background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                  }}
                  onClick={() => (window.location.href = "/price")}
                >
                  Upgrade Plan
                </Button>
              )}
            </Paper>

            {/* Upload Queue */}
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
                    {hasPendingUploads && (
                      <Button
                        variant="contained"
                        onClick={handleUpload}
                        disabled={isUploading || uploadLimit.remaining <= 0}
                        sx={{
                          background:
                            "linear-gradient(90deg, #6366f1, #38bdf8)",
                        }}
                      >
                        {isUploading ? (
                          <CircularProgress size={24} sx={{ color: "white" }} />
                        ) : (
                          `Upload ${uploads.filter((u) => u.status === "pending").length} Files`
                        )}
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
                        upload.status !== "uploading" &&
                        upload.status !== "processing" &&
                        upload.status !== "analysing" && (
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
                            }}
                          >
                            <Typography variant="body1" fontWeight="medium">
                              {upload.name}
                            </Typography>
                            <Chip
                              label={upload.status}
                              size="small"
                              color={getStatusColor(upload.status)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              {formatFileSize(upload.size)}
                            </Typography>
                            {upload.progress > 0 && upload.progress < 100 && (
                              <LinearProgress
                                variant="determinate"
                                value={upload.progress}
                                sx={{ mt: 1, height: 4, borderRadius: 2 }}
                              />
                            )}
                            {upload.error && (
                              <Typography variant="caption" color="error">
                                {upload.error}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {hasCompletedUploads && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={isAnalysing}
                onClick={handleAnalyse}
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
                  ? "Analysing Documents..."
                  : "Analyse Uploaded Documents"}
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
            <Paper sx={{ borderRadius: "15px", overflow: "hidden", flex: 1 }}>
              <Box
                sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Typography variant="h6">Recent Uploads</Typography>
              </Box>
              {recentUploads.length > 0 ? (
                <List sx={{ maxHeight: 400, overflow: "auto" }}>
                  {recentUploads.map((doc, index) => (
                    <ListItem
                      key={doc.id}
                      divider={index < recentUploads.length - 1}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => deleteRecentUpload(doc.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <CloudDoneIcon sx={{ color: "#10b981" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body1" fontWeight="medium">
                              {doc.fileName}
                            </Typography>
                            <Chip
                              label={doc.status}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="textSecondary">
                            {formatFileSize(doc.fileSize)} •{" "}
                            {formatDate(doc.scannedAt)}
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

            {/* Plan Card */}
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
                <Divider sx={{ my: 2 }} />
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Upload Usage
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    {uploadLimit.used}/
                    {uploadLimit.total === Infinity
                      ? "Unlimited"
                      : uploadLimit.total}
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
                    {uploadLimit.remaining === Infinity
                      ? "Unlimited remaining"
                      : `${uploadLimit.remaining} remaining`}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    (uploadLimit.used /
                      (uploadLimit.total === Infinity
                        ? 100
                        : uploadLimit.total)) *
                    100
                  }
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
                {uploadLimit.remaining <= 2 && uploadLimit.remaining > 0 && (
                  <Alert
                    severity="warning"
                    sx={{ mt: 2 }}
                    icon={<WarningIcon />}
                  >
                    You have only {uploadLimit.remaining} uploads left on your{" "}
                    {user?.plan || "free"} plan.
                    <Button
                      size="small"
                      color="warning"
                      href="/price"
                      sx={{ ml: 1 }}
                    >
                      Upgrade
                    </Button>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Empty State */}
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
            Click the area above to select files for audit
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Uploads;
