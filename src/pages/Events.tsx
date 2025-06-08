import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
} from "@mui/material";
import { CalendarMonth, LocationOn, People } from "@mui/icons-material";

const mockEvents = [
  {
    id: 1,
    title: "Summer Car Meet 2024",
    date: "June 15, 2024",
    location: "Central Park, New York",
    image: "https://source.unsplash.com/random/800x600/?car-meet",
    attendees: 156,
    type: "Car Meet",
  },
  {
    id: 2,
    title: "Track Day Experience",
    date: "July 20, 2024",
    location: "Laguna Seca Raceway",
    image: "https://source.unsplash.com/random/800x600/?race-track",
    attendees: 89,
    type: "Track Day",
  },
  {
    id: 3,
    title: "Classic Car Show",
    date: "August 5, 2024",
    location: "Downtown Convention Center",
    image: "https://source.unsplash.com/random/800x600/?classic-car",
    attendees: 234,
    type: "Car Show",
  },
];

export const Events = () => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upcoming Events
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and join car events in your area
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {mockEvents.map((event) => (
          <Grid item xs={12} md={4} key={event.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={event.image}
                alt={event.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Chip
                  label={event.type}
                  size="small"
                  sx={{ mb: 1 }}
                  color="primary"
                />
                <Typography variant="h6" component="h2" gutterBottom>
                  {event.title}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <CalendarMonth sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.date}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.location}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <People sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.attendees} attendees
                  </Typography>
                </Box>
                <Button variant="contained" fullWidth>
                  RSVP Now
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
