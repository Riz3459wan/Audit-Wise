import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { usePreventBack } from "../hooks/usePreventBack";
import { useAuth } from "../hooks/useAuth";
import { db } from "../database/db";

const Dashboard = () => {
  usePreventBack();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalReports: 0,
    totalUploadsThisMonth: 0,
    loading: true,
    error: null,
  });

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

  const planLimits = {
    free: 5,
    pro: 50,
    business: 200,
  };

  const currentPlan = user?.plan || "free";
  const remainingUploads = Math.max(
    0,
    (planLimits[currentPlan] || 5) - stats.totalUploadsThisMonth,
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
        {stats.totalUploadsThisMonth} uploads this month •{" "}
        {planLimits[currentPlan]} - {stats.totalUploadsThisMonth} remaining
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
        <Typography variant="h6" mb={2}>
          Recent Activity
        </Typography>
        <Card sx={{ borderRadius: "15px", p: 2 }}>
          <Typography color="textSecondary">
            Your recent uploads and reports will appear here...
          </Typography>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
