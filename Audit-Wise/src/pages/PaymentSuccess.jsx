import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { usePreventBack } from "../hooks/usePreventBack";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserPlan, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(true);
  const [updateError, setUpdateError] = useState("");
  usePreventBack();

  const purchasedPlan = location.state?.plan;

  useEffect(() => {
    const updatePlan = async () => {
      if (purchasedPlan && user) {
        try {
          const result = await updateUserPlan(purchasedPlan.planType);
          if (result.success) {
            setIsUpdating(false);
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 3000);
          } else {
            setUpdateError(result.error || "Failed to update plan");
            setIsUpdating(false);
          }
        } catch (error) {
          setUpdateError("Failed to update plan. Please contact support.");
          setIsUpdating(false);
        }
      } else {
        setIsUpdating(false);
      }
    };

    updatePlan();
  }, [purchasedPlan, updateUserPlan, user, navigate]);

  const handleGoToDashboard = () => {
    navigate("/dashboard", { replace: true });
  };

  if (!purchasedPlan) {
    navigate("/price", { replace: true });
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
          sx={{
            padding: 6,
            width: 450,
            borderRadius: "15px",
            textAlign: "center",
          }}
        >
          <CircularProgress size={60} sx={{ color: "#6366f1", mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            Updating your plan...
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Please wait while we activate your {purchasedPlan?.planType} plan.
          </Typography>
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

        {updateError ? (
          <>
            <Typography variant="body1" color="error" mb={1}>
              {updateError}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Please contact support or try upgrading again from the pricing
              page.
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
              onClick={() => navigate("/price", { replace: true })}
            >
              Go to Pricing
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" mb={1}>
              Your <strong>{purchasedPlan?.planType}</strong> plan has been
              activated successfully.
            </Typography>
            <Typography variant="h5" fontWeight={600} color="primary" mb={3}>
              Amount Paid: ₹{purchasedPlan?.price}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Redirecting to dashboard in a few seconds...
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
              Go to Dashboard Now
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default PaymentSuccess;
