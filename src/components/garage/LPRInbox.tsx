import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Check,
  Close,
  Delete,
  PhotoCamera,
  DirectionsCar,
  Person,
  Schedule,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface LPRInvite {
  id: string;
  sender_id: string;
  recipient_id: string;
  vehicle_id: string;
  license_plate: string;
  license_state?: string;
  image_url?: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  sender_profile?: {
    name: string;
    username: string;
    avatar_url?: string;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
  };
}

interface LPRInboxProps {
  open: boolean;
  onClose: () => void;
}

export const LPRInbox: React.FC<LPRInboxProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<LPRInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvite, setSelectedInvite] = useState<LPRInvite | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchInvites();
    }
  }, [open, user]);

  const fetchInvites = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      // First, get the LPR invites where user is recipient
      const { data: receivedInvites, error: receivedError } = await supabase
        .from("lpr_invites")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });

      if (receivedError) {
        setError(receivedError.message);
        setLoading(false);
        return;
      }

      // Get user's vehicles to check for license plate matches
      const { data: userVehicles } = await supabase
        .from("vehicles")
        .select("id, license_plate, license_state, make, model, year")
        .eq("user_id", user.id);

      // Get invites that match user's license plates (where recipient_id is null)
      const { data: plateMatchInvites, error: plateMatchError } = await supabase
        .from("lpr_invites")
        .select("*")
        .is("recipient_id", null)
        .in(
          "license_plate",
          userVehicles?.map((v) => v.license_plate).filter(Boolean) || []
        )
        .order("created_at", { ascending: false });

      if (plateMatchError) {
        console.warn("Error fetching plate match invites:", plateMatchError);
      }

      // Combine all invites
      const allInvites = [
        ...(receivedInvites || []),
        ...(plateMatchInvites || []),
      ];

      // Then, get the sender profiles and vehicle details separately
      const invitesWithDetails = await Promise.all(
        allInvites.map(async (invite) => {
          let senderProfile = null;
          let vehicleDetails = null;

          try {
            // Get sender profile
            const { data: profileData } = await supabase
              .from("profiles")
              .select("name, username, avatar_url")
              .eq("id", invite.sender_id)
              .single();

            senderProfile = profileData;
          } catch (err) {
            console.warn("Could not fetch sender profile:", err);
          }

          try {
            // Get vehicle details if vehicle_id exists
            if (invite.vehicle_id) {
              const { data: vehicleData } = await supabase
                .from("vehicles")
                .select("make, model, year")
                .eq("id", invite.vehicle_id)
                .single();

              vehicleDetails = vehicleData;
            } else if (invite.license_plate) {
              // If no vehicle_id, try to find vehicle by license plate
              const { data: vehicleData } = await supabase
                .from("vehicles")
                .select("make, model, year")
                .eq("license_plate", invite.license_plate)
                .eq("user_id", user.id)
                .single();

              vehicleDetails = vehicleData;
            }
          } catch (err) {
            console.warn("Could not fetch vehicle details:", err);
          }

          return {
            ...invite,
            sender_profile: senderProfile || {
              name: "Unknown User",
              username: "unknown",
              avatar_url: null,
            },
            vehicle: vehicleDetails || {
              make: "Unknown",
              model: "Unknown",
              year: null,
            },
          };
        })
      );

      setInvites(invitesWithDetails);
    } catch (err) {
      setError("Failed to fetch invites");
      console.error("Error fetching invites:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("lpr_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId);

      if (!error) {
        setInvites((prev) =>
          prev.map((invite) =>
            invite.id === inviteId
              ? { ...invite, status: "accepted" as const }
              : invite
          )
        );
      } else {
        setError("Failed to accept invite");
      }
    } catch (err) {
      setError("Failed to accept invite");
      console.error("Error accepting invite:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("lpr_invites")
        .update({ status: "declined" })
        .eq("id", inviteId);

      if (!error) {
        setInvites((prev) =>
          prev.map((invite) =>
            invite.id === inviteId
              ? { ...invite, status: "declined" as const }
              : invite
          )
        );
      } else {
        setError("Failed to decline invite");
      }
    } catch (err) {
      setError("Failed to decline invite");
      console.error("Error declining invite:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("lpr_invites")
        .delete()
        .eq("id", inviteId);

      if (!error) {
        setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      } else {
        setError("Failed to delete invite");
      }
    } catch (err) {
      setError("Failed to delete invite");
      console.error("Error deleting invite:", err);
    }
  };

  const handleViewDetails = (invite: LPRInvite) => {
    setSelectedInvite(invite);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "accepted":
        return "success";
      case "declined":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "declined":
        return "Declined";
      default:
        return status;
    }
  };

  const pendingInvites = invites.filter(
    (invite) => invite.status === "pending"
  );
  const otherInvites = invites.filter((invite) => invite.status !== "pending");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#d4af37",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h5" sx={{ color: "#d4af37" }}>
            LPR Inbox
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <Box>
            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: "#d4af37", mb: 2 }}>
                  Pending Invites ({pendingInvites.length})
                </Typography>
                <Grid container spacing={2}>
                  {pendingInvites.map((invite) => (
                    <Grid item xs={12} key={invite.id}>
                      <Card
                        sx={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          "&:hover": {
                            borderColor: "#d4af37",
                          },
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <Avatar
                              src={invite.sender_profile?.avatar_url}
                              sx={{ mr: 2, bgcolor: "#d4af37" }}
                            >
                              {invite.sender_profile?.name?.[0] || "?"}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                variant="h6"
                                sx={{ color: "#d4af37" }}
                              >
                                {invite.sender_profile?.name || "Unknown User"}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                              >
                                @{invite.sender_profile?.username || "unknown"}
                              </Typography>
                            </Box>
                            <Chip
                              label={getStatusText(invite.status)}
                              color={getStatusColor(invite.status) as any}
                              size="small"
                            />
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <DirectionsCar sx={{ mr: 1, color: "#d4af37" }} />
                            <Typography variant="body1">
                              {invite.vehicle?.year} {invite.vehicle?.make}{" "}
                              {invite.vehicle?.model}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <PhotoCamera sx={{ mr: 1, color: "#d4af37" }} />
                            <Typography variant="body1">
                              License Plate: {invite.license_plate}
                              {invite.license_state &&
                                ` (${invite.license_state})`}
                            </Typography>
                          </Box>

                          {invite.message && (
                            <Typography
                              variant="body2"
                              sx={{ mb: 2, color: "rgba(255, 255, 255, 0.8)" }}
                            >
                              "{invite.message}"
                            </Typography>
                          )}

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <Schedule
                              sx={{ mr: 1, color: "rgba(255, 255, 255, 0.6)" }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                            >
                              {formatDistanceToNow(
                                new Date(invite.created_at),
                                { addSuffix: true }
                              )}
                            </Typography>
                          </Box>
                        </CardContent>

                        <CardActions
                          sx={{ justifyContent: "space-between", p: 2 }}
                        >
                          <Box>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetails(invite)}
                              sx={{
                                borderColor: "#d4af37",
                                color: "#d4af37",
                                mr: 1,
                              }}
                            >
                              View Details
                            </Button>
                          </Box>
                          <Box>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Check />}
                              onClick={() => handleAcceptInvite(invite.id)}
                              disabled={processing}
                              sx={{
                                backgroundColor: "#4caf50",
                                "&:hover": { backgroundColor: "#45a049" },
                                mr: 1,
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Close />}
                              onClick={() => handleDeclineInvite(invite.id)}
                              disabled={processing}
                              sx={{
                                backgroundColor: "#f44336",
                                "&:hover": { backgroundColor: "#d32f2f" },
                              }}
                            >
                              Decline
                            </Button>
                          </Box>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Other Invites */}
            {otherInvites.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ color: "#d4af37", mb: 2 }}>
                  Previous Invites ({otherInvites.length})
                </Typography>
                <Grid container spacing={2}>
                  {otherInvites.map((invite) => (
                    <Grid item xs={12} sm={6} key={invite.id}>
                      <Card
                        sx={{
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <Avatar
                              src={invite.sender_profile?.avatar_url}
                              sx={{ mr: 2, bgcolor: "#d4af37" }}
                            >
                              {invite.sender_profile?.name?.[0] || "?"}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                variant="body1"
                                sx={{ color: "#d4af37" }}
                              >
                                {invite.sender_profile?.name || "Unknown User"}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                              >
                                {invite.license_plate}
                              </Typography>
                            </Box>
                            <Chip
                              label={getStatusText(invite.status)}
                              color={getStatusColor(invite.status) as any}
                              size="small"
                            />
                          </Box>
                        </CardContent>

                        <CardActions
                          sx={{ justifyContent: "space-between", p: 2 }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewDetails(invite)}
                            sx={{ borderColor: "#d4af37", color: "#d4af37" }}
                          >
                            View Details
                          </Button>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteInvite(invite.id)}
                              sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {invites.length === 0 && (
              <Box sx={{ textAlign: "center", p: 4 }}>
                <PhotoCamera
                  sx={{
                    fontSize: 64,
                    color: "rgba(255, 255, 255, 0.3)",
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 1 }}
                >
                  No LPR Invites
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.4)" }}
                >
                  When someone finds your vehicle using LPR, you'll receive
                  invites here.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {selectedInvite && (
          <>
            <DialogTitle sx={{ color: "#d4af37" }}>
              LPR Invite Details
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    src={selectedInvite.sender_profile?.avatar_url}
                    sx={{ mr: 2, bgcolor: "#d4af37" }}
                  >
                    {selectedInvite.sender_profile?.name?.[0] || "?"}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: "#d4af37" }}>
                      {selectedInvite.sender_profile?.name || "Unknown User"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                    >
                      @{selectedInvite.sender_profile?.username || "unknown"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Vehicle:</strong> {selectedInvite.vehicle?.year}{" "}
                  {selectedInvite.vehicle?.make} {selectedInvite.vehicle?.model}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>License Plate:</strong> {selectedInvite.license_plate}
                  {selectedInvite.license_state &&
                    ` (${selectedInvite.license_state})`}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Status:</strong>{" "}
                  {getStatusText(selectedInvite.status)}
                </Typography>

                {selectedInvite.message && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                    >
                      <strong>Message:</strong> "{selectedInvite.message}"
                    </Typography>
                  </Box>
                )}

                {selectedInvite.image_url && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Image:</strong>
                    </Typography>
                    <img
                      src={selectedInvite.image_url}
                      alt="License plate"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 200,
                        borderRadius: 8,
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    />
                  </Box>
                )}

                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  Sent{" "}
                  {formatDistanceToNow(new Date(selectedInvite.created_at), {
                    addSuffix: true,
                  })}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Dialog>
  );
};
