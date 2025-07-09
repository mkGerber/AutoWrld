import { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  CircularProgress,
  Alert,
  CardActions,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  CalendarMonth,
  LocationOn,
  People,
  Add,
  Lock as LockIcon,
} from "@mui/icons-material";
import { supabase } from "../services/supabase/client";
import { AddEventForm } from "../components/events/AddEventForm";
import { EventRSVP } from "../components/events/EventRSVP";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIconImg from "../assets/Map-marker.png";

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

export const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [mapView, setMapView] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events with creator profiles
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(
          `
          *,
          created_by:profiles(name, avatar_url)
        `
        )
        .order("date", { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch attendee counts for all events
      const { data: attendeeCounts, error: countsError } = await supabase
        .from("event_attendees")
        .select("event_id")
        .in(
          "event_id",
          eventsData.map((event) => event.id)
        );

      if (countsError) throw countsError;

      // Count attendees for each event
      const attendeeCountMap =
        attendeeCounts?.reduce((acc, curr) => {
          acc[curr.event_id] = (acc[curr.event_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      // Combine the data
      const eventsWithCounts = eventsData.map((event) => ({
        ...event,
        attendees: [
          {
            count: attendeeCountMap[event.id] || 0,
          },
        ],
      }));

      setEvents(eventsWithCounts);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: isMobile ? 2 : 4,
          px: isMobile ? 2 : 0,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: isMobile ? 2 : 4, px: isMobile ? 2 : 0 }}>
        <Alert severity="error">
          <Typography variant={isMobile ? "h6" : "h5"}>
            Error Loading Events
          </Typography>
          <Typography variant="body2">{error}</Typography>
          <Button onClick={fetchEvents} sx={{ mt: 2 }} variant="outlined">
            Try Again
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: isMobile ? 0.5 : 0 }}>
      <Box
        sx={{
          mb: isMobile ? 2 : 4,
          display: isMobile ? "block" : "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 2 : 0,
        }}
      >
        <Box sx={{ mb: isMobile ? 2 : 0 }}>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            gutterBottom
          >
            Upcoming Events
          </Typography>
          <Typography
            variant={isMobile ? "body2" : "body1"}
            color="text.secondary"
          >
            Discover and join car events in your area
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: isMobile ? 1 : 2,
            flexDirection: isMobile ? "column" : "row",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Button
            variant={mapView ? "outlined" : "contained"}
            onClick={() => setMapView(false)}
            sx={{
              backgroundColor: !mapView
                ? theme.palette.primary.main
                : undefined,
              color: !mapView ? theme.palette.primary.contrastText : undefined,
              "&:hover": {
                backgroundColor: !mapView
                  ? theme.palette.primary.dark || theme.palette.primary.main
                  : undefined,
              },
              minWidth: isMobile ? "100%" : 120,
              fontSize: isMobile ? "1rem" : "1.1rem",
              py: isMobile ? 1.2 : 1.5,
            }}
          >
            List View
          </Button>
          <Button
            variant={mapView ? "contained" : "outlined"}
            onClick={() => setMapView(true)}
            sx={{
              backgroundColor: mapView ? theme.palette.primary.main : undefined,
              color: mapView ? theme.palette.primary.contrastText : undefined,
              "&:hover": {
                backgroundColor: mapView
                  ? theme.palette.primary.dark || theme.palette.primary.main
                  : undefined,
              },
              minWidth: isMobile ? "100%" : 120,
              fontSize: isMobile ? "1rem" : "1.1rem",
              py: isMobile ? 1.2 : 1.5,
            }}
          >
            Map View
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddEventOpen(true)}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor:
                  theme.palette.primary.dark || theme.palette.primary.main,
              },
              minWidth: isMobile ? "100%" : 140,
              fontSize: isMobile ? "1rem" : "1.1rem",
              py: isMobile ? 1.2 : 1.5,
            }}
          >
            Create Event
          </Button>
        </Box>
      </Box>

      {mapView ? (
        <Box
          sx={{
            height: isMobile ? 300 : 500,
            width: "100%",
            mb: isMobile ? 2 : 4,
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: 2,
          }}
        >
          <MapContainer
            center={[37.0902, -95.7129]}
            zoom={4}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {events
              .filter((e) => e.latitude && e.longitude)
              .map((event) => (
                <Marker
                  key={event.id}
                  position={[event.latitude, event.longitude]}
                  icon={customIcon}
                >
                  <Popup>
                    <strong>{event.title}</strong>
                    <br />
                    {event.location}
                    <br />
                    <Button
                      size="small"
                      onClick={() => handleEventClick(event.id)}
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: isMobile ? 2 : 4 }}>
          <Typography variant={isMobile ? "h6" : "h5"} color="text.secondary">
            No events found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Be the first to create an event!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={isMobile ? 2 : 3}>
          {events.map((event) => (
            <Grid
              item
              key={event.id}
              xs={12}
              sm={6}
              md={4}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <Card
                sx={{
                  width: 320,
                  height: 420,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "stretch",
                  boxShadow: 3,
                  borderRadius: 3,
                  background: theme.palette.background.paper,
                  transition: "transform 0.2s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
                onClick={() => handleEventClick(event.id)}
              >
                {event.image_url ? (
                  <CardMedia
                    component="img"
                    sx={{
                      height: 140,
                      width: 320,
                      objectFit: "cover",
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                    image={event.image_url}
                    alt={event.title}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 140,
                      width: 320,
                      background: theme.palette.background.default,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                      color: theme.palette.text.secondary,
                      fontSize: 24,
                      fontWeight: 500,
                      letterSpacing: 1,
                    }}
                  >
                    No Image
                  </Box>
                )}
                <CardContent
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 0,
                    p: 2,
                  }}
                >
                  <Box
                    sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}
                  >
                    <Chip
                      label={event.type}
                      size="small"
                      sx={{ fontSize: "0.9rem", height: 22 }}
                      color="primary"
                    />
                    {event.group_chat_id && (
                      <Chip
                        label="Private"
                        size="small"
                        icon={<LockIcon />}
                        sx={{
                          fontSize: "0.9rem",
                          height: 22,
                          backgroundColor: theme.palette.warning.main,
                          color: theme.palette.warning.contrastText,
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="h2"
                    sx={{ color: theme.palette.text.primary, fontWeight: 700 }}
                  >
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {event.description}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <CalendarMonth sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(event.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.location}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <People sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.attendees?.[0]?.count || 0} attendees
                      {event.max_attendees && ` / ${event.max_attendees} max`}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 1 }}>
                  <EventRSVP
                    eventId={event.id}
                    maxAttendees={event.max_attendees}
                    currentAttendees={event.attendees?.[0]?.count || 0}
                    onSuccess={() => {
                      fetchEvents();
                    }}
                  />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <AddEventForm
        open={addEventOpen}
        onClose={() => setAddEventOpen(false)}
        onSuccess={fetchEvents}
      />
    </Box>
  );
};
