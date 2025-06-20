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
import { CalendarMonth, LocationOn, People, Add } from "@mui/icons-material";
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
              backgroundColor: !mapView ? "#d4af37" : undefined,
              color: !mapView ? "#0a0f2c" : undefined,
              "&:hover": { backgroundColor: !mapView ? "#e4bf47" : undefined },
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
              backgroundColor: mapView ? "#d4af37" : undefined,
              color: mapView ? "#0a0f2c" : undefined,
              "&:hover": { backgroundColor: mapView ? "#e4bf47" : undefined },
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
              backgroundColor: "#d4af37",
              color: "#0a0f2c",
              "&:hover": { backgroundColor: "#e4bf47" },
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
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    transition: "transform 0.2s ease-in-out",
                  },
                  minHeight: isMobile ? 320 : 380,
                }}
                onClick={() => handleEventClick(event.id)}
              >
                <CardMedia
                  component="img"
                  height={isMobile ? "140" : "200"}
                  image={
                    event.image_url ||
                    "https://source.unsplash.com/random/800x600/?car-meet"
                  }
                  alt={event.title}
                />
                <CardContent sx={{ flexGrow: 1, p: isMobile ? 1.5 : 2 }}>
                  <Chip
                    label={event.type}
                    size="small"
                    sx={{
                      mb: 1,
                      fontSize: isMobile ? "0.9rem" : undefined,
                      height: isMobile ? 22 : 24,
                    }}
                    color="primary"
                  />
                  <Typography
                    gutterBottom
                    variant={isMobile ? "h6" : "h5"}
                    component="h2"
                  >
                    {event.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{ fontSize: isMobile ? "0.97rem" : undefined }}
                  >
                    {event.description}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <CalendarMonth
                      sx={{
                        mr: 1,
                        color: "text.secondary",
                        fontSize: isMobile ? 18 : 24,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontSize: isMobile ? "0.97rem" : undefined }}
                    >
                      {new Date(event.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <LocationOn
                      sx={{
                        mr: 1,
                        color: "text.secondary",
                        fontSize: isMobile ? 18 : 24,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontSize: isMobile ? "0.97rem" : undefined }}
                    >
                      {event.location}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <People
                      sx={{
                        mr: 1,
                        color: "text.secondary",
                        fontSize: isMobile ? 18 : 24,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontSize: isMobile ? "0.97rem" : undefined }}
                    >
                      {event.attendees?.[0]?.count || 0} attendees
                      {event.max_attendees && ` / ${event.max_attendees} max`}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: isMobile ? 1 : undefined }}>
                  <EventRSVP
                    eventId={event.id}
                    maxAttendees={event.max_attendees}
                    currentAttendees={event.attendees?.[0]?.count || 0}
                    onSuccess={() => {
                      // Refresh events list
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
