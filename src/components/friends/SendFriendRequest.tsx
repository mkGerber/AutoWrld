import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Autocomplete,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
}

export const SendFriendRequest = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url")
          .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
          .limit(5);

        if (error) throw error;

        // filter out the current user from results
        const filteredResults =
          data?.filter((result) => result.id !== user?.id) || [];

        setSearchResults(filteredResults);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user]);

  const handleSendRequest = async (selectedUser: User) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // check if a friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from("friendships")
        .select("id, status")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
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
        receiver_id: selectedUser.id,
        status: "pending",
      });

      if (sendError) throw sendError;

      setSuccess(true);
      setSearchQuery("");
      setSelectedUser(null);
      setSearchResults([]);
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
        <Autocomplete
          freeSolo
          options={searchResults}
          getOptionLabel={(option) =>
            typeof option === "string"
              ? option
              : `${option.name} (@${option.username})`
          }
          renderOption={(props, option) => (
            <ListItem {...props}>
              <ListItemAvatar>
                <Avatar src={option.avatar_url} alt={option.name} />
              </ListItemAvatar>
              <ListItemText
                primary={option.name}
                secondary={`@${option.username}`}
              />
            </ListItem>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              label="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />
          )}
          loading={loading}
          onChange={(_, value) => {
            if (value && typeof value !== "string") {
              setSelectedUser(value);
              handleSendRequest(value);
            }
          }}
          onInputChange={(_, value) => setSearchQuery(value)}
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
      </Box>
    </Paper>
  );
};
