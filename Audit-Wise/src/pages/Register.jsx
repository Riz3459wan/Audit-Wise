import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../database/db";

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
        .equals(form.email)
        .first();

      if (existingUser) {
        setError("User already exists with this email");
        setIsLoading(false);
        return;
      }

      await db.users.add({
        name: form.name.trim(),
        email: form.email.toLowerCase(),
        password: form.password,
        plan: "free",
        createdAt: new Date().toISOString(),
        isActive: true,
        monthlyUploadCount: 0,
        monthlyResetDate: new Date().toISOString(),
      });

      navigate("/");
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
      <Paper sx={{ p: 4, width: 350, borderRadius: "15px" }}>
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
          label="Name"
          name="name"
          margin="normal"
          value={form.name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
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
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          name="password"
          margin="normal"
          value={form.password}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          helperText="Minimum 6 characters"
        />

        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          margin="normal"
          value={form.confirmPassword}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
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
