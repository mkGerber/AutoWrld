import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase/client";
import { useNavigate } from "react-router-dom";

const SetupProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, username, bio")
          .eq("id", user.id)
          .single();
        if (data) {
          setName(data.name || "");
          setUsername(data.username || "");
          setBio(data.bio || "");
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    if (!user) {
      setError("User not found.");
      setLoading(false);
      return;
    }
    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      name,
      username,
      bio,
      email: user.email,
    });
    setLoading(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 1200);
    }
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
          Set Up Your Profile
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#fdfdfd", mb: 3, textAlign: "center" }}
        >
          Welcome! Please enter your details to complete your account setup.
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
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mb: 3 }}
          />
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Profile saved! Redirecting...
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
              "Save Profile"
            )}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default SetupProfile;
