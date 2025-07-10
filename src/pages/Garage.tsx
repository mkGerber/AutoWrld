import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Badge,
} from "@mui/material";
import { Add, Mail } from "@mui/icons-material";
import { supabase } from "../services/supabase/client";
import { useAuth } from "../context/AuthContext";
import VehicleCard from "../components/garage/VehicleCard";
import { AddVehicleForm } from "../components/garage/AddVehicleForm";
import { LPRInbox } from "../components/garage/LPRInbox";
import imageCompression from "browser-image-compression";

const vehicleTypes = [
  "Project Car",
  "Daily Driver",
  "Show Car",
  "Track Car",
  "Off-Road",
  "Other",
];

export const Garage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<any>(null);
  const [lprInboxOpen, setLprInboxOpen] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        const transformedVehicles = (data || []).map((vehicle) => ({
          ...vehicle,
          images: Array.isArray(vehicle.images)
            ? vehicle.images
            : typeof vehicle.images === "string" && vehicle.images.length > 0
            ? [vehicle.images]
            : [],
          buildProgress: 0,
          owner: {
            name: user.user_metadata?.full_name || "Anonymous",
            avatar:
              user.user_metadata?.avatar_url ||
              "https://i.pravatar.cc/150?img=1",
          },
          modifications: vehicle.modifications || [],
          horsepower: vehicle.horsepower || 0,
        }));
        setVehicles(transformedVehicles);
      }
      setLoading(false);
    };
    fetchVehicles();
  }, [user]);

  useEffect(() => {
    const fetchPendingInvitesCount = async () => {
      if (!user) return;

      try {
        const { count, error } = await supabase
          .from("lpr_invites")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("status", "pending");

        if (!error && count !== null) {
          setPendingInvitesCount(count);
        }
      } catch (err) {
        console.error("Error fetching pending invites count:", err);
      }
    };

    fetchPendingInvitesCount();
  }, [user]);

  const handleAddOpen = () => setAddOpen(true);
  const handleAddClose = () => setAddOpen(false);

  const handleAddVehicle = async (formData: any) => {
    if (!user) return;
    setSaving(true);
    const imageUrls: string[] = [];

    // 1. Insert vehicle record
    const { data: insertData, error: insertError } = await supabase
      .from("vehicles")
      .insert({
        name: formData.name,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        user_id: user.id,
        images: [],
      })
      .select()
      .single();
    if (insertError) {
      setSnackbar({
        open: true,
        message: insertError.message,
        severity: "error",
      });
      setSaving(false);
      return;
    }
    const vehicleId = insertData.id;
    // 2. Upload images using vehicleId in the path
    if (formData.files && formData.files.length > 0) {
      for (const file of formData.files) {
        // Compress the image before upload
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        try {
          const compressedFile = await imageCompression(file, options);
          const fileExt = compressedFile.name.split(".").pop();
          const fileName = `${vehicleId}/${Date.now()}_${compressedFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from("vehicle-images")
            .upload(fileName, compressedFile);
          if (uploadError) {
            setSnackbar({
              open: true,
              message: uploadError.message,
              severity: "error",
            });
            setSaving(false);
            return;
          }
          const publicUrl = supabase.storage
            .from("vehicle-images")
            .getPublicUrl(fileName).data.publicUrl;
          imageUrls.push(publicUrl);
        } catch (error) {
          console.error("Error compressing/uploading image:", error);
          setSnackbar({
            open: true,
            message: `Failed to process image ${file.name}`,
            severity: "error",
          });
          setSaving(false);
          return;
        }
      }
      // 3. Update vehicle with image URLs
      const { error: updateError } = await supabase
        .from("vehicles")
        .update({ images: imageUrls })
        .eq("id", vehicleId);
      if (updateError) {
        setSnackbar({
          open: true,
          message: updateError.message,
          severity: "error",
        });
        setSaving(false);
        return;
      }
    }
    setSnackbar({ open: true, message: "Vehicle added!", severity: "success" });
    setAddOpen(false);
    // Refresh vehicles
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setVehicles(data || []);
    setSaving(false);
    window.location.replace("/garage");
  };

  const handleDeleteVehicle = (vehicle: any) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleToDelete.id);
    if (!error) {
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));
      setSnackbar({
        open: true,
        message: "Vehicle deleted!",
        severity: "success",
      });
    } else {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
    setDeleteDialogOpen(false);
    setVehicleToDelete(null);
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

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ flexGrow: 1, color: "#d4af37", fontWeight: 700 }}
        >
          My Garage
        </Typography>
        <Badge badgeContent={pendingInvitesCount} color="error" sx={{ mr: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Mail />}
            onClick={() => setLprInboxOpen(true)}
            sx={{ borderColor: "#d4af37", color: "#d4af37" }}
          >
            LPR Inbox
          </Button>
        </Badge>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Add />}
          onClick={handleAddOpen}
        >
          Add Vehicle
        </Button>
      </Box>
      {vehicles.length === 0 ? (
        <Alert severity="info">
          No vehicles in your garage yet. Click "Add Vehicle" to get started!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
              <VehicleCard
                vehicle={vehicle}
                onDelete={() => handleDeleteVehicle(vehicle)}
              />
            </Grid>
          ))}
        </Grid>
      )}
      <AddVehicleForm
        open={addOpen}
        onClose={handleAddClose}
        onSubmit={handleAddVehicle}
      />
      <LPRInbox open={lprInboxOpen} onClose={() => setLprInboxOpen(false)} />
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
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Vehicle</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <b>{vehicleToDelete?.name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteVehicle}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
