import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  AppBar,
  Toolbar,
  useScrollTrigger,
  Slide,
  Stack,
  Avatar,
  Chip,
  Paper,
  alpha,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  CloudUpload as CloudUploadIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  ShieldOutlined as ShieldIcon,
} from "@mui/icons-material";

const ScrollHide = ({ children }) => {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
};

const FeatureCard = ({ icon, title, description, color }) => (
  <Card
    sx={{
      height: "100%",
      textAlign: "center",
      p: 3,
      borderRadius: 4,
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      "&:hover": {
        transform: "translateY(-8px)",
        boxShadow: (theme) => theme.shadows[8],
      },
    }}
  >
    <Avatar
      sx={{
        width: 64,
        height: 64,
        mx: "auto",
        mb: 2,
        bgcolor: color,
      }}
    >
      {icon}
    </Avatar>
    <Typography variant="h6" fontWeight="bold" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Card>
);

const PricingCard = ({
  title,
  price,
  features,
  isPopular,
  period = "month",
}) => (
  <Card
    sx={{
      height: "100%",
      position: "relative",
      borderRadius: 4,
      overflow: "hidden",
      transition: "transform 0.3s ease",
      "&:hover": {
        transform: "translateY(-4px)",
      },
      ...(isPopular && {
        border: "2px solid",
        borderColor: "primary.main",
        boxShadow: (theme) => theme.shadows[8],
      }),
    }}
  >
    {isPopular && (
      <Chip
        label="Most Popular"
        color="primary"
        size="small"
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          fontWeight: "bold",
        }}
      />
    )}
    <CardContent sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ my: 2 }}>
        <Typography variant="h3" fontWeight="bold" component="span">
          ₹{price}
        </Typography>
        <Typography variant="body2" color="text.secondary" component="span">
          /{period}
        </Typography>
      </Box>
      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {features.map((feature, idx) => (
          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
            <Typography variant="body2">{feature}</Typography>
          </Box>
        ))}
      </Stack>
    </CardContent>
  </Card>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const features = [
    {
      icon: <CloudUploadIcon />,
      title: "Smart Document Upload",
      description:
        "Upload PDFs, images, and documents with drag & drop support. AI extracts text automatically.",
      color: "#6366f1",
    },
    {
      icon: <AnalyticsIcon />,
      title: "AI-Powered Analysis",
      description:
        "Advanced sentiment analysis and risk assessment using state-of-the-art AI models.",
      color: "#10b981",
    },
    {
      icon: <SecurityIcon />,
      title: "Secure & Compliant",
      description:
        "Bank-level encryption and compliance with industry standards for data protection.",
      color: "#f59e0b",
    },
    {
      icon: <SpeedIcon />,
      title: "Lightning Fast",
      description:
        "Process documents in seconds with our optimized OCR and analysis pipeline.",
      color: "#ef4444",
    },
    {
      icon: <DescriptionIcon />,
      title: "Detailed Reports",
      description:
        "Generate comprehensive audit reports with actionable insights and recommendations.",
      color: "#8b5cf6",
    },
    {
      icon: <TrendingUpIcon />,
      title: "Track Progress",
      description:
        "Monitor your audit history, usage statistics, and compliance trends over time.",
      color: "#06b6d4",
    },
  ];

  const pricingPlans = [
    {
      title: "Free",
      price: 0,
      features: [
        "5 uploads per month",
        "Basic OCR scanning",
        "Email support",
        "Basic analytics",
        "7-day report history",
      ],
      isPopular: false,
    },
    {
      title: "Pro",
      price: 499,
      features: [
        "50 uploads per month",
        "Advanced OCR + AI analysis",
        "Priority email support",
        "Advanced analytics & insights",
        "30-day report history",
        "Export reports (PDF/Excel)",
        "Risk assessment dashboard",
      ],
      isPopular: true,
    },
    {
      title: "Business",
      price: 999,
      features: [
        "200 uploads per month",
        "Enterprise-grade AI analysis",
        "24/7 phone & email support",
        "Custom analytics & reports",
        "Unlimited report history",
        "Team collaboration",
        "API access",
        "Dedicated account manager",
      ],
      isPopular: false,
    },
  ];

  const stats = [
    { value: "10K+", label: "Documents Processed" },
    { value: "98%", label: "Accuracy Rate" },
    { value: "500+", label: "Happy Clients" },
    { value: "24/7", label: "Support Available" },
  ];

  return (
    <Box sx={{ overflowX: "hidden" }}>
      <ScrollHide>
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            backdropFilter: "blur(10px)",
            backgroundColor: (theme) =>
              alpha(theme.palette.background.default, 0.8),
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar>
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <ShieldIcon sx={{ mr: 1, color: "primary.main", fontSize: 32 }} />
              <Typography variant="h6" fontWeight="bold">
                Audit<span style={{ color: "#6366f1" }}>Wise</span>
              </Typography>
            </Box>

            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4 }}>
              <Button color="inherit" href="#features">
                Features
              </Button>
              <Button color="inherit" href="#pricing">
                Pricing
              </Button>
              <Button color="inherit" href="#about">
                About
              </Button>
            </Box>

            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, ml: 4 }}>
              <Button variant="outlined" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/trial-upload")}
                sx={{
                  background: "linear-gradient(90deg, #6366f1, #38bdf8)",
                }}
              >
                Start Free Trial
              </Button>
            </Box>

            <IconButton
              sx={{ display: { xs: "flex", md: "none" } }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>
      </ScrollHide>

      {mobileMenuOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            bgcolor: "background.paper",
            zIndex: 1000,
            p: 2,
            boxShadow: 3,
            display: { xs: "block", md: "none" },
          }}
        >
          <Stack spacing={2}>
            <Button
              fullWidth
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Button>
            <Button
              fullWidth
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Button>
            <Button
              fullWidth
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate("/trial-upload")}
              sx={{
                background: "linear-gradient(90deg, #6366f1, #38bdf8)",
              }}
            >
              Start Free Trial
            </Button>
          </Stack>
        </Box>
      )}

      <Box
        sx={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)"
              : "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip
                label="AI-Powered Audit Platform"
                color="primary"
                sx={{ mb: 3, fontWeight: "bold" }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "3.5rem", lg: "4rem" },
                  fontWeight: 800,
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                Transform Your{" "}
                <span
                  style={{
                    color: "#6366f1",
                    background: "linear-gradient(90deg, #6366f1, #38bdf8)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Document Audit
                </span>{" "}
                Process
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Automate document analysis with AI-powered OCR, sentiment
                detection, and risk assessment. Save time, reduce errors, and
                make informed decisions.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  size="large"
                  variant="contained"
                  onClick={() => navigate("/trial-upload")}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: "1.1rem",
                    background: "linear-gradient(90deg, #6366f1, #38bdf8)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #4f46e5, #0ea5e9)",
                    },
                  }}
                >
                  Start Free Trial
                </Button>
                <Button
                  size="large"
                  variant="outlined"
                  href="#features"
                  sx={{ py: 1.5, px: 4, fontSize: "1.1rem" }}
                >
                  Learn More
                </Button>
              </Stack>
              <Box sx={{ mt: 4, display: "flex", gap: 3 }}>
                {stats.map((stat, idx) => (
                  <Box key={idx}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(30, 41, 59, 0.5)"
                      : "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Try AuditWise Free
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload a document and see AI analysis in action
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: "black",
                      borderRadius: 2,
                      height: 300,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #1e293b, #0f172a)",
                    }}
                  >
                    <Typography color="white" variant="body2">
                      Demo Preview
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box id="features" sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip label="Why Choose Us" color="secondary" sx={{ mb: 2 }} />
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Powerful Features for Modern Auditing
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: "auto" }}
            >
              Everything you need to streamline your document audit process
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <FeatureCard {...feature} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 10, bgcolor: "action.hover" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              How It Works
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Simple 3-step process to get insights from your documents
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                step: "01",
                title: "Upload",
                description:
                  "Drag & drop your documents - PDFs, images, or Word files",
                icon: <CloudUploadIcon />,
              },
              {
                step: "02",
                title: "Analyze",
                description:
                  "AI extracts text and performs sentiment & risk analysis",
                icon: <AnalyticsIcon />,
              },
              {
                step: "03",
                title: "Get Reports",
                description:
                  "Receive detailed insights and actionable recommendations",
                icon: <DescriptionIcon />,
              },
            ].map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Box sx={{ textAlign: "center" }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 2,
                      bgcolor: "primary.main",
                    }}
                  >
                    {item.icon}
                  </Avatar>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Step {item.step}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box id="pricing" sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip label="Pricing Plans" color="primary" sx={{ mb: 2 }} />
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Choose the Perfect Plan
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Start for free, upgrade as you grow
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="stretch">
            {pricingPlans.map((plan, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <PricingCard {...plan} />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/trial-upload")}
              sx={{
                py: 1.5,
                px: 6,
                fontSize: "1.1rem",
                background: "linear-gradient(90deg, #6366f1, #38bdf8)",
              }}
            >
              Try It Free
            </Button>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 10, bgcolor: "action.hover" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Trusted by Professionals
            </Typography>
            <Typography variant="h6" color="text.secondary">
              See what our customers say about AuditWise
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                name: "Rajesh Kumar",
                role: "Financial Auditor",
                quote:
                  "AuditWise has transformed how we handle document reviews. The AI analysis is incredibly accurate and saves us hours of manual work.",
              },
              {
                name: "Priya Sharma",
                role: "Compliance Officer",
                quote:
                  "The risk assessment feature is a game-changer. We've reduced our audit time by 60% while improving accuracy.",
              },
              {
                name: "Amit Patel",
                role: "CA Firm Partner",
                quote:
                  "Excellent platform for audit firms. The reporting features are comprehensive and client-friendly.",
              },
            ].map((testimonial, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Card sx={{ height: "100%", borderRadius: 3, p: 3 }}>
                  <Typography
                    variant="body1"
                    sx={{ mb: 2, fontStyle: "italic" }}
                  >
                    "{testimonial.quote}"
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {testimonial.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {testimonial.role}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box
        sx={{
          py: 10,
          background: "linear-gradient(135deg, #6366f1, #38bdf8)",
          color: "white",
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Ready to Transform Your Audit Process?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of professionals who trust AuditWise for their
            document analysis
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/trial-upload")}
            sx={{
              bgcolor: "white",
              color: "#6366f1",
              py: 1.5,
              px: 6,
              fontSize: "1.1rem",
              "&:hover": {
                bgcolor: "#f8fafc",
              },
            }}
          >
            Try It Free
          </Button>
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
            No credit card required • Free trial available
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: 6, bgcolor: "background.paper" }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ShieldIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6" fontWeight="bold">
                  Audit<span style={{ color: "#6366f1" }}>Wise</span>
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                AI-powered document audit platform helping businesses streamline
                their compliance and review processes.
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Product
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Features
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pricing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Demo
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Company
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  About Us
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blog
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Careers
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Support
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Help Center
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Contact Us
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Privacy Policy
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Legal
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Terms of Service
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compliance
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          <Box
            sx={{
              textAlign: "center",
              mt: 4,
              pt: 3,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © 2024 AuditWise. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
