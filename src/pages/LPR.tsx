import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from "@mui/material";
import {
  PhotoCamera,
  Search,
  Person,
  DirectionsCar,
  LocationOn,
  Upload,
  Clear,
  Send,
} from "@mui/icons-material";
import { supabase } from "../services/supabase/client";
import { useAuth } from "../context/AuthContext";

const LPR: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [noVehicleInviteDialogOpen, setNoVehicleInviteDialogOpen] =
    useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError("File size must be less than 20MB");
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults([]);
    setError(null);
    setShowResults(false);
    setLicensePlate("");
    setShowManualInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleManualPlateSubmit = async () => {
    if (!licensePlate.trim()) return;

    setIsProcessing(true);
    setShowManualInput(false);

    try {
      const plates = [licensePlate.trim().toUpperCase()];

      // Search for vehicles with the manually entered plate
      const vehicles = await searchForVehicles(plates);

      setResults(vehicles);
      setShowResults(true);
    } catch (err) {
      setError("Error searching for vehicles. Please try again.");
      console.error("Search error:", err);
    }

    setIsProcessing(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const searchForVehicles = async (plates: string[]) => {
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        `
        id,
        make,
        model,
        year,
        license_plate,
        license_state,
        user_id
      `
      )
      .in("license_plate", plates)
      .not("license_plate", "is", null);

    if (error) {
      console.error("Error searching for vehicles:", error);
      return [];
    }

    // Get profile details for each vehicle separately
    const vehiclesWithProfiles = await Promise.all(
      (data || []).map(async (vehicle) => {
        let profileData = null;

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, name, username, avatar_url")
            .eq("id", vehicle.user_id)
            .single();

          profileData = profile;
        } catch (err) {
          console.warn("Could not fetch profile for vehicle:", vehicle.id, err);
        }

        return {
          ...vehicle,
          profiles: profileData || {
            id: vehicle.user_id,
            name: "Unknown User",
            username: "unknown",
            avatar_url: null,
          },
        };
      })
    );

    return vehiclesWithProfiles;
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResults([]);

    try {
      // Simulate a brief processing time for UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show manual input dialog
      setShowManualInput(true);
    } catch (err) {
      setError("Error processing image. Please try again.");
      console.error("Processing error:", err);
    }

    setIsProcessing(false);
  };

  const handleViewProfile = (userId: string) => {
    // Navigate to user profile
    window.open(`/profile/${userId}`, "_blank");
  };

  const handleViewVehicle = (vehicleId: string) => {
    // Navigate to vehicle details
    window.open(`/vehicle/${vehicleId}`, "_blank");
  };

  const handleSendInvite = async () => {
    if (!selectedVehicle || !user) return;

    setSendingInvite(true);
    try {
      // Upload image if exists
      let imageUrl = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `lpr-invites/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(fileName, selectedFile);

        if (!uploadError) {
          imageUrl = supabase.storage
            .from("vehicle-images")
            .getPublicUrl(fileName).data.publicUrl;
        }
      }

      // Create LPR invite
      const { error: inviteError } = await supabase.from("lpr_invites").insert({
        sender_id: user.id,
        recipient_id: selectedVehicle.user_id,
        vehicle_id: selectedVehicle.id,
        license_plate: selectedVehicle.license_plate,
        license_state: selectedVehicle.license_state,
        image_url: imageUrl,
        message: inviteMessage.trim() || null,
      });

      if (inviteError) {
        setSnackbar({
          open: true,
          message: inviteError.message,
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Invite sent successfully!",
          severity: "success",
        });
        setInviteDialogOpen(false);
        setSelectedVehicle(null);
        setInviteMessage("");
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to send invite",
        severity: "error",
      });
      console.error("Error sending invite:", err);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSendNoVehicleInvite = async () => {
    if (!user || !licensePlate.trim()) return;

    setSendingInvite(true);
    try {
      // Upload image if exists
      let imageUrl = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `lpr-invites/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(fileName, selectedFile);

        if (!uploadError) {
          imageUrl = supabase.storage
            .from("vehicle-images")
            .getPublicUrl(fileName).data.publicUrl;
        }
      }

      // Create LPR invite without vehicle_id (for plates not in database)
      const { error: inviteError } = await supabase.from("lpr_invites").insert({
        sender_id: user.id,
        recipient_id: null, // Will be null since we don't know the owner
        vehicle_id: null, // Will be null since vehicle not in database
        license_plate: licensePlate.trim().toUpperCase(),
        license_state: null,
        image_url: imageUrl,
        message: inviteMessage.trim() || null,
        status: "pending",
      });

      if (inviteError) {
        setSnackbar({
          open: true,
          message: inviteError.message,
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message:
            "Invite created! It will be available when the vehicle owner joins.",
          severity: "success",
        });
        setNoVehicleInviteDialogOpen(false);
        setInviteMessage("");
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to create invite",
        severity: "error",
      });
      console.error("Error creating invite:", err);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleOpenInviteDialog = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setInviteDialogOpen(true);
  };

  const handleOpenNoVehicleInviteDialog = () => {
    setNoVehicleInviteDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography
        variant={isMobile ? "h4" : "h3"}
        gutterBottom
        sx={{ color: "#d4af37", textAlign: "center", mb: 4 }}
      >
        License Plate Lookup
      </Typography>

      <Typography
        variant="body1"
        sx={{
          textAlign: "center",
          mb: 4,
          color: "rgba(255, 255, 255, 0.7)",
          maxWidth: 600,
          mx: "auto",
        }}
      >
        Upload a photo of a license plate and enter the plate number to find the
        vehicle owner and their profile. Perfect for car meets, parking lots, or
        finding friends' cars!
      </Typography>

      {/* Upload Section */}
      <Paper
        sx={{
          p: 4,
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
          mb: 4,
        }}
      >
        <Box
          sx={{
            border: "2px dashed rgba(255, 255, 255, 0.3)",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": {
              borderColor: "#d4af37",
              backgroundColor: "rgba(212, 175, 55, 0.05)",
            },
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {!previewUrl ? (
            <>
              <Upload sx={{ fontSize: 48, color: "#d4af37", mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Click to upload or drag and drop
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255, 255, 255, 0.6)" }}
              >
                Supports JPG, PNG, GIF up to 20MB
              </Typography>
            </>
          ) : (
            <Box>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              />
              <Typography variant="body1" sx={{ mb: 2 }}>
                Image uploaded successfully
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "center" }}>
          <Button
            variant="contained"
            startIcon={
              isProcessing ? <CircularProgress size={20} /> : <Search />
            }
            onClick={handleProcessImage}
            disabled={!selectedFile || isProcessing}
            sx={{
              backgroundColor: "#d4af37",
              "&:hover": { backgroundColor: "#b8941f" },
              minWidth: 150,
            }}
          >
            {isProcessing ? "Processing..." : "Continue to Lookup"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClear}
            disabled={isProcessing}
            sx={{ borderColor: "#d4af37", color: "#d4af37" }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Results Section */}
      {showResults && (
        <Paper
          sx={{
            p: 4,
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h4"}
            gutterBottom
            sx={{ color: "#d4af37", mb: 3 }}
          >
            Found Vehicles ({results.length})
          </Typography>

          {results.length === 0 ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                No vehicles found with the license plate{" "}
                <strong>{licensePlate}</strong>.
              </Alert>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body1"
                  sx={{ mb: 2, color: "rgba(255, 255, 255, 0.8)" }}
                >
                  The vehicle owner might not be registered yet, but you can
                  still send an invite!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleOpenNoVehicleInviteDialog}
                  sx={{
                    backgroundColor: "#4caf50",
                    "&:hover": { backgroundColor: "#45a049" },
                  }}
                >
                  Send Invite Anyway
                </Button>
              </Box>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {results.map((vehicle) => (
                <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                  <Card
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      "&:hover": {
                        borderColor: "#d4af37",
                        transform: "translateY(-2px)",
                        transition: "all 0.3s ease",
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Avatar
                          src={vehicle.profiles?.avatar_url}
                          sx={{ mr: 2, bgcolor: "#d4af37" }}
                        >
                          {vehicle.profiles?.name?.[0] || "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ color: "#d4af37" }}>
                            {vehicle.profiles?.name || "Unknown"}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                          >
                            @{vehicle.profiles?.username || "unknown"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Typography>
                        {vehicle.user_id === user?.id ? (
                          <Chip
                            label={`${vehicle.license_plate} (${vehicle.license_state})`}
                            sx={{
                              backgroundColor: "rgba(212, 175, 55, 0.2)",
                              color: "#d4af37",
                              border: "1px solid #d4af37",
                            }}
                          />
                        ) : (
                          <Chip
                            label="License plate hidden for privacy"
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              color: "rgba(255, 255, 255, 0.6)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                            }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Person />}
                          onClick={() => handleViewProfile(vehicle.profiles.id)}
                          sx={{ borderColor: "#d4af37", color: "#d4af37" }}
                        >
                          Profile
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DirectionsCar />}
                          onClick={() => handleViewVehicle(vehicle.id)}
                          sx={{ borderColor: "#d4af37", color: "#d4af37" }}
                        >
                          Vehicle
                        </Button>
                        {vehicle.user_id !== user?.id && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Send />}
                            onClick={() => handleOpenInviteDialog(vehicle)}
                            sx={{
                              backgroundColor: "#4caf50",
                              "&:hover": { backgroundColor: "#45a049" },
                            }}
                          >
                            Send Invite
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* Info Section */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
          mt: 4,
        }}
      >
        <Typography variant="h6" sx={{ color: "#d4af37", mb: 2 }}>
          How it works
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: "center" }}>
              <PhotoCamera sx={{ fontSize: 40, color: "#d4af37", mb: 1 }} />
              <Typography variant="body2">
                1. Upload a photo of the license plate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: "center" }}>
              <Search sx={{ fontSize: 40, color: "#d4af37", mb: 1 }} />
              <Typography variant="body2">
                2. Enter the license plate number manually
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: "center" }}>
              <Person sx={{ fontSize: 40, color: "#d4af37", mb: 1 }} />
              <Typography variant="body2">
                3. Find the vehicle owner and send invites
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Manual License Plate Input Dialog */}
      <Dialog open={showManualInput} onClose={() => setShowManualInput(false)}>
        <DialogTitle sx={{ color: "#d4af37" }}>
          Enter License Plate Manually
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ mb: 2, color: "rgba(255, 255, 255, 0.7)" }}
          >
            Automatic detection couldn't find a license plate. Please enter the
            plate number manually.
          </Typography>
          <TextField
            label="License Plate"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            fullWidth
            placeholder="e.g., ABC123"
            sx={{ mb: 2 }}
            inputProps={{
              style: { textTransform: "uppercase" },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowManualInput(false)}
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleManualPlateSubmit}
            disabled={!licensePlate.trim()}
            sx={{
              backgroundColor: "#d4af37",
              color: "white",
              "&:hover": { backgroundColor: "#b8941f" },
              "&:disabled": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            Search
          </Button>
        </DialogActions>
      </Dialog>

      {/* LPR Invite Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#d4af37" }}>Send LPR Invite</DialogTitle>
        <DialogContent>
          {selectedVehicle && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Send an invite to{" "}
                <strong>{selectedVehicle.profiles?.name || "Unknown"}</strong>
                about their {selectedVehicle.year} {selectedVehicle.make}{" "}
                {selectedVehicle.model}.
              </Typography>

              <Typography
                variant="body2"
                sx={{ mb: 2, color: "rgba(255, 255, 255, 0.7)" }}
              >
                They'll receive a notification in their LPR inbox and can choose
                to accept or decline.
              </Typography>

              <TextField
                label="Message (optional)"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Hey! I spotted your car and wanted to connect..."
                sx={{ mb: 2 }}
              />

              {previewUrl && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Image that will be included:
                  </Typography>
                  <img
                    src={previewUrl}
                    alt="License plate"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 150,
                      borderRadius: 8,
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setInviteDialogOpen(false)}
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendInvite}
            disabled={sendingInvite}
            startIcon={
              sendingInvite ? <CircularProgress size={16} /> : <Send />
            }
            sx={{
              backgroundColor: "#4caf50",
              color: "white",
              "&:hover": { backgroundColor: "#45a049" },
              "&:disabled": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            {sendingInvite ? "Sending..." : "Send Invite"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* No Vehicle Invite Dialog */}
      <Dialog
        open={noVehicleInviteDialogOpen}
        onClose={() => setNoVehicleInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#d4af37" }}>Send LPR Invite</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Send an invite to the vehicle owner with the license plate{" "}
            <strong>{licensePlate}</strong>.
          </Typography>

          <Typography
            variant="body2"
            sx={{ mb: 2, color: "rgba(255, 255, 255, 0.7)" }}
          >
            They'll receive a notification in their LPR inbox and can choose to
            accept or decline.
          </Typography>

          <TextField
            label="Message (optional)"
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Hey! I spotted your car and wanted to connect..."
            sx={{ mb: 2 }}
          />

          {previewUrl && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Image that will be included:
              </Typography>
              <img
                src={previewUrl}
                alt="License plate"
                style={{
                  maxWidth: "100%",
                  maxHeight: 150,
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNoVehicleInviteDialogOpen(false)}
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendNoVehicleInvite}
            disabled={sendingInvite}
            startIcon={
              sendingInvite ? <CircularProgress size={16} /> : <Send />
            }
            sx={{
              backgroundColor: "#4caf50",
              color: "white",
              "&:hover": { backgroundColor: "#45a049" },
              "&:disabled": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            {sendingInvite ? "Sending..." : "Send Invite"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default LPR;
