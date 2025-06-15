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
  Tabs,
  Tab,
  Card,
  CardMedia,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  CalendarMonth,
  LocationOn,
  People,
  Share,
  Comment,
  ArrowBack,
  Edit,
  Delete,
  Favorite,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/supabase/client";
import { useAuth } from "../context/AuthContext";
import { EventRSVP } from "../components/events/EventRSVP";

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
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const EventDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        // Fetch event with creator profile
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(
            `
            *,
            created_by:profiles(name, avatar_url)
          `
          )
          .eq("id", id)
          .single();

        if (eventError) throw eventError;

        // Fetch attendee count
        const { count, error: countError } = await supabase
          .from("event_attendees")
          .select("*", { count: "exact", head: true })
          .eq("event_id", id);

        if (countError) throw countError;

        setEvent({
          ...eventData,
          attendees: [{ count: count || 0 }],
        });

        // Fetch attendee details
        const { data: attendeeData, error: attendeeError } = await supabase
          .from("event_attendees")
          .select(
            `
            *,
            user:profiles!inner(name, avatar_url)
          `
          )
          .eq("event_id", id)
          .eq("status", "attending")
          .order("created_at", { ascending: true });

        if (attendeeError) throw attendeeError;
        setAttendees(attendeeData || []);
      } catch (error) {
        console.error("Error fetching event:", error);
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleEdit = (field: string, value: any) => {
    setEditField(field);
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editField || !event) return;

    try {
      const { error } = await supabase
        .from("events")
        .update({ [editField]: editValue })
        .eq("id", event.id);

      if (error) throw error;

      setEvent({ ...event, [editField]: editValue });
      setIsEditing(false);
      setEditField(null);
      setEditValue(null);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

      if (error) throw error;

      navigate("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!event) return null;

  const isCreator =
    user?.id && event.created_by?.id ? user.id === event.created_by.id : false;

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
          onClick={() => navigate("/events")}
          sx={{
            mb: 2,
            color: "#d4af37",
            fontSize: isMobile ? "1rem" : "1.1rem",
          }}
        >
          Back to Events
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
                {event.title}
              </Typography>
              {isCreator && (
                <IconButton
                  size="small"
                  onClick={() => handleEdit("title", event.title)}
                  sx={{ color: "#d4af37" }}
                >
                  <Edit />
                </IconButton>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Avatar
                src={event.created_by?.avatar_url}
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
                {event.created_by?.name || "Unknown Creator"}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={event.type}
            sx={{
              backgroundColor: "#d4af37",
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
        {/* Left Side - Event Image */}
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
              backgroundColor: "rgba(0, 0, 0, 0.1)",
            }}
          >
            <CardMedia
              component="img"
              image={
                event.image_url ||
                "https://source.unsplash.com/random/800x600/?car-meet"
              }
              alt={event.title}
              sx={{
                maxHeight: "60vh",
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                background: "#181c2f",
                margin: "0 auto",
                display: "block",
                p: 2,
              }}
            />
          </Paper>
        </Box>

        {/* Right Side - Information */}
        <Box sx={{ width: isMobile ? "100%" : "55%" }}>
          {/* Event Details */}
          <Paper
            sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3, borderRadius: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CalendarMonth
                sx={{
                  mr: 1,
                  color: "text.secondary",
                  fontSize: isMobile ? 18 : 24,
                }}
              />
              <Typography variant={isMobile ? "body2" : "body1"}>
                {new Date(event.date).toLocaleDateString()} at{" "}
                {new Date(event.date).toLocaleTimeString()}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <LocationOn
                sx={{
                  mr: 1,
                  color: "text.secondary",
                  fontSize: isMobile ? 18 : 24,
                }}
              />
              <Typography variant={isMobile ? "body2" : "body1"}>
                {event.location}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <People
                sx={{
                  mr: 1,
                  color: "text.secondary",
                  fontSize: isMobile ? 18 : 24,
                }}
              />
              <Typography variant={isMobile ? "body2" : "body1"}>
                {event.attendees?.[0]?.count || 0} attendees
                {event.max_attendees && ` / ${event.max_attendees} max`}
              </Typography>
            </Box>
            <EventRSVP
              eventId={event.id}
              maxAttendees={event.max_attendees}
              currentAttendees={event.attendees?.[0]?.count || 0}
              onSuccess={() => {
                // Refresh event data
                fetchEvent();
              }}
            />
          </Paper>

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
              <Tab label="Attendees" />
              <Tab label="Comments" />
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
                      {event.description}
                    </Typography>
                    {isCreator && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleEdit("description", event.description)
                        }
                        sx={{ color: "#d4af37" }}
                      >
                        <Edit />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              )}

              {selectedTab === 1 && (
                <Box>
                  <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                    Event Attendees
                  </Typography>
                  {attendees.length === 0 ? (
                    <Typography color="text.secondary">
                      No attendees yet. Be the first to RSVP!
                    </Typography>
                  ) : (
                    <Grid container spacing={isMobile ? 1 : 2}>
                      {attendees.map((attendee) => (
                        <Grid item xs={12} sm={6} md={4} key={attendee.id}>
                          <Paper
                            sx={{
                              p: isMobile ? 1.5 : 2,
                              display: "flex",
                              alignItems: "center",
                              gap: isMobile ? 1 : 2,
                            }}
                          >
                            <Avatar
                              src={attendee.user?.avatar_url}
                              alt={attendee.user?.name || "Unknown User"}
                              sx={{
                                width: isMobile ? 36 : 48,
                                height: isMobile ? 36 : 48,
                              }}
                            />
                            <Box>
                              <Typography
                                variant={isMobile ? "body2" : "subtitle1"}
                              >
                                {attendee.user?.name || "Unknown User"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: isMobile ? "0.9rem" : undefined,
                                }}
                              >
                                Joined{" "}
                                {new Date(
                                  attendee.created_at
                                ).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}

              {selectedTab === 2 && (
                <Box>
                  <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                    Comments
                  </Typography>
                  {/* TODO: Add comments section */}
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
              startIcon={<Favorite />}
              sx={{
                color: "text.secondary",
                fontSize: isMobile ? "0.95rem" : undefined,
              }}
            >
              Like
            </Button>
            <Button
              startIcon={<Comment />}
              sx={{
                color: "text.secondary",
                fontSize: isMobile ? "0.95rem" : undefined,
              }}
            >
              Comment
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
            {isCreator && (
              <Button
                startIcon={<Delete />}
                sx={{
                  color: "error.main",
                  fontSize: isMobile ? "0.95rem" : undefined,
                }}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Event
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit{" "}
          {editField
            ? editField.charAt(0).toUpperCase() + editField.slice(1)
            : ""}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={
              editField
                ? editField.charAt(0).toUpperCase() + editField.slice(1)
                : ""
            }
            fullWidth
            variant="outlined"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            multiline={editField === "description"}
            rows={editField === "description" ? 4 : 1}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsEditing(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} sx={{ color: "#d4af37" }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button onClick={handleDelete} sx={{ color: "error.main" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
