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
} from "@mui/material";
import { CalendarMonth, LocationOn, People, Add } from "@mui/icons-material";
import { supabase } from "../services/supabase/client";
import { AddEventForm } from "../components/events/AddEventForm";
import { EventRSVP } from "../components/events/EventRSVP";
import { useNavigate } from "react-router-dom";

export const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addEventOpen, setAddEventOpen] = useState(false);
  const navigate = useNavigate();

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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Error Loading Events</Typography>
          <Typography variant="body2">{error}</Typography>
          <Button onClick={fetchEvents} sx={{ mt: 2 }} variant="outlined">
            Try Again
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Upcoming Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover and join car events in your area
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddEventOpen(true)}
          sx={{
            backgroundColor: "#d4af37",
            color: "#0a0f2c",
            "&:hover": { backgroundColor: "#e4bf47" },
          }}
        >
          Create Event
        </Button>
      </Box>

      {events.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No events found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Be the first to create an event!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
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
                }}
                onClick={() => handleEventClick(event.id)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={
                    event.image_url ||
                    "https://source.unsplash.com/random/800x600/?car-meet"
                  }
                  alt={event.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Chip
                    label={event.type}
                    size="small"
                    sx={{ mb: 1 }}
                    color="primary"
                  />
                  <Typography gutterBottom variant="h5" component="h2">
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {event.description}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <CalendarMonth sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2">
                      {new Date(event.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2">{event.location}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <People sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2">
                      {event.attendees?.[0]?.count || 0} attendees
                      {event.max_attendees && ` / ${event.max_attendees} max`}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
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
