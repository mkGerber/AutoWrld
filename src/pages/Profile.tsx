import { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from "@mui/material";
import {
  Edit,
  DirectionsCar,
  Event,
  Build,
  PhotoCamera,
  LocationOn,
  Email,
  Phone,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase/client";

export const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("profiles")
        .select("name, username, bio, email, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        setError(error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleEditOpen = () => {
    setEditName(profile?.name || "");
    setEditUsername(profile?.username || "");
    setEditBio(profile?.bio || "");
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
  };

  const handleEditSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: editName,
        username: editUsername,
        bio: editBio,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } else {
      setSnackbar({
        open: true,
        message: "Profile updated!",
        severity: "success",
      });
      setProfile({
        ...profile,
        name: editName,
        username: editUsername,
        bio: editBio,
      });
      setEditOpen(false);
    }
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
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Alert severity="info">No profile found.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <Box
          sx={{ position: "relative", height: 200, bgcolor: "primary.main" }}
        />
        <Box sx={{ position: "relative", px: 3, pb: 3 }}>
          <Avatar
            src={profile.avatar_url || ""}
            sx={{
              width: 120,
              height: 120,
              border: "4px solid white",
              position: "absolute",
              top: -60,
              left: 24,
            }}
          >
            {profile.name ? profile.name[0] : ""}
          </Avatar>
          <Box sx={{ ml: 15, pt: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {profile.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              @{profile.username}
            </Typography>
            <Typography variant="body1" paragraph>
              {profile.bio}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {profile.email}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              sx={{ mt: 2 }}
              onClick={handleEditOpen}
            >
              Edit Profile
            </Button>
          </Box>
        </Box>
      </Card>

      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="xs" fullWidth>
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
            {saving ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

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
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={profile.location}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Email" secondary={profile.email} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Phone color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Phone" secondary={profile.phone} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

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
