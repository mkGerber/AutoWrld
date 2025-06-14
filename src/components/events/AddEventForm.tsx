import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  Typography,
  IconButton,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { PhotoCamera, Delete } from "@mui/icons-material";
import { supabase } from "../../services/supabase/client";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import markerIconImg from "../../assets/Map-marker.png";

interface AddEventFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const eventTypes = [
  "Car Meet",
  "Track Day",
  "Car Show",
  "Cruise",
  "Workshop",
  "Other",
];

// Fix default icon issue for leaflet in webpack
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconUrl,
  shadowUrl: iconShadow,
});

const customIcon = new L.Icon({
  iconUrl: markerIconImg,
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
});

export const AddEventForm = ({
  open,
  onClose,
  onSuccess,
}: AddEventFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    type: "",
    max_attendees: "",
  });
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: event.target.value,
      });
    };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl("");
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("event-images").getPublicUrl(fileName);

    return publicUrl;
  };

  const handleMapClick = (e: { latlng: { lat: number; lng: number } }) => {
    setMarker(e.latlng);
  };

  // Custom component to handle map click events
  function LocationMarker() {
    useMapEvents({
      click: handleMapClick,
    });
    return marker ? <Marker position={marker} icon={customIcon} /> : null;
  }

  const handleFindOnMap = async () => {
    setGeoError(null);
    if (!formData.location) return;
    setGeoLoading(true);
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: formData.location,
            format: "json",
            limit: 1,
          },
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const results = response.data;
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        setMarker({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        setGeoError("Address not found. Please try a different address.");
      }
    } catch (err) {
      setGeoError("Failed to geocode address. Please try again.");
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let imageUrl = "";

      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (error) {
          console.error("Error uploading image:", error);
          throw new Error("Failed to upload image");
        } finally {
          setUploadingImage(false);
        }
      }

      const { error } = await supabase.from("events").insert({
        title: formData.title,
        description: formData.description,
        date: `${formData.date}T${formData.time}:00Z`,
        location: formData.location,
        type: formData.type,
        max_attendees: formData.max_attendees
          ? parseInt(formData.max_attendees)
          : null,
        image_url: imageUrl,
        created_by: user.id,
        latitude: marker?.lat ?? null,
        longitude: marker?.lng ?? null,
      });

      if (error) throw error;

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        type: "",
        max_attendees: "",
      });
      setSelectedImage(null);
      setPreviewUrl("");
      setMarker(null);
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Event</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Event Title"
            fullWidth
            value={formData.title}
            onChange={handleChange("title")}
            required
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange("description")}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={formData.date}
              onChange={handleChange("date")}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              fullWidth
              value={formData.time}
              onChange={handleChange("time")}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TextField
            label="Location"
            fullWidth
            value={formData.location}
            onChange={handleChange("location")}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ pr: 1 }}>
                  <Button
                    onClick={handleFindOnMap}
                    disabled={!formData.location || geoLoading}
                    size="medium"
                    variant="contained"
                    sx={{
                      minWidth: 80,
                      px: 1.5,
                      py: 0.5,
                      fontSize: "0.95rem",
                      backgroundColor: "#d4af37",
                      color: "#0a0f2c",
                      fontWeight: 600,
                      boxShadow: "none",
                      borderRadius: 2,
                      "&:hover": {
                        backgroundColor: "#e4bf47",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {geoLoading ? "Finding..." : "Find on Map"}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          {geoError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {geoError}
            </Typography>
          )}
          <Box
            sx={{
              height: 250,
              width: "100%",
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Click the map to set the event location:
            </Typography>
            <MapContainer
              center={[37.0902, -95.7129]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <LocationMarker />
            </MapContainer>
            {marker && (
              <Typography variant="caption" color="text.secondary">
                Selected: {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
              </Typography>
            )}
          </Box>
          <TextField
            select
            label="Event Type"
            fullWidth
            value={formData.type}
            onChange={handleChange("type")}
            required
          >
            {eventTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Maximum Attendees"
            type="number"
            fullWidth
            value={formData.max_attendees}
            onChange={handleChange("max_attendees")}
          />

          {/* Image Upload Section */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Event Image
            </Typography>
            <Box
              sx={{
                border: "2px dashed #d4af37",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
                position: "relative",
                minHeight: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      objectFit: "contain",
                    }}
                  />
                  <IconButton
                    onClick={handleRemoveImage}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                    }}
                  >
                    <Delete sx={{ color: "white" }} />
                  </IconButton>
                </>
              ) : (
                <>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="event-image-upload"
                    type="file"
                    onChange={handleImageSelect}
                  />
                  <label htmlFor="event-image-upload">
                    <Button
                      component="span"
                      startIcon={<PhotoCamera />}
                      sx={{ color: "#d4af37" }}
                    >
                      Upload Image
                    </Button>
                  </label>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Click to upload an image for your event
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: "text.secondary" }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || uploadingImage}
          sx={{
            backgroundColor: "#d4af37",
            color: "#0a0f2c",
            "&:hover": { backgroundColor: "#e4bf47" },
          }}
        >
          {loading || uploadingImage ? (
            <CircularProgress size={24} sx={{ color: "#0a0f2c" }} />
          ) : (
            "Create Event"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
