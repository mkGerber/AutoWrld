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
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { supabase } from "../services/supabase/client";
import { Link } from "react-router-dom";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message || "Failed to send reset email.");
      return;
    }
    setSuccess(true);
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
        <DirectionsCarIcon sx={{ fontSize: 56, color: "#d4af37", mb: 2 }} />
        <Typography
          variant="h4"
          sx={{ color: "#d4af37", fontWeight: 700, mb: 1 }}
        >
          Reset Password
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#fdfdfd", mb: 3, textAlign: "center" }}
        >
          Enter your email to receive a password reset link.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              Reset email sent! Check your inbox.
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
              "Send Reset Email"
            )}
          </Button>
        </Box>
        <Typography sx={{ mt: 2, color: "#fdfdfd", textAlign: "center" }}>
          <Link
            to="/login"
            style={{
              color: "#d4af37",
              textDecoration: "underline",
              fontWeight: 700,
            }}
          >
            Back to login
          </Link>
        </Typography>
      </Card>
    </Box>
  );
};

export default ResetPassword;
