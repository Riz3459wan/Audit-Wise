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
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

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
      name: form.name,
      email: form.email,
      password: form.password,
      plan: "free",
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    setIsLoading(false);
    navigate("/");
  };

  const handleKeyPress = (e) => {
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
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />

        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          margin="normal"
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          name="password"
          margin="normal"
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          helperText="Minimum 6 characters"
        />

        <Button
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{
            mt: 2,
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
          <Link to="/" style={{ color: "#6366f1", fontWeight: "bold" }}>
            Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;
