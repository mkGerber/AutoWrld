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
  CardMedia,
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
  // Add state for group vehicles
  const [groupVehicles, setGroupVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
    }
  }, [id]);

  // Fetch group vehicles
  useEffect(() => {
    const fetchGroupVehicles = async () => {
      if (!id) return;
      setLoadingVehicles(true);
      // Step 1: Fetch group_vehicles rows
      const { data: gvRows, error: gvError } = await supabase
        .from("group_vehicles")
        .select("*")
        .eq("group_chat_id", id);
      if (gvError || !gvRows) {
        console.log("GroupGarage fetch error:", gvError);
        setGroupVehicles([]);
        setLoadingVehicles(false);
        return;
      }
      // Step 2: Collect all vehicle_ids and user_ids
      const vehicleIds = [...new Set(gvRows.map((gv) => gv.vehicle_id))];
      const userIds = [...new Set(gvRows.map((gv) => gv.user_id))];
      // Step 3: Fetch all vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, make, model, year, images")
        .in("id", vehicleIds);
      // Step 4: Fetch all users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url")
        .in("id", userIds);
      // Step 5: Map vehicles and users by id
      const vehicleMap = new Map((vehicles || []).map((v) => [v.id, v]));
      const userMap = new Map((users || []).map((u) => [u.id, u]));
      // Step 6: Combine for display
      const groupVehiclesData = gvRows.map((gv) => ({
        ...gv,
        vehicle: vehicleMap.get(gv.vehicle_id),
        user: userMap.get(gv.user_id),
      }));
      setGroupVehicles(groupVehiclesData);
      setLoadingVehicles(false);
    };
    fetchGroupVehicles();
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
    <Box
      sx={{
        p: { xs: 1, sm: 3 },
        maxWidth: 1200,
        mx: "auto",
        minHeight: "100vh",
      }}
    >
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

      <Grid container spacing={4} alignItems="flex-start">
        {/* Sidebar: Group Info + Garage */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: { md: "sticky" }, top: { md: 32 }, zIndex: 1 }}>
            {/* Group Info Card */}
            <Card sx={{ mb: 3 }}>
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

            {/* Group Garage */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Group Garage
                </Typography>
                {loadingVehicles ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", my: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : groupVehicles.length === 0 ? (
                  <Typography color="text.secondary">
                    No vehicles in the group garage yet.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {groupVehicles.map((gv) => {
                      // Parse image
                      let image = "";
                      try {
                        if (gv.vehicle?.images) {
                          const arr =
                            typeof gv.vehicle.images === "string"
                              ? JSON.parse(gv.vehicle.images)
                              : gv.vehicle.images;
                          image =
                            Array.isArray(arr) && arr.length > 0 ? arr[0] : "";
                          if (
                            typeof image === "string" &&
                            image.startsWith("[")
                          )
                            image = JSON.parse(image)[0];
                        }
                      } catch {}
                      return (
                        <Grid item xs={12} sm={6} key={gv.id}>
                          <Card
                            sx={{
                              height: 260,
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: 3,
                              background: "rgba(30,30,40,0.98)",
                            }}
                          >
                            {image && (
                              <CardMedia
                                component="img"
                                image={image}
                                alt="Vehicle"
                                sx={{
                                  height: 100,
                                  objectFit: "cover",
                                  borderTopLeftRadius: 12,
                                  borderTopRightRadius: 12,
                                }}
                              />
                            )}
                            <CardContent
                              sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-end",
                                alignItems: "flex-start",
                                p: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{ color: "#fff", fontWeight: 700 }}
                              >
                                {gv.vehicle?.year} {gv.vehicle?.make}{" "}
                                {gv.vehicle?.model}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mt: 1,
                                }}
                              >
                                <Avatar
                                  src={gv.user?.avatar_url || undefined}
                                  sx={{ width: 24, height: 24, mr: 1 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#fff" }}
                                >
                                  {gv.user?.name || `@${gv.user?.username}`}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Main Content: Members List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ maxHeight: 420, overflowY: "auto", pr: 2 }}>
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

      {/* Remove Member Dialog (unchanged) */}
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
