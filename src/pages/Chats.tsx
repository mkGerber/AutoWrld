import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { Add, Group } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase/client";
import Grid from "@mui/material/Grid";

interface GroupChat {
  id: string;
  name: string;
  description: string;
  image_url?: string | null;
  created_by: {
    id: string;
    name: string;
    avatar_url: string;
  };
  member_count: number;
}

export const Groups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("group_chats")
        .select(
          `
          id,
          name,
          description,
          image_url,
          created_by:created_by (
            id,
            name,
            avatar_url
          ),
          member_count:group_chat_members(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to include the member count and fix created_by
      const transformedData = data.map((group) => ({
        ...group,
        member_count: group.member_count[0].count,
        created_by: Array.isArray(group.created_by)
          ? group.created_by[0]
          : group.created_by,
      }));

      setGroups(transformedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      // Create the group chat
      const { data: groupData, error: groupError } = await supabase
        .from("group_chats")
        .insert({
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from("group_chat_members")
        .insert({
          group_chat_id: groupData.id,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      fetchGroups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleProfileClick = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the group card click
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Groups
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Group
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item key={group.id} xs={12} sm={6} md={4}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: 6,
                    backgroundColor: "rgba(212, 175, 55, 0.07)",
                  },
                  minHeight: 260,
                }}
                onClick={() => navigate(`/chat/${group.id}`)}
              >
                <Avatar
                  src={group.image_url || undefined}
                  sx={{
                    width: 72,
                    height: 72,
                    mb: 2,
                    bgcolor: "primary.main",
                    fontSize: 32,
                  }}
                >
                  {!group.image_url && <Group fontSize="large" />}
                </Avatar>
                <Typography
                  variant="h6"
                  align="center"
                  sx={{ mb: 1, wordBreak: "break-word" }}
                >
                  {group.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mb: 1, wordBreak: "break-word" }}
                >
                  {group.description}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="center"
                  >
                    {group.member_count} members • Created by
                  </Typography>
                  <Avatar
                    src={group.created_by.avatar_url || undefined}
                    sx={{
                      width: 24,
                      height: 24,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        opacity: 0.7,
                        transform: "scale(1.1)",
                      },
                    }}
                    onClick={(e) => handleProfileClick(group.created_by.id, e)}
                  >
                    {!group.created_by.avatar_url &&
                      group.created_by.name?.charAt(0)}
                  </Avatar>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    onClick={(e) => handleProfileClick(group.created_by.id, e)}
                    sx={{
                      cursor: "pointer",
                      transition: "color 0.2s",
                      "&:hover": {
                        color: "#d4af37",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {group.created_by.name}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Create New Group Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!newGroupName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
