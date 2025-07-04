import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { PersonRemove } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";
import { Link } from "react-router-dom";

interface Friend {
  id: string;
  profile: {
    id: string;
    name: string;
    avatar_url: string;
  };
  status: "accepted";
  created_at: string;
}

export const FriendsList = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Fetch friends where user is receiver
      const { data: receivedFriends, error: receivedError } = await supabase
        .from("friendships")
        .select(
          `
          id,
          status,
          created_at,
          profile:sender_id (
            id,
            name,
            avatar_url
          )
        `
        )
        .eq("receiver_id", user.id)
        .eq("status", "accepted");

      if (receivedError) throw receivedError;

      // Fetch friends where user is sender
      const { data: sentFriends, error: sentError } = await supabase
        .from("friendships")
        .select(
          `
          id,
          status,
          created_at,
          profile:receiver_id (
            id,
            name,
            avatar_url
          )
        `
        )
        .eq("sender_id", user.id)
        .eq("status", "accepted");

      if (sentError) throw sentError;

      // Combine both results
      const allFriends = [
        ...(receivedFriends || []),
        ...(sentFriends || []),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFriends(allFriends);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      // Remove the friend from the list
      setFriends(friends.filter((friend) => friend.id !== friendshipId));
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

  if (friends.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body1" color="text.secondary">
          No friends yet
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Friends
        </Typography>
        <List>
          {friends.map((friend) => (
            <ListItem
              key={friend.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => handleRemoveFriend(friend.id)}
                >
                  <PersonRemove />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar
                  src={friend.profile.avatar_url}
                  alt={friend.profile.name}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Link
                    to={`/profile/${friend.profile.id}`}
                    style={{
                      color: "#fff",
                      textDecoration: "none",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {friend.profile.name}
                  </Link>
                }
                secondary={`Friends since ${new Date(
                  friend.created_at
                ).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};
