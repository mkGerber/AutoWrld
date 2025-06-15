import { useState, useEffect, useRef } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Add, Group, Settings, PhotoCamera } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
}

console.log("GroupChatList component rendered");

export const GroupChatList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupChat | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const fetchGroups = async () => {
    console.log("fetchGroups called");
    if (!user) {
      console.log("No user, fetchGroups early return");
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const { data: groups, error } = await supabase
        .from("group_chats")
        .select(
          `
          id,
          name,
          description,
          image_url,
          created_by,
          created_at,
          updated_at,
          group_chat_members!inner (
            user_id
          )
        `
        )
        .eq("group_chat_members.user_id", user.id)
        .order("updated_at", { ascending: false });

      console.log("Fetched groups:", groups); // Debug log

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (groups || []).map(async (group) => {
          const { count } = await supabase
            .from("group_chat_members")
            .select("*", { count: "exact", head: true })
            .eq("group_chat_id", group.id);

          return {
            ...group,
            member_count: count || 0,
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError("Failed to load group chats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      // Create the group chat
      const { data: group, error: groupError } = await supabase
        .from("group_chats")
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from("group_chat_members")
        .insert({
          group_chat_id: group.id,
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

  const handleOpenSettings = (group: GroupChat) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description || "");
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!editingGroup) return;
    setSaving(true);
    let imageUrl = editingGroup.image_url;
    try {
      if (editImage) {
        const fileExt = editImage.name.split(".").pop();
        const fileName = `${editingGroup.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("group-images")
          .upload(fileName, editImage);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("group-images").getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
      const { error } = await supabase
        .from("group_chats")
        .update({
          name: editName,
          description: editDescription,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingGroup.id)
        .eq("created_by", user.id);
      if (error) throw error;
      setSettingsOpen(false);
      setEditingGroup(null);
      setEditImage(null);
      fetchGroups();
    } catch (err) {
      alert("Failed to update group.");
    } finally {
      setSaving(false);
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

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Paper elevation={2}>
        <Box p={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Group Chats</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Group
            </Button>
          </Box>
          <List sx={{ flex: 1, overflow: "auto" }}>
            {groups.map((group) => (
              <ListItem
                key={group.id}
                component={Link}
                to={`/chat/${group.id}`}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={group.image_url || undefined}
                    sx={{ width: 48, height: 48 }}
                  >
                    {group.name[0]}
                  </Avatar>
                </ListItemAvatar>
                {user?.id === group.created_by && (
                  <IconButton
                    edge="end"
                    aria-label="settings"
                    onClick={() => handleOpenSettings(group)}
                    sx={{ ml: 1 }}
                  >
                    <Settings />
                  </IconButton>
                )}
                {group.image_url && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ wordBreak: "break-all" }}
                  >
                    {group.image_url}
                  </Typography>
                )}
                <ListItemText
                  primary={group.name}
                  secondary={
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {group.member_count} members
                      </Typography>
                      {group.description && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            •
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {group.description}
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
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

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <Box mt={2} display="flex" alignItems="center">
            {editingGroup?.image_url && (
              <Avatar
                src={editingGroup.image_url}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={(e) => setEditImage(e.target.files?.[0] || null)}
            />
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              <PhotoCamera />
            </IconButton>
            {editImage && <Typography ml={1}>{editImage.name}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            disabled={saving}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
