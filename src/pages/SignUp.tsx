import { useState } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../services/supabase/client";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setConfirmation(false);
    // 1. Sign up user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      setError(signUpError.message || "Sign up failed.");
      setLoading(false);
      return;
    }
    // 2. If no session, require email confirmation
    if (!data.session) {
      setConfirmation(true);
      setLoading(false);
      return;
    }
    // 3. Insert profile if session exists
    const userId = data.session.user.id;
    console.log("Inserting profile for user id:", userId);
    // Insert profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      name,
      email,
    });
    if (profileError) {
      setError("Profile insert error: " + profileError.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate("/"), 1200);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #0a0f2c 0%, #1a1f3c 100%)",
      }}
    >
      <Card
        sx={{
          p: 5,
          maxWidth: 420,
          width: "100%",
          borderRadius: 4,
          boxShadow: 6,
          background: "rgba(10, 15, 44, 0.98)",
          border: "1px solid #d4af37",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h4"
          sx={{ color: "#d4af37", fontWeight: 700, mb: 2 }}
        >
          Sign Up
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#fdfdfd", mb: 3, textAlign: "center" }}
        >
          Create your account to get started.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Account created! Redirecting...
            </Alert>
          )}
          {confirmation && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Check your email to confirm your account before logging in.
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            fullWidth
            disabled={loading}
            sx={{ fontWeight: 700, fontSize: 16 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign Up"
            )}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default SignUp;
