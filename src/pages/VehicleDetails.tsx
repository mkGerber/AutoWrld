import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Divider,
  Avatar,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
  Card,
  CardMedia,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Slider,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import {
  PhotoLibrary,
  Build,
  Speed,
  CalendarToday,
  LocationOn,
  Favorite,
  FavoriteBorder,
  Share,
  Comment,
  ArrowBack,
  Edit,
  Delete,
  Add,
  CheckCircle,
  CheckCircleOutline,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/supabase/client";
import VehicleComments from "../components/vehicle/VehicleComments";
import { useAuth } from "../context/AuthContext";
import imageCompression from "browser-image-compression";

const statusColors = {
  "In Progress": "#ff9800",
  Complete: "#4caf50",
  Planning: "#2196f3",
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vehicle-tabpanel-${index}`}
      aria-labelledby={`vehicle-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const VehicleDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [tempModifications, setTempModifications] = useState<string[]>([]);
  const [buildProgressValue, setBuildProgressValue] = useState<number | null>(
    null
  );
  const [savingBuildProgress, setSavingBuildProgress] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [addTimelineOpen, setAddTimelineOpen] = useState(false);
  const [newTimeline, setNewTimeline] = useState({
    title: "",
    description: "",
    date: "",
  });
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [addWishlistOpen, setAddWishlistOpen] = useState(false);
  const [newWishlistItem, setNewWishlistItem] = useState({
    title: "",
    description: "",
    priority: "medium",
    estimated_cost: "",
  });
  const [addingWishlist, setAddingWishlist] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState<any>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [editingLicense, setEditingLicense] = useState(false);
  const [savingLicense, setSavingLicense] = useState(false);
  const [fanPhotos, setFanPhotos] = useState<any[]>([]);
  const [fanPhotosLoading, setFanPhotosLoading] = useState(true);
  const [selectedFanPhoto, setSelectedFanPhoto] = useState<any>(null);
  const [fanPhotoModalOpen, setFanPhotoModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchVehicleAndLikes = async () => {
      setLoading(true);
      // 1. Fetch vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (vehicleError || !vehicleData) {
        navigate("/garage");
        setLoading(false);
        return;
      }

      // 2. Fetch owner profile if user_id exists
      let owner = {
        name: "Anonymous",
        avatar_url: "https://i.pravatar.cc/150?img=1",
      };
      if (vehicleData.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", vehicleData.user_id)
          .single();
        if (profileData) {
          owner = profileData;
        }
      }

      // 3. Check if current user has liked this vehicle
      let userLiked = false;
      if (user && id) {
        try {
          const { data: likeData, error: likeError } = await supabase
            .from("vehicle_likes")
            .select("id")
            .eq("vehicle_id", id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!likeError && likeData) {
            userLiked = true;
          }
        } catch (error) {
          console.warn("Could not check user like status:", error);
          // If there's an error (like table doesn't exist), default to not liked
          userLiked = false;
        }
      }

      setVehicle({ ...vehicleData, owner });
      setLikesCount(vehicleData.likes_count || 0);
      setIsLiked(userLiked);
      setLicensePlate(vehicleData.license_plate || "");
      setLicenseState(vehicleData.license_state || "");
      setLoading(false);
    };

    fetchVehicleAndLikes();
  }, [id, navigate, user]);

  useEffect(() => {
    if (vehicle && typeof vehicle.buildProgress === "number") {
      setBuildProgressValue(vehicle.buildProgress);
    }
  }, [vehicle]);

  useEffect(() => {
    const fetchTimeline = async () => {
      setTimelineLoading(true);
      const { data, error } = await supabase
        .from("vehicle_timeline")
        .select("*")
        .eq("vehicle_id", id)
        .order("date", { ascending: false });
      if (!error) setTimelineItems(data || []);
      setTimelineLoading(false);
    };
    if (id) fetchTimeline();
  }, [id]);

  useEffect(() => {
    const fetchWishlist = async () => {
      setWishlistLoading(true);
      const { data, error } = await supabase
        .from("vehicle_wishlist")
        .select("*")
        .eq("vehicle_id", id)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (!error) setWishlistItems(data || []);
      setWishlistLoading(false);
    };
    if (id) fetchWishlist();
  }, [id]);

  useEffect(() => {
    const fetchFanPhotos = async () => {
      if (!id) return;
      setFanPhotosLoading(true);
      try {
        // Get accepted LPR invites with images for this vehicle
        const { data, error } = await supabase
          .from("lpr_invites")
          .select(
            `
            *,
            sender_profile:profiles!lpr_invites_sender_id_fkey(
              name,
              username,
              avatar_url
            )
          `
          )
          .eq("vehicle_id", id)
          .eq("status", "accepted")
          .not("image_url", "is", null)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setFanPhotos(data);
        }
      } catch (err) {
        console.error("Error fetching fan photos:", err);
      } finally {
        setFanPhotosLoading(false);
      }
    };

    fetchFanPhotos();
  }, [id]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!id) return;
      try {
        const { count, error } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("vehicle_id", id);

        if (!error && count !== null) {
          setCommentCount(count);
        }
      } catch (err) {
        console.error("Error fetching comment count:", err);
      }
    };

    fetchCommentCount();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!vehicle) return null;

  // Safely parse vehicle.images
  let parsedImages: string[] = [];

  try {
    if (typeof vehicle.images === "string") {
      const outer = JSON.parse(vehicle.images);

      if (
        Array.isArray(outer) &&
        typeof outer[0] === "string" &&
        outer[0].trim().startsWith("[")
      ) {
        parsedImages = JSON.parse(outer[0]);
      } else if (Array.isArray(outer)) {
        parsedImages = outer;
      }
    } else if (Array.isArray(vehicle.images)) {
      parsedImages = vehicle.images;
    }
  } catch (err) {
    console.warn("Image parsing failed:", err);
    parsedImages = [];
  }

  const reversedImages = Array.isArray(parsedImages)
    ? parsedImages.slice().reverse()
    : [];

  // Provide safe fallback for owner
  const owner = vehicle.owner || {
    name: "Anonymous",
    avatar_url: "https://i.pravatar.cc/150?img=1",
  };

  // Provide safe fallback for status/type
  const statusLabel = (
    vehicle.status ||
    vehicle.type ||
    "Unknown"
  ).toUpperCase();

  // Helper for status color
  const statusColor =
    statusColors[(vehicle.status as keyof typeof statusColors) || "Planning"];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleEdit = (field: string, value: any) => {
    setEditField(field);
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editField || !vehicle) return;

    try {
      const updates: any = {};
      if (editField === "modifications") {
        updates[editField] = tempModifications;
      } else {
        updates[editField] = editValue;
      }

      const { error } = await supabase
        .from("vehicles")
        .update(updates)
        .eq("id", vehicle.id);

      if (error) throw error;

      // Update the local state with the new value
      if (editField === "modifications") {
        setVehicle({ ...vehicle, [editField]: tempModifications });
      } else {
        setVehicle({ ...vehicle, [editField]: editValue });
      }

      setIsEditing(false);
      setEditField(null);
      setEditValue(null);
      setTempModifications([]);
    } catch (error) {
      console.error("Error updating vehicle:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditField(null);
    setEditValue(null);
  };

  // Handler for slider change
  const handleBuildProgressChange = (_: Event, value: number | number[]) => {
    setBuildProgressValue(Array.isArray(value) ? value[0] : value);
  };

  // Handler for saving build progress
  const handleSaveBuildProgress = async () => {
    if (buildProgressValue === null || !vehicle) return;
    setSavingBuildProgress(true);
    const { error } = await supabase
      .from("vehicles")
      .update({ buildProgress: buildProgressValue })
      .eq("id", vehicle.id);
    if (!error) {
      setVehicle({ ...vehicle, buildProgress: buildProgressValue });
    }
    setSavingBuildProgress(false);
  };

  const handleAddTimeline = async () => {
    setAddingTimeline(true);
    const { error, data } = await supabase
      .from("vehicle_timeline")
      .insert([{ ...newTimeline, vehicle_id: id }])
      .select()
      .single();
    if (!error && data) {
      setTimelineItems([data, ...timelineItems]);
      setAddTimelineOpen(false);
      setNewTimeline({ title: "", description: "", date: "" });
    }
    setAddingTimeline(false);
  };

  // Handler for image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !vehicle) return;
    setUploading(true);
    setUploadError(null);
    const maxSize = 15 * 1024 * 1024; // 15MB
    const compressedFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        setUploadError(`File ${file.name} is too large (max 15MB).`);
        continue;
      }
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
        compressedFiles.push(compressed);
      } catch (err) {
        setUploadError(`Failed to compress ${file.name}`);
      }
    }
    // Upload compressed files to storage and update vehicle images
    try {
      const uploadedUrls: string[] = [];
      for (const file of compressedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${vehicle.id}/${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from("vehicle-images")
          .upload(fileName, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from("vehicle-images")
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }
      // Update vehicle images in DB
      const newImages = [...(parsedImages || []), ...uploadedUrls];
      await supabase
        .from("vehicles")
        .update({ images: JSON.stringify(newImages) })
        .eq("id", vehicle.id);
      setVehicle({ ...vehicle, images: newImages });
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  // Handler for deleting an image
  const handleDeleteImage = async (imageUrl: string) => {
    if (!vehicle) return;
    setDeletingImage(imageUrl);
    try {
      // Robustly extract the file path from the public URL
      let filePath = "";
      const marker = "/vehicle-images/";
      const idx = imageUrl.indexOf(marker);
      if (idx !== -1) {
        filePath = imageUrl.substring(idx + marker.length);
      }
      if (!filePath)
        throw new Error("Could not extract file path from image URL");
      console.log("Attempting to delete file from storage:", filePath);
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from("vehicle-images")
        .remove([filePath]);
      if (storageError) {
        console.error("Supabase storage error:", storageError);
        throw new Error("Supabase storage error: " + storageError.message);
      }
      // Remove from DB
      const newImages = (parsedImages || []).filter((img) => img !== imageUrl);
      await supabase
        .from("vehicles")
        .update({ images: JSON.stringify(newImages) })
        .eq("id", vehicle.id);
      setVehicle({ ...vehicle, images: newImages });
      // If the deleted image was selected, reset selection
      if (reversedImages[selectedImage] === imageUrl) {
        setSelectedImage(0);
      }
    } catch (err: any) {
      setUploadError(
        err && err.message ? err.message : "Failed to delete image"
      );
      console.error("Image deletion error:", err);
    } finally {
      setDeletingImage(null);
    }
  };

  // Like/Unlike handler
  const handleLikeToggle = async () => {
    if (!user || !id || liking) return;

    setLiking(true);
    try {
      if (isLiked) {
        // Unlike
        const { error: unlikeError } = await supabase
          .from("vehicle_likes")
          .delete()
          .eq("vehicle_id", id)
          .eq("user_id", user.id);

        if (!unlikeError) {
          // Update the likes count directly
          const { error: updateError } = await supabase
            .from("vehicles")
            .update({
              likes_count: Math.max(0, (vehicle?.likes_count || 0) - 1),
            })
            .eq("id", id);

          if (!updateError) {
            setIsLiked(false);
            setLikesCount((prev) => Math.max(0, prev - 1));
            // Update the vehicle state
            setVehicle((prev: any) =>
              prev
                ? {
                    ...prev,
                    likes_count: Math.max(0, (prev.likes_count || 0) - 1),
                  }
                : null
            );
          } else {
            console.error("Error updating likes count:", updateError);
          }
        } else {
          console.error("Error unliking:", unlikeError);
        }
      } else {
        // Like
        const { error: likeError } = await supabase
          .from("vehicle_likes")
          .insert({
            vehicle_id: id,
            user_id: user.id,
          });

        if (!likeError) {
          // Update the likes count directly
          const { error: updateError } = await supabase
            .from("vehicles")
            .update({ likes_count: (vehicle?.likes_count || 0) + 1 })
            .eq("id", id);

          if (!updateError) {
            setIsLiked(true);
            setLikesCount((prev) => prev + 1);
            // Update the vehicle state
            setVehicle((prev: any) =>
              prev
                ? { ...prev, likes_count: (prev.likes_count || 0) + 1 }
                : null
            );
          } else {
            console.error("Error updating likes count:", updateError);
          }
        } else {
          console.error("Error liking:", likeError);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLiking(false);
    }
  };

  // Helper function to check if current user is the owner
  const isOwner = user && vehicle && user.id === vehicle.user_id;

  const handleAddWishlistItem = async () => {
    if (!id || !newWishlistItem.title.trim()) return;
    setAddingWishlist(true);
    try {
      const { error, data } = await supabase
        .from("vehicle_wishlist")
        .insert([{ ...newWishlistItem, vehicle_id: id }])
        .select()
        .single();
      if (!error && data) {
        setWishlistItems([data, ...wishlistItems]);
        setAddWishlistOpen(false);
        setNewWishlistItem({
          title: "",
          description: "",
          priority: "medium",
          estimated_cost: "",
        });
      }
    } catch (err) {
      console.error("Error adding wishlist item:", err);
    } finally {
      setAddingWishlist(false);
    }
  };

  const handleEditWishlistItem = async () => {
    if (!editingWishlist || !editingWishlist.title.trim()) return;
    try {
      const { error } = await supabase
        .from("vehicle_wishlist")
        .update(editingWishlist)
        .eq("id", editingWishlist.id);
      if (!error) {
        setWishlistItems(
          wishlistItems.map((item) =>
            item.id === editingWishlist.id ? editingWishlist : item
          )
        );
        setEditingWishlist(null);
      }
    } catch (err) {
      console.error("Error updating wishlist item:", err);
    }
  };

  const handleToggleWishlistComplete = async (
    itemId: string,
    completed: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("vehicle_wishlist")
        .update({ completed: !completed })
        .eq("id", itemId);
      if (!error) {
        setWishlistItems(
          wishlistItems.map((item) =>
            item.id === itemId ? { ...item, completed: !completed } : item
          )
        );

        // If marking as complete, add to build timeline
        if (!completed) {
          const item = wishlistItems.find((w) => w.id === itemId);
          if (item) {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
            const costText = item.estimated_cost
              ? ` ($${item.estimated_cost})`
              : "";
            const timelineItem = {
              title: `Completed: ${item.title}${costText}`,
              description:
                item.description || `Completed wishlist item: ${item.title}`,
              date: today,
              vehicle_id: id,
            };

            const { error: timelineError, data: timelineData } = await supabase
              .from("vehicle_timeline")
              .insert([timelineItem])
              .select()
              .single();

            if (!timelineError && timelineData) {
              setTimelineItems([timelineData, ...timelineItems]);
            }
          }
        } else {
          // If unchecking, remove from build timeline
          const item = wishlistItems.find((w) => w.id === itemId);
          if (item) {
            const costText = item.estimated_cost
              ? ` ($${item.estimated_cost})`
              : "";
            const { error: deleteError } = await supabase
              .from("vehicle_timeline")
              .delete()
              .eq("title", `Completed: ${item.title}${costText}`)
              .eq("vehicle_id", id);

            if (!deleteError) {
              // Remove from local state
              setTimelineItems(
                timelineItems.filter(
                  (timelineItem) =>
                    timelineItem.title !== `Completed: ${item.title}${costText}`
                )
              );
            }
          }
        }
      }
    } catch (err) {
      console.error("Error toggling wishlist item:", err);
    }
  };

  const handleDeleteWishlistItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("vehicle_wishlist")
        .delete()
        .eq("id", itemId);
      if (!error) {
        setWishlistItems(wishlistItems.filter((item) => item.id !== itemId));
      }
    } catch (err) {
      console.error("Error deleting wishlist item:", err);
    }
  };

  const handleSaveLicense = async () => {
    if (!id) return;
    setSavingLicense(true);
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({
          license_plate: licensePlate,
          license_state: licenseState,
        })
        .eq("id", id);
      if (!error) {
        setEditingLicense(false);
      }
    } catch (error) {
      console.error("Error saving license plate:", error);
    }
    setSavingLicense(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        px: isMobile ? 0.5 : 0,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: isMobile ? 2 : 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/garage")}
          sx={{
            mb: 2,
            color: "#d4af37",
            fontSize: isMobile ? "1rem" : "1.1rem",
          }}
        >
          Back to Garage
        </Button>
        <Box
          sx={{
            display: isMobile ? "block" : "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-start",
            gap: isMobile ? 2 : 0,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                component="h1"
                sx={{ color: "#d4af37" }}
              >
                {vehicle.name}
              </Typography>
              {isOwner && (
                <IconButton
                  size="small"
                  onClick={() => handleEdit("name", vehicle.name)}
                  sx={{ color: "#d4af37" }}
                >
                  <Edit />
                </IconButton>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
                onClick={() => navigate(`/profile/${vehicle.user_id}`)}
              >
                <Avatar
                  src={owner.avatar_url}
                  sx={{
                    mr: 1,
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                  }}
                />
                <Typography
                  variant={isMobile ? "body2" : "subtitle1"}
                  color="text.secondary"
                >
                  {owner.name}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Chip
            label={statusLabel}
            sx={{
              backgroundColor: statusColor,
              color: "white",
              fontWeight: "bold",
              fontSize: isMobile ? "0.95rem" : undefined,
              mt: isMobile ? 2 : 0,
            }}
          />
        </Box>
      </Box>

      {/* Main Content Split */}
      <Box
        sx={{
          display: isMobile ? "block" : "flex",
          gap: isMobile ? 0 : 4,
          flex: 1,
        }}
      >
        {/* Left Side - Image Gallery */}
        <Box
          sx={{
            width: isMobile ? "100%" : "45%",
            position: isMobile ? "static" : "sticky",
            top: 24,
            height: "auto",
            mb: isMobile ? 2 : 0,
          }}
        >
          <Paper
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: isMobile ? 220 : 320,
              height: "auto",
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
              background: "#181c2f",
            }}
          >
            <CardMedia
              component="img"
              image={reversedImages[selectedImage]}
              alt={vehicle.name}
              sx={{
                maxHeight: "60vh",
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                background: "#181c2f",
                margin: "0 auto",
                display: "block",
              }}
            />
          </Paper>
          {isOwner && (
            <Box sx={{ mb: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<PhotoLibrary />}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Add Images"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </Button>
              {uploadError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {uploadError}
                </Typography>
              )}
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                borderRadius: "2px",
              },
              mb: isMobile ? 2 : 0,
            }}
          >
            {reversedImages.map((image, index) => (
              <Box
                key={index}
                sx={{
                  width: isMobile ? 60 : 100,
                  height: isMobile ? 60 : 100,
                  flexShrink: 0,
                  cursor: "pointer",
                  border:
                    selectedImage === index ? "2px solid #d4af37" : "none",
                  borderRadius: 1,
                  overflow: "hidden",
                  background: "#181c2f",
                  position: "relative",
                }}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image}
                  alt={`${vehicle.name} thumbnail ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#181c2f",
                    display: "block",
                  }}
                />
                {isOwner && (
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      zIndex: 2,
                      "&:hover": { background: "rgba(220,0,0,0.8)" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image);
                    }}
                    disabled={deletingImage === image}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right Side - Information */}
        <Box sx={{ width: isMobile ? "100%" : "55%" }}>
          {/* Build Progress */}
          {isOwner && (
            <Paper
              sx={{
                p: isMobile ? 2 : 3,
                mb: isMobile ? 2 : 3,
                borderRadius: 2,
              }}
            >
              <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                Build Progress
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Slider
                  value={buildProgressValue ?? 0}
                  onChange={handleBuildProgressChange}
                  min={0}
                  max={100}
                  step={1}
                  sx={{ flex: 1, color: "#d4af37" }}
                  aria-label="Build Progress"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 40 }}
                >
                  {buildProgressValue ?? 0}%
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right", mt: 1 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={handleSaveBuildProgress}
                  disabled={
                    savingBuildProgress ||
                    buildProgressValue === vehicle?.buildProgress
                  }
                  sx={{
                    backgroundColor: "#d4af37",
                    color: "#0a0f2c",
                    "&:hover": { backgroundColor: "#e4bf47" },
                    fontSize: isMobile ? "0.95rem" : undefined,
                    py: isMobile ? 1 : undefined,
                  }}
                >
                  {savingBuildProgress ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Paper>
          )}

          {/* Tabs */}
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTab-root": {
                  color: "text.secondary",
                  fontSize: isMobile ? "0.95rem" : undefined,
                  minWidth: isMobile ? 90 : undefined,
                  "&.Mui-selected": {
                    color: "#d4af37",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#d4af37",
                },
              }}
            >
              <Tab label="Overview" />
              <Tab label="Specifications" />
              <Tab label="Build Timeline" />
              <Tab label="Fan Photos" />
              <Tab label="Wishlist" />
            </Tabs>

            {/* Tab Panels */}
            <Box sx={{ p: isMobile ? 1.5 : 3 }}>
              {selectedTab === 0 && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "body2" : "body1"}
                      paragraph
                      sx={{ flex: 1 }}
                    >
                      {vehicle.description}
                    </Typography>
                    {isOwner && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleEdit("description", vehicle.description)
                        }
                        sx={{ color: "#d4af37" }}
                      >
                        <Edit />
                      </IconButton>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "body1" : "h6"}
                      sx={{ flex: 1 }}
                    >
                      Modifications
                    </Typography>
                    {isOwner && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setTempModifications(vehicle.modifications || []);
                          handleEdit("modifications", vehicle.modifications);
                        }}
                        sx={{ color: "#d4af37" }}
                      >
                        <Edit />
                      </IconButton>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: isMobile ? 0.5 : 1,
                    }}
                  >
                    {(vehicle.modifications || []).map(
                      (mod: string, index: number) => (
                        <Chip
                          key={index}
                          label={mod}
                          sx={{
                            backgroundColor: "rgba(212, 175, 55, 0.1)",
                            color: "#d4af37",
                            fontSize: isMobile ? "0.85rem" : undefined,
                            height: isMobile ? 22 : 24,
                          }}
                        />
                      )
                    )}
                  </Box>
                </Box>
              )}

              {selectedTab === 1 && (
                <Box>
                  {isMobile ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Make
                          </Typography>
                          <Typography variant="body1">
                            {vehicle.make}
                          </Typography>
                        </Box>
                        {isOwner && (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit("make", vehicle.make)}
                            sx={{ color: "#d4af37" }}
                          >
                            <Edit />
                          </IconButton>
                        )}
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Model
                          </Typography>
                          <Typography variant="body1">
                            {vehicle.model}
                          </Typography>
                        </Box>
                        {isOwner && (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit("model", vehicle.model)}
                            sx={{ color: "#d4af37" }}
                          >
                            <Edit />
                          </IconButton>
                        )}
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Year
                          </Typography>
                          <Typography variant="body1">
                            {vehicle.year}
                          </Typography>
                        </Box>
                        {isOwner && (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit("year", vehicle.year)}
                            sx={{ color: "#d4af37" }}
                          >
                            <Edit />
                          </IconButton>
                        )}
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Horsepower
                          </Typography>
                          <Typography variant="body1">
                            {vehicle.horsepower} hp
                          </Typography>
                        </Box>
                        {isOwner && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleEdit("horsepower", vehicle.horsepower)
                            }
                            sx={{ color: "#d4af37" }}
                          >
                            <Edit />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Make
                            </Typography>
                            <Typography variant="body1">
                              {vehicle.make}
                            </Typography>
                          </Box>
                          {isOwner && (
                            <IconButton
                              size="small"
                              onClick={() => handleEdit("make", vehicle.make)}
                              sx={{ color: "#d4af37" }}
                            >
                              <Edit />
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Model
                            </Typography>
                            <Typography variant="body1">
                              {vehicle.model}
                            </Typography>
                          </Box>
                          {isOwner && (
                            <IconButton
                              size="small"
                              onClick={() => handleEdit("model", vehicle.model)}
                              sx={{ color: "#d4af37" }}
                            >
                              <Edit />
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Year
                            </Typography>
                            <Typography variant="body1">
                              {vehicle.year}
                            </Typography>
                          </Box>
                          {isOwner && (
                            <IconButton
                              size="small"
                              onClick={() => handleEdit("year", vehicle.year)}
                              sx={{ color: "#d4af37" }}
                            >
                              <Edit />
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Horsepower
                            </Typography>
                            <Typography variant="body1">
                              {vehicle.horsepower} hp
                            </Typography>
                          </Box>
                          {isOwner && (
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleEdit("horsepower", vehicle.horsepower)
                              }
                              sx={{ color: "#d4af37" }}
                            >
                              <Edit />
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}

              {selectedTab === 2 && (
                <Box>
                  <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                    Build Timeline
                    {isOwner && (
                      <Button
                        size="small"
                        sx={{
                          ml: 2,
                          color: "#d4af37",
                          fontSize: isMobile ? "0.95rem" : undefined,
                        }}
                        onClick={() => setAddTimelineOpen(true)}
                      >
                        Add
                      </Button>
                    )}
                  </Typography>
                  {timelineLoading ? (
                    <LinearProgress />
                  ) : (
                    <Timeline sx={{ pl: isMobile ? 0 : 2 }}>
                      {timelineItems.map((item) => (
                        <TimelineItem key={item.id}>
                          <TimelineSeparator>
                            <TimelineDot sx={{ bgcolor: "#d4af37" }} />
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant={isMobile ? "body2" : "h6"}>
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.date}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  )}
                </Box>
              )}

              {selectedTab === 3 && (
                <Box>
                  <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                    Fan Photos
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Photos taken by other users who spotted your vehicle
                    </Typography>
                  </Typography>

                  {fanPhotosLoading ? (
                    <LinearProgress />
                  ) : fanPhotos.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <PhotoLibrary
                        sx={{
                          fontSize: 64,
                          color: "rgba(255, 255, 255, 0.3)",
                          mb: 2,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No fan photos yet. When someone spots your vehicle and
                        sends an LPR invite, accepted photos will appear here!
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {isMobile ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          {fanPhotos.map((photo, index) => (
                            <Paper
                              key={photo.id}
                              sx={{
                                p: 2,
                                backgroundColor: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: 2,
                                cursor: "pointer",
                                "&:hover": {
                                  borderColor: "#d4af37",
                                  transform: "translateY(-2px)",
                                  transition: "all 0.3s ease",
                                },
                              }}
                              onClick={() => {
                                setSelectedFanPhoto(photo);
                                setFanPhotoModalOpen(true);
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 2,
                                }}
                              >
                                <Avatar
                                  src={photo.sender_profile?.avatar_url}
                                  sx={{ mr: 2, bgcolor: "#d4af37" }}
                                >
                                  {photo.sender_profile?.name?.[0] || "?"}
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#d4af37" }}
                                  >
                                    {photo.sender_profile?.name || "Unknown"}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {new Date(
                                      photo.created_at
                                    ).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Box>

                              <img
                                src={photo.image_url}
                                alt={`Fan photo ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: 200,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  marginBottom: 8,
                                }}
                              />

                              {photo.message && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 1 }}
                                >
                                  "{photo.message}"
                                </Typography>
                              )}
                            </Paper>
                          ))}
                        </Box>
                      ) : (
                        <Grid container spacing={2}>
                          {fanPhotos.map((photo, index) => (
                            <Grid item xs={12} sm={6} md={4} key={photo.id}>
                              <Paper
                                sx={{
                                  p: 2,
                                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  borderRadius: 2,
                                  cursor: "pointer",
                                  "&:hover": {
                                    borderColor: "#d4af37",
                                    transform: "translateY(-2px)",
                                    transition: "all 0.3s ease",
                                  },
                                }}
                                onClick={() => {
                                  setSelectedFanPhoto(photo);
                                  setFanPhotoModalOpen(true);
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 2,
                                  }}
                                >
                                  <Avatar
                                    src={photo.sender_profile?.avatar_url}
                                    sx={{ mr: 2, bgcolor: "#d4af37" }}
                                  >
                                    {photo.sender_profile?.name?.[0] || "?"}
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "#d4af37" }}
                                    >
                                      {photo.sender_profile?.name || "Unknown"}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {new Date(
                                        photo.created_at
                                      ).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                </Box>

                                <img
                                  src={photo.image_url}
                                  alt={`Fan photo ${index + 1}`}
                                  style={{
                                    width: "100%",
                                    height: 200,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    marginBottom: 8,
                                  }}
                                />

                                {photo.message && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                  >
                                    "{photo.message}"
                                  </Typography>
                                )}
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {selectedTab === 4 && (
                <Box>
                  <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                    Wishlist & To-Do Items
                    {isOwner && (
                      <Button
                        size="small"
                        startIcon={<Add />}
                        sx={{
                          ml: 2,
                          color: "#d4af37",
                          fontSize: isMobile ? "0.95rem" : undefined,
                        }}
                        onClick={() => setAddWishlistOpen(true)}
                      >
                        Add Item
                      </Button>
                    )}
                  </Typography>
                  {wishlistLoading ? (
                    <LinearProgress />
                  ) : wishlistItems.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ py: 4 }}
                    >
                      No wishlist items yet. {isOwner && "Add your first item!"}
                    </Typography>
                  ) : (
                    <List>
                      {wishlistItems.map((item) => (
                        <ListItem
                          key={item.id}
                          sx={{
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: 1,
                            mb: 1,
                            backgroundColor: item.completed
                              ? "rgba(76, 175, 80, 0.1)"
                              : "rgba(255, 255, 255, 0.02)",
                            opacity: item.completed ? 0.7 : 1,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ mt: 0.5 }}>
                            <Checkbox
                              checked={item.completed || false}
                              onChange={() =>
                                handleToggleWishlistComplete(
                                  item.id,
                                  item.completed || false
                                )
                              }
                              icon={
                                <CheckCircleOutline sx={{ fontSize: 24 }} />
                              }
                              checkedIcon={
                                <CheckCircle sx={{ fontSize: 24 }} />
                              }
                              sx={{
                                color: "#d4af37",
                                "&.Mui-checked": {
                                  color: "#4caf50",
                                },
                                p: 0,
                                "&:hover": {
                                  backgroundColor: "rgba(212, 175, 55, 0.1)",
                                  borderRadius: "50%",
                                },
                              }}
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                textDecoration: item.completed
                                  ? "line-through"
                                  : "none",
                                color: item.completed
                                  ? "text.secondary"
                                  : "text.primary",
                                fontWeight: item.completed
                                  ? "normal"
                                  : "medium",
                                mb: 1,
                              }}
                            >
                              {item.title}
                            </Typography>

                            {item.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {item.description}
                              </Typography>
                            )}

                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Chip
                                label={item.priority}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    item.priority === "high"
                                      ? "rgba(244, 67, 54, 0.2)"
                                      : item.priority === "medium"
                                      ? "rgba(255, 152, 0, 0.2)"
                                      : "rgba(76, 175, 80, 0.2)",
                                  color:
                                    item.priority === "high"
                                      ? "#f44336"
                                      : item.priority === "medium"
                                      ? "#ff9800"
                                      : "#4caf50",
                                  fontSize: "0.75rem",
                                }}
                              />
                              {item.estimated_cost && (
                                <Chip
                                  label={`$${item.estimated_cost}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: "rgba(212, 175, 55, 0.2)",
                                    color: "#d4af37",
                                    fontSize: "0.75rem",
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          {isOwner && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => setEditingWishlist(item)}
                                sx={{ color: "#d4af37" }}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDeleteWishlistItem(item.id)
                                }
                                sx={{ color: "#f44336" }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Box>
          </Paper>

          {/* Social Actions */}
          <Box
            sx={{
              display: "flex",
              gap: isMobile ? 1 : 2,
              mt: 3,
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}
          >
            <Button
              startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
              onClick={handleLikeToggle}
              disabled={liking || !user}
              sx={{
                color: isLiked ? "#d4af37" : "text.secondary",
                fontSize: isMobile ? "0.95rem" : undefined,
                "&:hover": {
                  color: isLiked ? "#e4bf47" : "#d4af37",
                },
              }}
            >
              {liking
                ? "..."
                : `${likesCount} Like${likesCount === 1 ? "" : "s"}`}
            </Button>
            <Button
              startIcon={<Comment />}
              sx={{
                color: "text.secondary",
                fontSize: isMobile ? "0.95rem" : undefined,
              }}
            >
              {commentCount} Comment{commentCount === 1 ? "" : "s"}
            </Button>
            <Button
              startIcon={<Share />}
              sx={{
                color: "text.secondary",
                fontSize: isMobile ? "0.95rem" : undefined,
              }}
            >
              Share
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit{" "}
          {editField
            ? editField.charAt(0).toUpperCase() + editField.slice(1)
            : ""}
        </DialogTitle>
        <DialogContent>
          {editField === "modifications" ? (
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={tempModifications}
              onChange={(event, newValue) => setTempModifications(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Modifications"
                  placeholder="Add modifications"
                  fullWidth
                  sx={{ mt: 2 }}
                />
              )}
            />
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label={
                editField
                  ? editField.charAt(0).toUpperCase() + editField.slice(1)
                  : ""
              }
              type={
                editField === "year" || editField === "horsepower"
                  ? "number"
                  : "text"
              }
              fullWidth
              variant="outlined"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              multiline={editField === "description"}
              rows={editField === "description" ? 4 : 1}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} sx={{ color: "text.secondary" }}>
            Cancel
          </Button>
          <Button onClick={handleSave} sx={{ color: "#d4af37" }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comments Section */}
      <VehicleComments
        vehicleId={vehicle.id}
        onCommentChange={(newCount) => setCommentCount(newCount)}
      />

      {/* Add Timeline Dialog */}
      <Dialog open={addTimelineOpen} onClose={() => setAddTimelineOpen(false)}>
        <DialogTitle>Add Timeline Item</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            value={newTimeline.title}
            onChange={(e) =>
              setNewTimeline({ ...newTimeline, title: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newTimeline.description}
            onChange={(e) =>
              setNewTimeline({ ...newTimeline, description: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newTimeline.date}
            onChange={(e) =>
              setNewTimeline({ ...newTimeline, date: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTimelineOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddTimeline}
            disabled={addingTimeline}
            sx={{ color: "#d4af37" }}
          >
            {addingTimeline ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Wishlist Item Dialog */}
      <Dialog open={addWishlistOpen} onClose={() => setAddWishlistOpen(false)}>
        <DialogTitle>Add Wishlist Item</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            value={newWishlistItem.title}
            onChange={(e) =>
              setNewWishlistItem({ ...newWishlistItem, title: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newWishlistItem.description}
            onChange={(e) =>
              setNewWishlistItem({
                ...newWishlistItem,
                description: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={["high", "medium", "low"]}
            value={newWishlistItem.priority}
            onChange={(event, newValue) =>
              setNewWishlistItem({
                ...newWishlistItem,
                priority: newValue || "medium",
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Priority"
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />
          <TextField
            label="Estimated Cost ($)"
            type="number"
            fullWidth
            value={newWishlistItem.estimated_cost}
            onChange={(e) =>
              setNewWishlistItem({
                ...newWishlistItem,
                estimated_cost: e.target.value,
              })
            }
            InputProps={{
              startAdornment: <Typography>$</Typography>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWishlistOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddWishlistItem}
            disabled={addingWishlist || !newWishlistItem.title.trim()}
            sx={{ color: "#d4af37" }}
          >
            {addingWishlist ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Wishlist Item Dialog */}
      <Dialog open={!!editingWishlist} onClose={() => setEditingWishlist(null)}>
        <DialogTitle>Edit Wishlist Item</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            value={editingWishlist?.title || ""}
            onChange={(e) =>
              setEditingWishlist({
                ...editingWishlist,
                title: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editingWishlist?.description || ""}
            onChange={(e) =>
              setEditingWishlist({
                ...editingWishlist,
                description: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={["high", "medium", "low"]}
            value={editingWishlist?.priority || "medium"}
            onChange={(event, newValue) =>
              setEditingWishlist({
                ...editingWishlist,
                priority: newValue || "medium",
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Priority"
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />
          <TextField
            label="Estimated Cost ($)"
            type="number"
            fullWidth
            value={editingWishlist?.estimated_cost || ""}
            onChange={(e) =>
              setEditingWishlist({
                ...editingWishlist,
                estimated_cost: e.target.value,
              })
            }
            InputProps={{
              startAdornment: <Typography>$</Typography>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingWishlist(null)}>Cancel</Button>
          <Button
            onClick={handleEditWishlistItem}
            disabled={!editingWishlist?.title?.trim()}
            sx={{ color: "#d4af37" }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fan Photo Modal */}
      <Dialog
        open={fanPhotoModalOpen}
        onClose={() => setFanPhotoModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={selectedFanPhoto?.sender_profile?.avatar_url}
              sx={{ bgcolor: "#d4af37" }}
            >
              {selectedFanPhoto?.sender_profile?.name?.[0] || "?"}
            </Avatar>
            <Box>
              <Typography variant="h6">
                Photo by {selectedFanPhoto?.sender_profile?.name || "Unknown"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedFanPhoto?.created_at &&
                  new Date(selectedFanPhoto.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <img
              src={selectedFanPhoto?.image_url}
              alt="Fan photo"
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          </Box>
          {selectedFanPhoto?.message && (
            <Typography
              variant="body1"
              sx={{ fontStyle: "italic", textAlign: "center" }}
            >
              "{selectedFanPhoto.message}"
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFanPhotoModalOpen(false)}
            sx={{ color: "#d4af37" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* License Plate Section - Only visible to owner */}
      {isOwner && (
        <Grid item xs={12} sm={6}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 2,
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              gutterBottom
              sx={{ color: "#d4af37", mb: 2 }}
            >
              License Plate (Private)
            </Typography>

            {editingLicense ? (
              <Box>
                <TextField
                  label="License Plate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  placeholder="ABC123"
                />
                <TextField
                  label="State"
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  placeholder="CA"
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveLicense}
                    disabled={savingLicense}
                    sx={{
                      backgroundColor: "#d4af37",
                      "&:hover": { backgroundColor: "#b8941f" },
                    }}
                  >
                    {savingLicense ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditingLicense(false);
                      setLicensePlate(vehicle?.license_plate || "");
                      setLicenseState(vehicle?.license_state || "");
                    }}
                    sx={{ borderColor: "#d4af37", color: "#d4af37" }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Plate:</strong> {licensePlate || "Not set"}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>State:</strong> {licenseState || "Not set"}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setEditingLicense(true)}
                  sx={{ borderColor: "#d4af37", color: "#d4af37" }}
                >
                  Edit License Plate
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      )}
    </Box>
  );
};
