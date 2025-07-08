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
  const [followStatus, setFollowStatus] = useState<
    "following" | "not-following"
  >("not-following");
  const [updatingFollow, setUpdatingFollow] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [loadingFollows, setLoadingFollows] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const isOwnProfile = !userId || userId === user?.id;

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
    const checkFollowStatus = async () => {
      if (!user || !userId || user.id === userId) return;

      try {
        // Check if current user is following the target user
        const { data: followData, error } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("followed_id", userId)
          .maybeSingle();

        if (error) throw error;

        setFollowStatus(followData ? "following" : "not-following");
      } catch (err) {
        console.error("Error checking follow status:", err);
      }
    };

    checkFollowStatus();
  }, [user, userId]);

  const handleFollowToggle = async () => {
    if (!user || !userId || user.id === userId) return;
    setUpdatingFollow(true);

    try {
      if (followStatus === "not-following") {
        // Follow user
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          followed_id: userId,
        });

        if (error) throw error;
        setFollowStatus("following");
        setFollowersCount((prev) => prev + 1);
        setSnackbar({
          open: true,
          message: "Successfully followed user!",
          severity: "success",
        });
      } else {
        // Unfollow user
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("followed_id", userId);

        if (error) throw error;
        setFollowStatus("not-following");
        setFollowersCount((prev) => prev - 1);
        setSnackbar({
          open: true,
          message: "Unfollowed user",
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
      setUpdatingFollow(false);
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
    setImageError(null);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
  };

  const handleEditSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || "";
      let bannerUrl = profile?.banner_url || "";

      // Upload avatar if changed
      if (editAvatar) {
        const avatarFileName = `avatars/${user.id}/${Date.now()}_avatar.jpg`;
        const { error: avatarError } = await supabase.storage
          .from("profile-images")
          .upload(avatarFileName, editAvatar);
        if (avatarError) throw avatarError;
        avatarUrl = `${
          supabase.storage.from("profile-images").getPublicUrl(avatarFileName)
            .data.publicUrl
        }`;
      }

      // Upload banner if changed
      if (editBanner) {
        const bannerFileName = `banners/${user.id}/${Date.now()}_banner.jpg`;
        const { error: bannerError } = await supabase.storage
          .from("profile-images")
          .upload(bannerFileName, editBanner);
        if (bannerError) throw bannerError;
        bannerUrl = `${
          supabase.storage.from("profile-images").getPublicUrl(bannerFileName)
            .data.publicUrl
        }`;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editName,
          username: editUsername,
          bio: editBio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        name: editName,
        username: editUsername,
        bio: editBio,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      });

      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });
      setEditOpen(false);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to update profile",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageError(null);
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });
      setEditBanner(compressed);
      setPreviewBanner(URL.createObjectURL(compressed));
    } catch (err) {
      setImageError("Failed to compress banner image");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageError(null);
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
      });
      setEditAvatar(compressed);
      setPreviewAvatar(URL.createObjectURL(compressed));
    } catch (err) {
      setImageError("Failed to compress profile photo");
    }
  };

  useEffect(() => {
    const fetchFollows = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        setLoadingFollows(false);
        return;
      }

      setLoadingFollows(true);
      try {
        // Get following count
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetUserId);
        setFollowingCount(followingCount || 0);

        // Get followers count
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("followed_id", targetUserId);
        setFollowersCount(followersCount || 0);
      } catch (err: any) {
        console.error("Error fetching follows:", err);
        setError(err.message);
      } finally {
        setLoadingFollows(false);
      }
    };

    fetchFollows();
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
            } catch (err: any) {
              setError(err.message);
            }
          }}
        >
          Create Profile
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Profile Header */}
      <Card
        sx={{
          position: "relative",
          mb: 3,
          background: "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src={
            profile?.banner_url ||
            "https://source.unsplash.com/random/1200x400/?car"
          }
          alt="Banner"
          sx={{
            width: "100%",
            height: 200,
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* Profile Info Row */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            px: 4,
            pb: 4,
            pt: 0,
            mt: 0,
          }}
        >
          {/* Avatar on the left */}
          <Box
            sx={{
              mt: -10,
              mr: 4,
              zIndex: 2,
              width: 120,
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Avatar
              src={profile?.avatar_url}
              sx={{
                width: 120,
                height: 120,
                border: "4px solid white",
                boxShadow: 3,
                background: "#222",
                fontSize: 48,
              }}
            >
              {profile?.name ? profile.name[0] : ""}
            </Avatar>
          </Box>
          {/* Profile Info on the right */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {profile?.name}
            </Typography>
            <Typography variant="subtitle1" color="#d4af37" gutterBottom>
              @{profile?.username}
            </Typography>
            {profile?.bio && (
              <Typography variant="body1" paragraph>
                {profile?.bio}
              </Typography>
            )}
            {isOwnProfile && (
              <>
                <Typography variant="body2" color="#d4af37" gutterBottom>
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
            {!isOwnProfile && (
              <Button
                variant={
                  followStatus === "following" ? "contained" : "outlined"
                }
                color={followStatus === "following" ? "success" : "primary"}
                startIcon={
                  followStatus === "following" ? <Check /> : <PersonAdd />
                }
                onClick={handleFollowToggle}
                disabled={updatingFollow}
                sx={{ mt: 2 }}
              >
                {followStatus === "following" ? "Following" : "Follow"}
              </Button>
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
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "rgba(25, 118, 210, 0.1)",
                        borderRadius: 1,
                      },
                    }}
                    onClick={() =>
                      navigate(
                        `/friends?tab=following&userId=${userId || user?.id}`
                      )
                    }
                  >
                    <People color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {loadingFollows ? "..." : followingCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Following
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "rgba(25, 118, 210, 0.1)",
                        borderRadius: 1,
                      },
                    }}
                    onClick={() =>
                      navigate(
                        `/friends?tab=followers&userId=${userId || user?.id}`
                      )
                    }
                  >
                    <People color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {loadingFollows ? "..." : followersCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Followers
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
                <Typography variant="h6">Recent Activity</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Activity feed coming soon...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Move Sign Out button to the bottom of the page */}
      {isOwnProfile && (
        <Paper
          sx={{
            p: 3,
            mt: 6,
            display: "flex",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<BugReport />}
            onClick={() =>
              window.open("https://forms.gle/gU5WthFHphXDJNLA8", "_blank")
            }
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
