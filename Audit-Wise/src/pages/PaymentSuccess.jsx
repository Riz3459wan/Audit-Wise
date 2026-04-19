import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { usePreventBack } from "../hooks/usePreventBack";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserPlan, refreshUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState(null);
  usePreventBack();

  const purchasedPlan = location.state?.plan;

  useEffect(() => {
    const updatePlan = async () => {
      if (!purchasedPlan) {
        navigate("/price", { replace: true });
        return;
      }

      try {
        const result = await updateUserPlan(purchasedPlan.planType);
        if (result.success) {
          await refreshUser();
          setIsUpdating(false);
        } else {
          setError(
            result.error || "Failed to update plan. Please contact support.",
          );
          setIsUpdating(false);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please contact support.");
        setIsUpdating(false);
      }
    };

    updatePlan();
  }, [purchasedPlan, updateUserPlan, refreshUser, navigate]);

  const handleGoToDashboard = () => {
    navigate("/dashboard", { replace: true });
  };

  if (!purchasedPlan) {
    return null;
  }

  if (isUpdating) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #6366f1, #38bdf8)",
        }}
      >
        <Paper
          elevation={6}
          sx={{ padding: 6, borderRadius: "15px", textAlign: "center" }}
        >
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5">Activating your plan...</Typography>
          <Typography variant="body2" color="textSecondary">
            Please wait while we update your account.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #6366f1, #38bdf8)",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 6,
            width: 450,
            borderRadius: "15px",
            textAlign: "center",
          }}
        >
          <Typography variant="h4" color="error" mb={2}>
            Something went wrong
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate("/price", { replace: true })}
          >
            Return to Pricing
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #6366f1, #38bdf8)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 6,
          width: 450,
          borderRadius: "15px",
          textAlign: "center",
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 80, color: "#10b981", mb: 2 }} />

        <Typography variant="h4" fontWeight="bold" mb={2}>
          Payment Successful!
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={1}>
          Your <strong>{purchasedPlan?.planType}</strong> plan has been
          activated.
        </Typography>

        <Typography variant="h5" fontWeight={600} color="primary" mb={3}>
          Amount Paid: ₹{purchasedPlan?.price}
        </Typography>

        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            py: 1.5,
            background: "linear-gradient(90deg, #6366f1, #38bdf8)",
            fontWeight: 600,
          }}
          onClick={handleGoToDashboard}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default PaymentSuccess;
