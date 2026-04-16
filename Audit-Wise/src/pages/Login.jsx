import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const validateForm = () => {
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
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await login(form.email, form.password);

      if (result.success) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  if (authLoading) {
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
        <CircularProgress sx={{ color: "white" }} />
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
          padding: 4,
          width: 350,
          borderRadius: "15px",
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
          error={!!error && !form.password}
        />

        <Button
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{
            mt: 2,
            py: 1.5,
            background: "linear-gradient(90deg, #6366f1, #38bdf8)",
          }}
          onClick={handleLogin}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "Login"
          )}
        </Button>

        <Typography mt={2} align="center">
          Don't have an account?{" "}
          <NavLink
            to="/register"
            style={{
              color: "#38bdf8",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Register
          </NavLink>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
