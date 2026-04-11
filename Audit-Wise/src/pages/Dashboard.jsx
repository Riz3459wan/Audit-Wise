import React from "react";
import { Box, Grid, Card, CardContent, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { usePreventBack } from "../hooks/usePreventBack";
import { useAuth } from "../hooks/useAuth";
import SettingsIcon from "@mui/icons-material/Settings";

const Dashboard = () => {
  usePreventBack();
  const { user } = useAuth();
  const stats = [
    {
      title: "Total Uploads",
      value: "24",
      icon: <CloudUploadIcon />,
      color: "#38bdf8",
    },
    {
      title: "Reports Generated",
      value: "18",
      icon: <AssessmentIcon />,
      color: "#6366f1",
    },
    {
      title: "Growth Rate",
      value: "+32%",
      icon: <TrendingUpIcon />,
      color: "#10b981",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid xs={12} md={4} key={index}>
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
