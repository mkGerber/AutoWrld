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
  Share,
  Comment,
  ArrowBack,
  Edit,
  Delete,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/supabase/client";
import VehicleComments from "../components/vehicle/VehicleComments";

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

  useEffect(() => {
    const fetchVehicle = async () => {
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

      setVehicle({ ...vehicleData, owner });
      setLoading(false);
    };
    fetchVehicle();
  }, [id, navigate]);

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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/garage")}
          sx={{ mb: 2, color: "#d4af37" }}
        >
          Back to Garage
        </Button>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h4" component="h1" sx={{ color: "#d4af37" }}>
                {vehicle.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleEdit("name", vehicle.name)}
                sx={{ color: "#d4af37" }}
              >
                <Edit />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Avatar src={owner.avatar_url} sx={{ mr: 1 }} />
              <Typography variant="subtitle1" color="text.secondary">
                {owner.name}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={statusLabel}
            sx={{
              backgroundColor: statusColor,
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Box>
      </Box>

      {/* Main Content Split */}
      <Box sx={{ display: "flex", gap: 4, flex: 1 }}>
        {/* Left Side - Image Gallery */}
        <Box
          sx={{
            width: "45%",
            position: "sticky",
            top: 24,
            height: "fit-content",
          }}
        >
          <Paper
            sx={{
              position: "relative",
              height: "600px",
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
            }}
          >
            <CardMedia
              component="img"
              image={reversedImages[selectedImage]}
              alt={vehicle.name}
              sx={{ height: "100%", objectFit: "cover" }}
            />
          </Paper>
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
            }}
          >
            {reversedImages.map((image, index) => (
              <Box
                key={index}
                sx={{
                  width: 100,
                  height: 100,
                  flexShrink: 0,
                  cursor: "pointer",
                  border:
                    selectedImage === index ? "2px solid #d4af37" : "none",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image}
                  alt={`${vehicle.name} thumbnail ${index + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right Side - Information */}
        <Box sx={{ width: "55%" }}>
          {/* Build Progress */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
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
                }}
              >
                {savingBuildProgress ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTab-root": {
                  color: "text.secondary",
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
              <Tab label="Gallery" />
            </Tabs>

            {/* Tab Panels */}
            <Box sx={{ p: 3 }}>
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
                    <Typography variant="body1" paragraph sx={{ flex: 1 }}>
                      {vehicle.description}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleEdit("description", vehicle.description)
                      }
                      sx={{ color: "#d4af37" }}
                    >
                      <Edit />
                    </IconButton>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      Modifications
                    </Typography>
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
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {(vehicle.modifications || []).map(
                      (mod: string, index: number) => (
                        <Chip
                          key={index}
                          label={mod}
                          sx={{
                            backgroundColor: "rgba(212, 175, 55, 0.1)",
                            color: "#d4af37",
                          }}
                        />
                      )
                    )}
                  </Box>
                </Box>
              )}

              {selectedTab === 1 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid component="div" xs={6}>
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
                        <IconButton
                          size="small"
                          onClick={() => handleEdit("make", vehicle.make)}
                          sx={{ color: "#d4af37" }}
                        >
                          <Edit />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid component="div" xs={6}>
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
                        <IconButton
                          size="small"
                          onClick={() => handleEdit("model", vehicle.model)}
                          sx={{ color: "#d4af37" }}
                        >
                          <Edit />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid component="div" xs={6}>
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
                        <IconButton
                          size="small"
                          onClick={() => handleEdit("year", vehicle.year)}
                          sx={{ color: "#d4af37" }}
                        >
                          <Edit />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid component="div" xs={6}>
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
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleEdit("horsepower", vehicle.horsepower)
                          }
                          sx={{ color: "#d4af37" }}
                        >
                          <Edit />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {selectedTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Build Timeline
                    <Button
                      size="small"
                      sx={{ ml: 2, color: "#d4af37" }}
                      onClick={() => setAddTimelineOpen(true)}
                    >
                      Add
                    </Button>
                  </Typography>
                  {timelineLoading ? (
                    <LinearProgress />
                  ) : (
                    <Timeline>
                      {timelineItems.map((item) => (
                        <TimelineItem key={item.id}>
                          <TimelineSeparator>
                            <TimelineDot sx={{ bgcolor: "#d4af37" }} />
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant="h6">{item.title}</Typography>
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
                  <Grid container spacing={2}>
                    {reversedImages.map((image: string, index: number) => (
                      <Grid component="div" xs={12} sm={6} md={4} key={index}>
                        <Paper
                          sx={{
                            height: 200,
                            overflow: "hidden",
                            cursor: "pointer",
                            "&:hover": {
                              transform: "scale(1.02)",
                              transition: "transform 0.2s",
                            },
                          }}
                          onClick={() => setSelectedImage(index)}
                        >
                          <img
                            src={image}
                            alt={`${vehicle.name} gallery ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Social Actions */}
          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button startIcon={<Favorite />} sx={{ color: "text.secondary" }}>
              245 Likes
            </Button>
            <Button startIcon={<Comment />} sx={{ color: "text.secondary" }}>
              {commentCount} Comment{commentCount === 1 ? "" : "s"}
            </Button>
            <Button startIcon={<Share />} sx={{ color: "text.secondary" }}>
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
      <VehicleComments vehicleId={vehicle.id} />

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
    </Box>
  );
};
