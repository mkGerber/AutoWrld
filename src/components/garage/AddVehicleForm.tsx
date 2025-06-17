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
  CircularProgress,
  LinearProgress,
  Backdrop,
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

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
      setIsUploading(true);
      setUploadProgress(0);
      const fileArr = Array.from(files);
      const maxSize = 15 * 1024 * 1024; // 15MB
      setError(null);
      const compressedFiles: File[] = [];
      const previewPromises: Promise<string>[] = [];

      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i];
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
          // Update progress based on number of files processed
          setUploadProgress(((i + 1) / fileArr.length) * 100);
        } catch (err) {
          setError(`Failed to compress ${file.name}`);
        }
      }
      setSelectedFiles(compressedFiles);
      await Promise.all(previewPromises).then(setPreviewImages);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit({ ...formData, files: selectedFiles });
      onClose();
    } catch (error) {
      setError("Failed to save vehicle. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: "absolute",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
        open={isSaving}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress size={60} thickness={4} sx={{ color: "#d4af37" }} />
          <Typography variant="h6" sx={{ color: "#fff" }}>
            Saving Vehicle...
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#fff", textAlign: "center", maxWidth: "300px" }}
          >
            Please wait while we save your vehicle and upload images to the
            database. Do not close this window.
          </Typography>
        </Box>
      </Backdrop>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">Add New Vehicle</Typography>
          <IconButton onClick={onClose} size="small" disabled={isSaving}>
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
                  startIcon={
                    isUploading ? (
                      <CircularProgress size={20} sx={{ color: "#d4af37" }} />
                    ) : (
                      <CloudUpload />
                    )
                  }
                  disabled={isUploading || isSaving}
                  sx={{
                    borderColor: "#d4af37",
                    color: "#d4af37",
                    "&:hover": {
                      borderColor: "#e4bf47",
                      backgroundColor: "rgba(212, 175, 55, 0.1)",
                    },
                    "&.Mui-disabled": {
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "rgba(212, 175, 55, 0.3)",
                    },
                  }}
                >
                  {isUploading ? "Processing Images..." : "Upload Images"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={isUploading || isSaving}
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
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !formData.name ||
            !formData.make ||
            !formData.model ||
            !formData.year ||
            !formData.type ||
            isUploading ||
            isSaving
          }
          sx={{
            backgroundColor: "#d4af37",
            color: "#0a0f2c",
            "&:hover": {
              backgroundColor: "#e4bf47",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(212, 175, 55, 0.3)",
              color: "rgba(10, 15, 44, 0.3)",
            },
          }}
        >
          {isSaving ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={24} sx={{ color: "#0a0f2c" }} />
              <Typography>Saving...</Typography>
            </Box>
          ) : (
            "Add Vehicle"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVehicleForm;
