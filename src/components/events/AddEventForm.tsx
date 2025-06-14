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
} from "@mui/material";
import { PhotoCamera, Delete } from "@mui/icons-material";
import { supabase } from "../../services/supabase/client";
import { useAuth } from "../../context/AuthContext";

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
          />
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
