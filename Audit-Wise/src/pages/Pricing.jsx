import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  useTheme,
  Alert,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import PricingCard from "../components/PricingCard";
import { db, PLAN_LIMITS } from "../database/db";
import { useAuth } from "../hooks/useAuth";

const Pricing = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { user } = useAuth();

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [currentUsage, setCurrentUsage] = useState(0);
  const [limit, setLimit] = useState(5);
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
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyUploads = await db.documents
          .where("userId")
          .equals(user.id)
          .filter((doc) => new Date(doc.scannedAt) >= startOfMonth)
          .count();

        setCurrentUsage(monthlyUploads);

        const userPlan = user?.plan || "free";
        const plan = pricingPlans.find(
          (p) => p.planType.toLowerCase() === userPlan.toLowerCase(),
        );
        const extraUploads = user?.extraUploads || 0;
        setLimit((plan?.maxUploads || 5) + extraUploads);
        setError(null);
      } catch (err) {
        setError("Failed to load usage data");
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [user]);

  const currentPlan = user?.plan || "free";
  const remainingAttempts = Math.max(0, limit - currentUsage);

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
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 4 },
        backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ textAlign: "center", mb: { xs: 2, sm: 3, md: 4 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: "auto" }}>
            {error}
          </Alert>
        )}

        {remainingAttempts <= 3 && remainingAttempts > 0 && (
          <Alert severity="warning" sx={{ mb: 2, maxWidth: 600, mx: "auto" }}>
            You have only {remainingAttempts} uploads left on your {currentPlan}{" "}
            plan!
          </Alert>
        )}

        {remainingAttempts === 0 && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: "auto" }}>
            You have reached your {currentPlan} plan limit. Please upgrade to
            continue uploading.
          </Alert>
        )}

        <Typography
          variant={isMobile ? "h5" : "h4"}
          sx={{ fontWeight: 800, mb: 2 }}
        >
          You have {remainingAttempts} uploads left on your {currentPlan} plan
        </Typography>

        <Typography variant="h6" color="text.secondary">
          Upgrade to unlock more features and higher limits
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          justifyContent: "center",
          flexWrap: "wrap",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "stretch",
        }}
      >
        {pricingPlans.map((plan, idx) => (
          <Box
            key={idx}
            sx={{
              flex: isMobile ? "1 1 auto" : "1 1 280px",
              maxWidth: isMobile ? "100%" : 350,
              width: isMobile ? "100%" : "auto",
            }}
          >
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
