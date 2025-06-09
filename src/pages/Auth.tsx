import { useState } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { supabase } from "../services/supabase/client";
import { Link, useNavigate } from "react-router-dom";

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message || "Login failed.");
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate("/"), 800);
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
          Welcome Back
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#fdfdfd", mb: 3, textAlign: "center" }}
        >
          Sign in to access your digital garage, track your builds, and join the
          community!
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
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
              Login successful! Redirecting...
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
              "Sign In"
            )}
          </Button>
        </Box>
        <Typography sx={{ mt: 2, color: "#fdfdfd", textAlign: "center" }}>
          Don&apos;t have an account?{" "}
          <MuiLink
            component={Link}
            to="/signup"
            sx={{
              color: "#d4af37",
              textDecoration: "underline",
              fontWeight: 700,
            }}
          >
            Sign up
          </MuiLink>
        </Typography>
        <Typography sx={{ mt: 1, color: "#fdfdfd", textAlign: "center" }}>
          <MuiLink
            component={Link}
            to="/reset-password"
            sx={{
              color: "#d4af37",
              textDecoration: "underline",
              fontWeight: 700,
            }}
          >
            Forgot password?
          </MuiLink>
        </Typography>
      </Card>
    </Box>
  );
};

export default AuthPage;
