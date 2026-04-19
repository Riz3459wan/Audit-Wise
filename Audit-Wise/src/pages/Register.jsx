import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../database/db";

const simpleHash = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(form.password);
  const strengthColor =
    passwordStrength === 0
      ? "error"
      : passwordStrength <= 2
        ? "warning"
        : "success";
  const strengthText =
    passwordStrength === 0
      ? "Very Weak"
      : passwordStrength <= 2
        ? "Weak"
        : "Strong";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;

    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!emailRegex.test(form.email)) {
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
    if (getPasswordStrength(form.password) < 2) {
      setError(
        "Password is too weak. Use a mix of letters, numbers, and symbols",
      );
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

      const hashedPassword = await simpleHash(form.password);

      await db.users.add({
        name: form.name.trim(),
        email: form.email.toLowerCase(),
        password: hashedPassword,
        plan: "free",
        createdAt: new Date().toISOString(),
        isActive: true,
        monthlyUploadCount: 0,
        monthlyResetDate: new Date().toISOString(),
        extraUploads: 0,
      });

      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleRegister();
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #38bdf8, #6366f1)",
      }}
    >
      <Paper sx={{ p: 4, width: 400, borderRadius: "15px" }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Register
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
          autoComplete="name"
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
          autoComplete="email"
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
          autoComplete="new-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={toggleShowPassword} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {form.password && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={(passwordStrength / 4) * 100}
              color={strengthColor}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color={`${strengthColor}.main`}>
              Password strength: {strengthText}
            </Typography>
          </Box>
        )}

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
          autoComplete="new-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={toggleShowConfirmPassword} edge="end">
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
            mt: 2,
            py: 1.5,
            background: "linear-gradient(90deg, #38bdf8, #6366f1)",
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
              color: "#6366f1",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;
