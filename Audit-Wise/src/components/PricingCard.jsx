import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const PricingCard = ({ plan, currentPlan, setSelectedPlanForPayment }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      setSelectedPlanForPayment(plan);
      navigate("/paymentConfirmation", {
        state: { plan: plan },
        replace: true,
      });
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setIsProcessing(false);
    }
  };

  const isCurrentPlan =
    currentPlan?.toLowerCase() === plan.planType.toLowerCase();
  const isFreePlan = plan.planType === "Free";

  return (
    <Box
      sx={{ position: "relative", width: "100%", maxWidth: 400, mx: "auto" }}
    >
      {isCurrentPlan && (
        <Chip
          label="Current Plan"
          size="small"
          sx={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            fontWeight: 600,
            backgroundColor: "#10b981",
            color: "white",
          }}
        />
      )}

      <Card
        elevation={isCurrentPlan ? 8 : 3}
        sx={{
          border: 2,
          borderColor: isCurrentPlan ? "#10b981" : "grey.300",
          borderRadius: 3,
          textAlign: "center",
          transition: "all 0.3s ease",
          height: "100%",
          minHeight: 520,
          display: "flex",
          flexDirection: "column",
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow: 6,
          },
        }}
      >
        <CardContent
          sx={{ flexGrow: 1, p: 4, display: "flex", flexDirection: "column" }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#6366f1",
              mb: 2,
              textTransform: "capitalize",
            }}
          >
            {plan.planType}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "text.primary",
              }}
            >
              {plan.price === 0 ? "Free" : `₹${plan.price}`}
            </Typography>
            {plan.price > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                per month
              </Typography>
            )}
            {plan.price > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                (exclusive of GST)
              </Typography>
            )}
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {plan.overview}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
            {plan.details.map((detail, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  justifyContent: "flex-start",
                  px: 2,
                }}
              >
                <Box
                  sx={{
                    color: detail.icon === "✓" ? "#10b981" : "#f44336",
                    minWidth: 24,
                  }}
                >
                  {detail.icon === "✓" ? (
                    <CheckCircleIcon fontSize="small" />
                  ) : (
                    <CancelIcon fontSize="small" />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "left",
                    color: "text.primary",
                  }}
                >
                  {detail.description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: "center", p: 3, pt: 0 }}>
          <Button
            variant={isCurrentPlan ? "outlined" : "contained"}
            size="large"
            fullWidth
            onClick={handlePayment}
            disabled={isCurrentPlan || isFreePlan || isProcessing}
            sx={{
              py: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1rem",
              background:
                isCurrentPlan || isFreePlan
                  ? undefined
                  : "linear-gradient(90deg, #6366f1, #38bdf8)",
            }}
          >
            {isProcessing ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : isCurrentPlan ? (
              "Current Plan"
            ) : isFreePlan ? (
              "Current Free Plan"
            ) : (
              `Upgrade to ${plan.planType}`
            )}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default PricingCard;
