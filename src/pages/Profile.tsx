import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  ListItemAvatar,
  IconButton,
  Chip,
} from "@mui/material";
import {
  LocationOn,
  Email,
  Phone,
  Edit,
  DirectionsCar,
  Event,
  Build,
  PhotoCamera,
  Logout,
  PersonAdd,
  PersonRemove,
  Check,
  People,
  CalendarMonth,
  BugReport,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import VehicleCard from "../components/garage/VehicleCard";

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string>(
    profile?.avatar_url || ""
  );
  const [editBanner, setEditBanner] = useState<File | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string>(
    profile?.banner_url || ""
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [friendshipStatus, setFriendshipStatus] = useState<
    "none" | "pending" | "friends"
  >("none");
  const [updatingFriendship, setUpdatingFriendship] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        setError("No user ID provided");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("name, username, bio, email, avatar_url, banner_url")
        .eq("id", targetUserId)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, userId]);

  useEffect(() => {
    const checkFriendshipStatus = async () => {
      if (!user || !userId || user.id === userId) return;

      try {
        // Check if there's an existing friendship
        const { data: existingFriendship, error } = await supabase
          .from("friendships")
          .select("status")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
          )
          .maybeSingle();

        if (error) throw error;

        if (existingFriendship) {
          setFriendshipStatus(
            existingFriendship.status === "accepted" ? "friends" : "pending"
          );
        } else {
          setFriendshipStatus("none");
        }
      } catch (err) {
        console.error("Error checking friendship status:", err);
      }
    };

    checkFriendshipStatus();
  }, [user, userId]);

  const handleFriendRequest = async () => {
    if (!user || !userId || user.id === userId) return;
    setUpdatingFriendship(true);

    try {
      if (friendshipStatus === "none") {
        // Send friend request
        const { error } = await supabase.from("friendships").insert({
          sender_id: user.id,
          receiver_id: userId,
          status: "pending",
        });

        if (error) throw error;
        setFriendshipStatus("pending");
        setSnackbar({
          open: true,
          message: "Friend request sent!",
          severity: "success",
        });
      } else if (friendshipStatus === "pending") {
        // Cancel friend request
        const { error } = await supabase
          .from("friendships")
          .delete()
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
          );

        if (error) throw error;
        setFriendshipStatus("none");
        setSnackbar({
          open: true,
          message: "Friend request cancelled",
          severity: "success",
        });
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || "An error occurred",
        severity: "error",
      });
    } finally {
      setUpdatingFriendship(false);
    }
  };

  const handleEditOpen = () => {
    setEditName(profile?.name || "");
    setEditUsername(profile?.username || "");
    setEditBio(profile?.bio || "");
    setPreviewAvatar(profile?.avatar_url || "");
    setPreviewBanner(profile?.banner_url || "");
    setEditAvatar(null);
    setEditBanner(null);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
  };

  const handleEditSave = async () => {
    setSaving(true);
    let avatarUrl = profile?.avatar_url;
    let bannerUrl = profile?.banner_url;

    // Delete old avatar if uploading a new one
    if (editAvatar && profile?.avatar_url) {
      try {
        const marker = "/avatars/";
        const idx = profile.avatar_url.indexOf(marker);
        if (idx !== -1) {
          const filePath = profile.avatar_url.substring(idx + marker.length);
          await supabase.storage.from("avatars").remove([filePath]);
        }
      } catch (err) {
        // Ignore error, continue
      }
    }

    // If there's a new avatar file, upload it
    if (editAvatar) {
      const fileExt = editAvatar.name.split(".").pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, editAvatar);
      if (uploadError) {
        setSnackbar({
          open: true,
          message: uploadError.message,
          severity: "error",
        });
        setSaving(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      avatarUrl = publicUrl;
    }

    // Delete old banner if uploading a new one
    if (editBanner && profile?.banner_url) {
      try {
        const marker = "/banners/";
        const idx = profile.banner_url.indexOf(marker);
        if (idx !== -1) {
          const filePath = profile.banner_url.substring(idx + marker.length);
          await supabase.storage.from("banners").remove([filePath]);
        }
      } catch (err) {
        // Ignore error, continue
      }
    }

    // If there's a new banner file, upload it
    if (editBanner) {
      const fileExt = editBanner.name.split(".").pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, editBanner);
      if (uploadError) {
        setSnackbar({
          open: true,
          message: uploadError.message,
          severity: "error",
        });
        setSaving(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("banners").getPublicUrl(fileName);
      bannerUrl = publicUrl;
    }

    // Update the profile with the new avatar and banner URLs
    const { error } = await supabase
      .from("profiles")
      .update({
        name: editName,
        username: editUsername,
        bio: editBio,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      })
      .eq("id", user?.id);

    setSaving(false);
    if (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } else {
      setSnackbar({
        open: true,
        message: "Profile updated!",
        severity: "success",
      });
      // Re-fetch the profile to ensure the latest data is loaded
      const { data: refreshedProfile } = await supabase
        .from("profiles")
        .select("name, username, bio, email, avatar_url, banner_url")
        .eq("id", user?.id)
        .maybeSingle();
      if (refreshedProfile) {
        setProfile(refreshedProfile);
      }
      setEditOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Helper function to check if viewing own profile
  const isOwnProfile = !userId || userId === user?.id;

  // Banner upload handler
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageError(null);
      if (file.size > 30 * 1024 * 1024) {
        setImageError("Banner image is too large (max 30MB)");
        return;
      }
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
        });
        setEditBanner(compressed);
        setPreviewBanner(URL.createObjectURL(compressed));
      } catch (err) {
        setImageError("Failed to compress banner image");
      }
    }
  };

  // Avatar upload handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageError(null);
      if (file.size > 20 * 1024 * 1024) {
        setImageError("Profile photo is too large (max 20MB)");
        return;
      }
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        setEditAvatar(compressed);
        setPreviewAvatar(URL.createObjectURL(compressed));
      } catch (err) {
        setImageError("Failed to compress profile photo");
      }
    }
  };

  useEffect(() => {
    const fetchFriends = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        setLoadingFriends(false);
        return;
      }

      setLoadingFriends(true);
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
              avatar_url,
              username
            )
          `
          )
          .eq("receiver_id", targetUserId)
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
              avatar_url,
              username
            )
          `
          )
          .eq("sender_id", targetUserId)
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
        console.error("Error fetching friends:", err);
        setError(err.message);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [userId, user?.id]);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        setLoadingVehicles(false);
        return;
      }
      setLoadingVehicles(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });
      if (!error) {
        const transformedVehicles = (data || []).map((vehicle) => ({
          ...vehicle,
          images: Array.isArray(vehicle.images)
            ? vehicle.images
            : typeof vehicle.images === "string" && vehicle.images.length > 0
            ? [vehicle.images]
            : [],
          modifications: vehicle.modifications || [],
          horsepower: vehicle.horsepower || 0,
        }));
        setVehicles(transformedVehicles);
      }
      setLoadingVehicles(false);
    };
    fetchVehicles();
  }, [userId, user?.id]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        setLoadingEvents(false);
        return;
      }
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, image_url")
        .eq("created_by", targetUserId);
      if (!error) setEvents(data || []);
      setLoadingEvents(false);
    };
    fetchEvents();
  }, [userId, user?.id]);

  // Update stats with real data
  const stats = {
    vehicles: vehicles.length,
    events: events.length,
    modifications: 0, // Placeholder, update if you have this data
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        <Alert severity="info">No profile found.</Alert>
        <Button
          variant="contained"
          color="secondary"
          onClick={async () => {
            if (!user) return;
            try {
              const { error } = await supabase.from("profiles").insert({
                id: user.id,
                name: user.email?.split("@")[0] || "New User",
                email: user.email,
                username: user.email?.split("@")[0] || "newuser",
                bio: "",
                avatar_url: "",
                banner_url: "",
              });
              if (error) throw error;
              // Refresh the page to show the new profile
              window.location.reload();
            } catch (error: any) {
              setError(error.message);
            }
          }}
        >
          Create Basic Profile
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <Box
          sx={{
            position: "relative",
            height: 200,
            bgcolor: "primary.main",
            backgroundImage: profile?.banner_url
              ? `url(${profile.banner_url})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Box sx={{ position: "relative", px: 3, pb: 3 }}>
          <Avatar
            src={profile?.avatar_url || ""}
            sx={{
              width: 120,
              height: 120,
              border: "4px solid white",
              position: "absolute",
              top: -60,
              left: 24,
            }}
          >
            {profile?.name ? profile.name[0] : ""}
          </Avatar>
          <Box sx={{ ml: 15, pt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {profile?.name}
              </Typography>
              {!isOwnProfile && (
                <Button
                  variant={
                    friendshipStatus === "friends" ? "contained" : "outlined"
                  }
                  color={friendshipStatus === "friends" ? "success" : "primary"}
                  startIcon={
                    friendshipStatus === "friends" ? (
                      <Check />
                    ) : friendshipStatus === "pending" ? (
                      <PersonRemove />
                    ) : (
                      <PersonAdd />
                    )
                  }
                  onClick={handleFriendRequest}
                  disabled={updatingFriendship}
                  sx={{ ml: 2 }}
                >
                  {friendshipStatus === "friends"
                    ? "Friends"
                    : friendshipStatus === "pending"
                    ? "Cancel Request"
                    : "Add Friend"}
                </Button>
              )}
            </Box>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              @{profile?.username}
            </Typography>
            <Typography variant="body1" paragraph>
              {profile?.bio}
            </Typography>
            {isOwnProfile && (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {profile?.email}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  sx={{ mt: 2 }}
                  onClick={handleEditOpen}
                >
                  Edit Profile
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Card>

      {/* Only show edit dialog and sign out button for own profile */}
      {isOwnProfile && (
        <>
          <Dialog
            open={editOpen}
            onClose={handleEditClose}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogContent>
              <TextField
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                sx={{ mb: 2 }}
              />
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Box sx={{ mb: 1 }}>
                  <img
                    src={previewBanner}
                    alt="Banner Preview"
                    style={{
                      width: "100%",
                      maxHeight: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                </Box>
                <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                  Upload Banner
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleBannerChange}
                  />
                </Button>
              </Box>
              {imageError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {imageError}
                </Typography>
              )}
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Avatar
                  src={previewAvatar}
                  sx={{ width: 80, height: 80, mx: "auto", mb: 1 }}
                />
                <Button variant="outlined" component="label">
                  Upload Picture
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
              </Box>
              {imageError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {imageError}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                variant="contained"
                color="secondary"
                disabled={saving}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <DirectionsCar color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {stats.vehicles}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vehicles
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Event color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {stats.events}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Events
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Build color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {stats.modifications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Modifications
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Vehicles Section */}
          <Card sx={{ mt: 3, background: "none", boxShadow: "none" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vehicles
              </Typography>
              {loadingVehicles ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : vehicles.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No vehicles found
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {vehicles.map((vehicle) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={vehicle.id}
                      display="flex"
                      justifyContent="center"
                    >
                      <VehicleCard vehicle={vehicle} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Events Section */}
          <Card sx={{ mt: 3, background: "none", boxShadow: "none" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Events
              </Typography>
              {loadingEvents ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : events.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No events found
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {events.map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.id}>
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          cursor: "pointer",
                          borderRadius: 3,
                          boxShadow: 3,
                          transition: "transform 0.15s",
                          background: "rgba(30, 30, 40, 0.98)",
                          "&:hover": { transform: "scale(1.04)", boxShadow: 6 },
                        }}
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        <Box
                          component="img"
                          src={
                            event.image_url ||
                            "https://source.unsplash.com/random/800x600/?car-meet"
                          }
                          alt={event.title}
                          sx={{
                            height: 200,
                            width: "100%",
                            objectFit: "cover",
                            borderTopLeftRadius: 12,
                            borderTopRightRadius: 12,
                          }}
                        />
                        <CardContent sx={{ flexGrow: 1, p: 2 }}>
                          <Box sx={{ mb: 1 }}>
                            <Chip
                              label={event.type || "Event"}
                              size="small"
                              color="primary"
                            />
                          </Box>
                          <Typography
                            gutterBottom
                            variant="h6"
                            component="h2"
                            sx={{ color: "#d4af37", fontWeight: 700 }}
                          >
                            {event.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            paragraph
                            sx={{ mb: 1 }}
                          >
                            {event.description || "No description provided."}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <CalendarMonth
                              sx={{ mr: 1, color: "text.secondary" }}
                            />
                            <Typography variant="body2">
                              {event.date
                                ? new Date(event.date).toLocaleDateString()
                                : "No date"}
                            </Typography>
                          </Box>
                          {event.location && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <LocationOn
                                sx={{ mr: 1, color: "text.secondary" }}
                              />
                              <Typography variant="body2">
                                {event.location}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <People sx={{ mr: 1, color: "text.secondary" }} />
                            <Typography variant="body2">
                              {event.attendees?.[0]?.count || 0} attendees
                              {event.max_attendees &&
                                ` / ${event.max_attendees} max`}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <People sx={{ color: "#d4af37", mr: 1 }} />
                <Typography variant="h6">Friends</Typography>
              </Box>

              {loadingFriends ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : friends.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No friends yet
                </Typography>
              ) : (
                <List>
                  {friends.map((friend) => (
                    <ListItem
                      key={friend.id}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "rgba(212, 175, 55, 0.1)",
                          borderRadius: 1,
                        },
                      }}
                      onClick={() => navigate(`/profile/${friend.profile.id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={friend.profile.avatar_url}
                          alt={friend.profile.name}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={friend.profile.name}
                        secondary={`@${friend.profile.username}`}
                        primaryTypographyProps={{
                          sx: { color: "#fff" },
                        }}
                        secondaryTypographyProps={{
                          sx: { color: "rgba(255, 255, 255, 0.7)" },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Move Sign Out button to the bottom of the page */}
      {isOwnProfile && (
        <Paper sx={{ p: 3, mt: 6, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<BugReport />}
            onClick={() => window.open('https://forms.gle/gU5WthFHphXDJNLA8', '_blank')}
            sx={{ minWidth: 200 }}
          >
            Report a Bug
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Logout />}
            onClick={handleSignOut}
            sx={{ minWidth: 200 }}
          >
            Sign Out
          </Button>
        </Paper>
      )}
    </Box>
  );
};
