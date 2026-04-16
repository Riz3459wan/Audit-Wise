import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { usePreventBack } from "../hooks/usePreventBack";
import { useAuth } from "../hooks/useAuth";
import { db, PLAN_LIMITS } from "../database/db";

const Dashboard = () => {
  usePreventBack();
  const { user, addExtraUploads } = useAuth();
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalReports: 0,
    totalUploadsThisMonth: 0,
    loading: true,
    error: null,
  });
  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [extraCount, setExtraCount] = useState(10);
  const [addingExtra, setAddingExtra] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalUploads = await db.documents
          .where("userId")
          .equals(user.id)
          .count();
        const totalReports = await db.reports
          .where("userId")
          .equals(user.id)
          .count();

        const monthlyUploads = await db.documents
          .where("userId")
          .equals(user.id)
          .filter((doc) => new Date(doc.scannedAt) >= startOfMonth)
          .count();

        setStats({
          totalUploads,
          totalReports,
          totalUploadsThisMonth: monthlyUploads,
          loading: false,
          error: null,
        });
      } catch (err) {
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load statistics",
        }));
      }
    };

    loadStats();
  }, [user]);

  const currentPlan = user?.plan || "free";
  const extraUploads = user?.extraUploads || 0;
  const baseLimit = PLAN_LIMITS[currentPlan] || 5;
  const totalLimit = baseLimit + extraUploads;
  const remainingUploads = Math.max(
    0,
    totalLimit - stats.totalUploadsThisMonth,
  );

  const statCards = [
    {
      title: "Total Uploads",
      value: stats.totalUploads,
      icon: <CloudUploadIcon />,
      color: "#38bdf8",
    },
    {
      title: "Reports Generated",
      value: stats.totalReports,
      icon: <AssessmentIcon />,
      color: "#6366f1",
    },
    {
      title: "Remaining This Month",
      value: remainingUploads,
      icon: <TrendingUpIcon />,
      color: remainingUploads <= 2 ? "#f59e0b" : "#10b981",
    },
  ];

  const handleAddExtraUploads = async () => {
    setAddingExtra(true);
    const price = extraCount * 50;
    const result = await addExtraUploads(extraCount, price);
    if (result.success) {
      setExtraDialogOpen(false);
      setExtraCount(10);
      window.location.reload();
    } else {
      alert("Failed to add extra uploads");
    }
    setAddingExtra(false);
  };

  if (stats.loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (stats.error) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="error">{stats.error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Welcome back, {user?.name?.split(" ")[0] || "User"}!
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        {stats.totalUploadsThisMonth} uploads this month • {totalLimit} total
        limit ({baseLimit} base + {extraUploads} extra)
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ borderRadius: "15px", boxShadow: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color, fontSize: 40 }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Recent Activity</Typography>
          {currentPlan !== "free" && (
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setExtraDialogOpen(true)}
              sx={{ background: "linear-gradient(90deg, #10b981, #059669)" }}
            >
              Buy Extra Uploads
            </Button>
          )}
        </Box>
        <Card sx={{ borderRadius: "15px", p: 2 }}>
          <Typography color="textSecondary">
            Your recent uploads and reports will appear here...
          </Typography>
        </Card>
      </Box>

      <Dialog open={extraDialogOpen} onClose={() => setExtraDialogOpen(false)}>
        <DialogTitle>Purchase Extra Uploads</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Each extra upload costs ₹50. These will be added to your current
            monthly limit.
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Number of Extra Uploads"
            value={extraCount}
            onChange={(e) =>
              setExtraCount(Math.max(1, parseInt(e.target.value) || 0))
            }
            InputProps={{ inputProps: { min: 1, max: 100 } }}
          />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Total: ₹{extraCount * 50}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtraDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddExtraUploads}
            disabled={addingExtra}
            variant="contained"
            color="primary"
          >
            {addingExtra ? <CircularProgress size={24} /> : "Purchase"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
