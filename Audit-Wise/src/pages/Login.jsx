import React, { useEffect, useState } from "react";
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
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const pendingData = sessionStorage.getItem("pendingTrialData");
    if (isAuthenticated && !authLoading) {
      if (pendingData) {
        sessionStorage.removeItem("pendingTrialData");
        navigate("/trial-upload", {
          state: { pendingData: JSON.parse(pendingData) },
        });
      } else {
        navigate("/dashboard", { replace: true });
      }
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
        const pendingData = sessionStorage.getItem("pendingTrialData");
        if (pendingData || result.hasPendingTrialData) {
          navigate("/trial-upload");
        } else {
          navigate("/dashboard", { replace: true });
        }
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
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
          width: 350,
          borderRadius: "15px",
          border: "none",
          outline: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "#6366f1" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={toggleShowPassword}
                  edge="end"
                  disabled={isLoading}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
