import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  MenuItem,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import VehicleCard from "../components/garage/VehicleCard";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase/client";

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
  const [addForm, setAddForm] = useState({
    name: "",
    make: "",
    model: "",
    year: "",
    type: "",
    description: "",
    images: "",
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) return;
      setLoading(true);
      setError("");

      // Debug: Check table structure
      const { data: tableInfo, error: tableError } = await supabase
        .from("vehicles")
        .select("*")
        .limit(1);

      console.log("Table structure:", tableInfo);
      console.log("Table error:", tableError);

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("Vehicles data:", data);
      console.log("Vehicles error:", error);

      if (error) {
        setError(error.message);
      } else {
        // Transform the data to match VehicleCard interface
        const transformedVehicles = (data || []).map((vehicle) => ({
          ...vehicle,
          status: vehicle.type.toLowerCase().replace(" ", "") as
            | "project"
            | "daily"
            | "show"
            | "track",
          buildProgress: 0,
          owner: {
            name: user.user_metadata?.full_name || "Anonymous",
            avatar:
              user.user_metadata?.avatar_url ||
              "https://i.pravatar.cc/150?img=1",
          },
          modifications: [],
          horsepower: 0,
        }));
        setVehicles(transformedVehicles);
      }
      setLoading(false);
    };
    fetchVehicles();
  }, [user]);

  const handleAddOpen = () => {
    setAddForm({
      name: "",
      make: "",
      model: "",
      year: "",
      type: "",
      description: "",
      images: "",
    });
    setAddOpen(true);
  };
  const handleAddClose = () => setAddOpen(false);
  const handleAddChange = (e: any) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const handleAddSave = async () => {
    setSaving(true);
    let imageUrl = "";

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("vehicle-images")
        .upload(fileName, selectedFile);
      if (uploadError) {
        setSnackbar({
          open: true,
          message: uploadError.message,
          severity: "error",
        });
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("vehicle-images").getPublicUrl(fileName)
        .data.publicUrl;
    }

    const payload = {
      ...addForm,
      year: addForm.year ? parseInt(addForm.year) : null,
      user_id: user.id,
      images: imageUrl ? [imageUrl] : [],
      created_at: new Date().toISOString(),
    };
    console.log("Insert payload:", payload);
    const { error } = await supabase.from("vehicles").insert(payload);
    setSaving(false);
    if (error) {
      console.error("Insert error:", error);
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } else {
      setSnackbar({
        open: true,
        message: "Vehicle added!",
        severity: "success",
      });
      setAddOpen(false);
      setSelectedFile(null);
      // Refresh vehicles
      const { data } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setVehicles(data || []);
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

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ flexGrow: 1, color: "#d4af37", fontWeight: 700 }}
        >
          My Garage
        </Typography>
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
              <VehicleCard vehicle={vehicle} />
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={addOpen} onClose={handleAddClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add Vehicle</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            name="name"
            value={addForm.name}
            onChange={handleAddChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Make"
            name="make"
            value={addForm.make}
            onChange={handleAddChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Model"
            name="model"
            value={addForm.model}
            onChange={handleAddChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Year"
            name="year"
            value={addForm.year}
            onChange={handleAddChange}
            type="number"
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Type"
            name="type"
            value={addForm.type}
            onChange={handleAddChange}
            select
            fullWidth
            required
            sx={{ mb: 2 }}
          >
            {vehicleTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            name="description"
            value={addForm.description}
            onChange={handleAddChange}
            fullWidth
            multiline
            minRows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Image URL (optional)"
            name="images"
            value={addForm.images}
            onChange={handleAddChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            type="file"
            inputProps={{ accept: "image/*" }}
            onChange={handleFileChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSave}
            variant="contained"
            color="secondary"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "Add"}
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
    </Box>
  );
};
