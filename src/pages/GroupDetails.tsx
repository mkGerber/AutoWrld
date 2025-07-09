import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CalendarMonth,
  Group,
  Settings,
  Event,
  ArrowBack,
  Delete,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase/client";

interface Member {
  id: string;
  user_id: string;
  role: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

export const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
    }
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);

      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from("group_chats")
        .select("id, name, description, image_url, created_by, created_at")
        .eq("id", id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from("group_chat_members")
        .select("id, user_id, role")
        .eq("group_chat_id", id);

      if (membersError) throw membersError;

      if (membersData && membersData.length > 0) {
        // Fetch user info for all members
        const userIds = membersData.map((m) => m.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url")
          .in("id", userIds);

        if (usersError) throw usersError;

        // Map members to user info
        const userMap = new Map((usersData || []).map((u) => [u.id, u]));
        const formattedMembers = membersData.map((member) => ({
          ...member,
          user: userMap.get(member.user_id) || {
            id: member.user_id,
            name: "Unknown",
            username: "unknown",
            avatar_url: null,
          },
        }));

        setMembers(formattedMembers);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isGroupOwner = group?.created_by === user?.id;
  const userRole = members.find((m) => m.user_id === user?.id)?.role;

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await supabase
        .from("group_chat_members")
        .delete()
        .eq("group_chat_id", id)
        .eq("user_id", memberToRemove.user_id);
      setMembers((prev) =>
        prev.filter((m) => m.user_id !== memberToRemove.user_id)
      );
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    } catch (err) {
      alert("Failed to remove member.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !group) {
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity="error">
          <Typography variant="h6">Error Loading Group</Typography>
          <Typography variant="body2">{error || "Group not found"}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Group Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Group Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "fit-content" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  src={group.image_url || undefined}
                  sx={{ width: 80, height: 80, mr: 2 }}
                >
                  <Group sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {group.name}
                  </Typography>
                  {group.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {group.description}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Action Buttons */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Event />}
                  onClick={() => navigate(`/create-event?groupChatId=${id}`)}
                  fullWidth
                >
                  Create Event
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Group />}
                  onClick={() => navigate(`/group/${id}/members`)}
                  fullWidth
                >
                  View All Members
                </Button>

                {isGroupOwner && (
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={() => navigate(`/group/${id}/edit`)}
                    fullWidth
                  >
                    Edit Group
                  </Button>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Group Info */}
              <Typography variant="h6" gutterBottom>
                Group Information
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CalendarMonth sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Group sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                  Your role: {userRole || "Member"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Members List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Members ({members.length})
              </Typography>

              <List>
                {members.map((member) => (
                  <ListItem key={member.id} divider>
                    <ListItemAvatar>
                      <Avatar
                        src={member.user.avatar_url || undefined}
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate(`/profile/${member.user.id}`)}
                      >
                        {member.user.name?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            cursor: "pointer",
                            fontWeight: 500,
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() => navigate(`/profile/${member.user.id}`)}
                        >
                          {member.user.name}
                        </Typography>
                      }
                      secondary={`@${member.user.username}`}
                    />
                    <Chip
                      label={member.role}
                      size="small"
                      color={member.role === "admin" ? "primary" : "default"}
                      variant="outlined"
                      sx={{
                        width: 130,
                        height: 32,
                        fontSize: 16,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 2,
                        textAlign: "center",
                        textTransform: "capitalize",
                      }}
                    />
                    {isGroupOwner && member.user_id !== user?.id && (
                      <IconButton
                        color="error"
                        onClick={() => {
                          setMemberToRemove(member);
                          setRemoveDialogOpen(true);
                        }}
                        sx={{ ml: 1 }}
                        aria-label="Remove member"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Remove Member Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
      >
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          Are you sure you want to remove {memberToRemove?.user.name} from the
          group?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRemoveMember}
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
