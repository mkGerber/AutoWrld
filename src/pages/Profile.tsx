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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase/client";
import { useNavigate, useParams } from "react-router-dom";

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

    // If there's a new avatar file, upload it
    if (editAvatar) {
      const fileExt = editAvatar.name.split(".").pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      // Upload the file to Supabase storage
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

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      avatarUrl = publicUrl;
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditBanner(file);
                        setPreviewBanner(URL.createObjectURL(file));
                      }
                    }}
                  />
                </Button>
              </Box>
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditAvatar(file);
                        setPreviewAvatar(URL.createObjectURL(file));
                      }
                    }}
                  />
                </Button>
              </Box>
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

          <Paper
            sx={{ p: 3, mt: 3, display: "flex", justifyContent: "center" }}
          >
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
                      {profile.stats?.vehicles}
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
                      {profile.stats?.events}
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
                      {profile.stats?.modifications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Modifications
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <PhotoCamera color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {profile.stats?.photos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Photos
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
