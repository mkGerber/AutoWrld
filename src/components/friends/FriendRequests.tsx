import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Check, Close, PersonAdd } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";

interface FriendRequest {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string;
  };
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export const FriendRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(
          `
          id,
          status,
          created_at,
          sender:sender_id (
            id,
            name,
            avatar_url
          )
        `
        )
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleRequest = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: action === "accept" ? "accepted" : "rejected" })
        .eq("id", requestId)
        .eq("receiver_id", user.id);

      if (error) throw error;

      // Remove the request from the list
      setRequests(requests.filter((req) => req.id !== requestId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body1" color="text.secondary">
          No pending friend requests
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Friend Requests
        </Typography>
        <List>
          {requests.map((request, index) => (
            <Box key={request.id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{ pr: 12 }} // right padding to prevent overlap
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      color="primary"
                      onClick={() => handleRequest(request.id, "accept")}
                      size="small"
                    >
                      <Check />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleRequest(request.id, "reject")}
                      size="small"
                    >
                      <Close />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={request.sender.avatar_url}
                    alt={request.sender.name}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={request.sender.name}
                  secondary={`Sent ${new Date(
                    request.created_at
                  ).toLocaleDateString()}`}
                />
              </ListItem>
            </Box>
          ))}
        </List>
      </Box>
    </Paper>
  );
};
