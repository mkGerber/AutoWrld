import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload,
} from "@mui/icons-material";
import { vehicleTypes } from "../../constants/vehicleTypes"; // accessing vehicle types from constants... (same is done in Discover.tsx)
import { makes } from "../../constants/makes"; // "constants" folder created that can contain constants (like makes) so we don't have to repeat them in multiple files
import imageCompression from "browser-image-compression";

interface AddVehicleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (vehicleData: any) => void;
}

export const AddVehicleForm = ({
  open,
  onClose,
  onSubmit,
}: AddVehicleFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    make: "",
    model: "",
    year: "",
    type: "",
    horsepower: "",
    description: "",
    modifications: [] as string[],
    images: [] as string[],
  });

  const [newModification, setNewModification] = useState("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: event.target.value,
      });
    };

  const handleAddModification = () => {
    if (newModification.trim()) {
      setFormData({
        ...formData,
        modifications: [...formData.modifications, newModification.trim()],
      });
      setNewModification("");
    }
  };

  const handleRemoveModification = (index: number) => {
    setFormData({
      ...formData,
      modifications: formData.modifications.filter((_, i) => i !== index),
    });
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArr = Array.from(files);
      const maxSize = 15 * 1024 * 1024; // 15MB
      setError(null);
      const compressedFiles: File[] = [];
      const previewPromises: Promise<string>[] = [];
      for (const file of fileArr) {
        if (file.size > maxSize) {
          setError(`File ${file.name} is too large (max 15MB).`);
          continue;
        }
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
          compressedFiles.push(compressed);
          previewPromises.push(
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(compressed);
            })
          );
        } catch (err) {
          setError(`Failed to compress ${file.name}`);
        }
      }
      setSelectedFiles(compressedFiles);
      Promise.all(previewPromises).then(setPreviewImages);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ ...formData, files: selectedFiles });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">Add New Vehicle</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle Name"
                value={formData.name}
                onChange={handleChange("name")}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                select
                label="Make"
                value={formData.make}
                onChange={handleChange("make")}
                required
                margin="normal"
              >
                {makes.map((make) => (
                  <MenuItem key={make} value={make}>
                    {make}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={handleChange("model")}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Year"
                value={formData.year}
                onChange={handleChange("year")}
                required
                margin="normal"
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Vehicle Type"
                value={formData.type}
                onChange={handleChange("type")}
                required
                margin="normal"
              >
                {vehicleTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Horsepower"
                value={formData.horsepower}
                onChange={handleChange("horsepower")}
                margin="normal"
                type="number"
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange("description")}
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Modifications
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label="Add Modification"
                    value={newModification}
                    onChange={(e) => setNewModification(e.target.value)}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddModification}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formData.modifications.map((mod, index) => (
                    <Chip
                      key={index}
                      label={mod}
                      onDelete={() => handleRemoveModification(index)}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Vehicle Images
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                >
                  Upload Images
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </Button>
                {error && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
                {previewImages.length > 0 && (
                  <Box
                    sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}
                  >
                    {previewImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        style={{
                          maxWidth: "100px",
                          maxHeight: "100px",
                          borderRadius: "8px",
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !formData.name ||
            !formData.make ||
            !formData.model ||
            !formData.year ||
            !formData.type
          }
        >
          Add Vehicle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVehicleForm;
