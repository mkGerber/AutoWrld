import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";

export const SendFriendRequest = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // First, find the user by username
      const { data: receiverData, error: findError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (findError) throw new Error("User not found");
      if (receiverData.id === user.id)
        throw new Error("Cannot send friend request to yourself");

      // Check if a friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from("friendships")
        .select("id, status")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${receiverData.id}),and(sender_id.eq.${receiverData.id},receiver_id.eq.${user.id})`
        )
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingFriendship) {
        if (existingFriendship.status === "pending") {
          throw new Error("Friend request already sent");
        } else if (existingFriendship.status === "accepted") {
          throw new Error("Already friends with this user");
        } else if (existingFriendship.status === "rejected") {
          throw new Error("Friend request was previously rejected");
        }
      }

      // Send the friend request
      const { error: sendError } = await supabase.from("friendships").insert({
        sender_id: user.id,
        receiver_id: receiverData.id,
        status: "pending",
      });

      if (sendError) throw sendError;

      setSuccess(true);
      setUsername("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Send Friend Request
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Friend request sent successfully!
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || !username.trim()}
          >
            {loading ? <CircularProgress size={24} /> : "Send Request"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
