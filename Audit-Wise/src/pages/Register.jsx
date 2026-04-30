import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../database/db";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setError("Enter a valid email address");
      return false;
    }
    if (!form.password) {
      setError("Password is required");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const existingUser = await db.users
        .where("email")
        .equals(form.email.toLowerCase())
        .first();

      if (existingUser) {
        setError("User already exists with this email");
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      await db.users.add({
        name: form.name.trim(),
        email: form.email.toLowerCase(),
        password: form.password,
        plan: "free",
        createdAt: now.toISOString(),
        isActive: true,
        monthlyUploadCount: 0,
        monthlyResetDate: firstDayOfMonth.toISOString(),
        extraUploads: 0,
        fullName: form.name.trim(),
        phone: "",
        company: "",
        position: "",
        location: "",
        bio: "",
        avatar: null,
        securitySettings: {
          twoFactorAuth: false,
          sessionTimeout: "30",
          loginAlerts: true,
        },
        updatedAt: now.toISOString(),
      });

      setOpenSuccess(true);
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  const handleSuccessClose = () => {
    setOpenSuccess(false);
    navigate("/login");
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #6366f1, #38bdf8)",
        margin: 0,
        padding: 0,
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: 400,
          borderRadius: "15px",
          border: "none",
          outline: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={2} align="center">
          Create Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Full Name"
          name="name"
          margin="normal"
          value={form.name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          error={!!error && !form.name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: "#6366f1" }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          margin="normal"
          value={form.email}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          error={!!error && !form.email}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: "#6366f1" }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          margin="normal"
          value={form.password}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          error={!!error && !form.password}
          helperText="Minimum 6 characters"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "#6366f1" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          margin="normal"
          value={form.confirmPassword}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          error={!!error && form.confirmPassword !== form.password}
          helperText={
            form.password !== form.confirmPassword && form.confirmPassword
              ? "Passwords do not match"
              : ""
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "#6366f1" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? (
                    <VisibilityOffIcon />
                  ) : (
                    <VisibilityIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{
            mt: 3,
            py: 1.5,
            background: "linear-gradient(90deg, #6366f1, #38bdf8)",
          }}
          onClick={handleRegister}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "Register"
          )}
        </Button>

        <Typography mt={2} align="center">
          Already have an account?{" "}
          <Link
            to="/"
            style={{
              color: "#38bdf8",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </Typography>
      </Paper>

      {openSuccess && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
          onClick={handleSuccessClose}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 400,
              textAlign: "center",
              borderRadius: "15px",
              border: "none",
              outline: "none",
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Registration Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your account has been created. Click anywhere to continue to
              login.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSuccessClose}
              sx={{
                py: 1.5,
                background: "linear-gradient(90deg, #6366f1, #38bdf8)",
              }}
            >
              Go to Login
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default Register;
