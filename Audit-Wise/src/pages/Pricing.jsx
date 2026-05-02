import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  useTheme,
  Alert,
  CircularProgress,
} from "@mui/material";
import PricingCard from "../components/PricingCard";
import { dbHelpers, PLAN_LIMITS } from "../database/db";
import { useAuth } from "../hooks/useAuth";

const Pricing = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { user } = useAuth();

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [monthlyUsage, setMonthlyUsage] = useState({
    used: 0,
    total: 5,
    remaining: 5,
    plan: "free",
    baseLimit: 5,
    extraUploads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pricingPlans = [
    {
      planType: "Free",
      price: 0,
      overview: "Basic features for individual users",
      details: [
        { icon: "✓", description: "5 uploads per month" },
        { icon: "✓", description: "Basic OCR scanning" },
        { icon: "✓", description: "Email support" },
        { icon: "✗", description: "Advanced analytics" },
        { icon: "✗", description: "Priority support" },
      ],
      maxUploads: PLAN_LIMITS.free,
    },
    {
      planType: "Pro",
      price: 499,
      overview: "Advanced features for professionals",
      details: [
        { icon: "✓", description: "50 uploads per month" },
        { icon: "✓", description: "Advanced OCR scanning" },
        { icon: "✓", description: "Priority email support" },
        { icon: "✓", description: "Advanced analytics" },
        { icon: "✗", description: "24/7 phone support" },
      ],
      maxUploads: PLAN_LIMITS.pro,
    },
    {
      planType: "Business",
      price: 999,
      overview: "Complete solution for businesses",
      details: [
        { icon: "✓", description: "200 uploads per month" },
        { icon: "✓", description: "Advanced OCR + AI analysis" },
        { icon: "✓", description: "24/7 priority support" },
        { icon: "✓", description: "Advanced analytics + Reports" },
        { icon: "✓", description: "Team collaboration" },
      ],
      maxUploads: PLAN_LIMITS.business,
    },
  ];

  useEffect(() => {
    const loadUsage = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const usage = await dbHelpers.getUserMonthlyUsage(user.id);
        setMonthlyUsage(usage);
        setError(null);
      } catch (err) {
        console.error("Failed to load usage:", err);
        setError("Failed to load usage data");
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [user]);

  const currentPlan = user?.plan || "free";
  const remainingAttempts = monthlyUsage.remaining;
  const usedAttempts = monthlyUsage.used;
  const totalLimit = monthlyUsage.total;
  const extraUploads = monthlyUsage.extraUploads;

  if (loading) {
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

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ textAlign: "center", mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: "auto" }}>
            {error}
          </Alert>
        )}

        {extraUploads > 0 && (
          <Alert severity="info" sx={{ mb: 2, maxWidth: 600, mx: "auto" }}>
            You have {extraUploads} extra upload{extraUploads === 1 ? "" : "s"}{" "}
            purchased!
          </Alert>
        )}

        {remainingAttempts <= 3 && remainingAttempts > 0 && (
          <Alert severity="warning" sx={{ mb: 2, maxWidth: 600, mx: "auto" }}>
            You have only {remainingAttempts} upload
            {remainingAttempts === 1 ? "" : "s"} left on your {currentPlan} plan
            this month!
          </Alert>
        )}

        {remainingAttempts === 0 && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: "auto" }}>
            You have reached your {currentPlan} plan limit for this month.
            Please upgrade to continue uploading.
          </Alert>
        )}

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
          You have used {usedAttempts} out of {totalLimit} upload
          {totalLimit === 1 ? "" : "s"} this month
        </Typography>

        <Typography variant="h5" sx={{ mb: 1 }}>
          {remainingAttempts} upload{remainingAttempts === 1 ? "" : "s"}{" "}
          remaining on your {currentPlan} plan
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {extraUploads > 0 && `${extraUploads} extra uploads included`}
          {extraUploads === 0 &&
            currentPlan === "free" &&
            "Upgrade to Pro or Business for more uploads"}
          {extraUploads === 0 &&
            currentPlan !== "free" &&
            "Purchase extra uploads if you need more"}
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Upgrade to unlock more features and higher limits
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {pricingPlans.map((plan, idx) => (
          <Box key={idx} sx={{ flex: "1 1 280px", maxWidth: 350 }}>
            <PricingCard
              plan={plan}
              currentPlan={currentPlan}
              setSelectedPlanForPayment={setSelectedPlanForPayment}
              selectedPlanForPayment={selectedPlanForPayment}
            />
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default Pricing;
