import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Container,
  Avatar,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  DirectionsCar,
  Event,
  Build,
  ArrowForward,
  TrendingUp,
  Star,
  Favorite,
  Comment,
  Share,
  CalendarMonth,
  LocationOn,
  People,
} from "@mui/icons-material";
// @ts-ignore
import highlightImage from "../assets/Home/highlight.JPG";

const featuredVehicles = [
  {
    id: 1,
    name: "Project RX-7",
    owner: "John Doe",
    image: "https://source.unsplash.com/random/800x600/?mazda-rx7",
    likes: 245,
    comments: 32,
    modifications: ["Turbo", "Coilovers", "Widebody"],
  },
  {
    id: 2,
    name: "Civic Type R",
    owner: "Jane Smith",
    image: "https://source.unsplash.com/random/800x600/?honda-civic",
    likes: 189,
    comments: 24,
    modifications: ["Intake", "Exhaust", "Tune"],
  },
  {
    id: 3,
    name: "Supra MK4",
    owner: "Mike Johnson",
    image: "https://source.unsplash.com/random/800x600/?toyota-supra",
    likes: 312,
    comments: 45,
    modifications: ["Single Turbo", "Built Engine", "Drag Setup"],
  },
];

const trendingTopics = [
  "JDM",
  "Euro",
  "Muscle",
  "Classic",
  "Drift",
  "Drag",
  "Show Car",
  "Track Build",
];

export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileChecked, setProfileChecked] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, bio")
          .eq("id", user.id)
          .maybeSingle();
        if (!data || !data.username || !data.bio) {
          navigate("/setup-profile", { replace: true });
        } else {
          setProfileChecked(true);
        }
      }
    };
    checkProfile();
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch upcoming events
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select(
            `
            *,
            created_by:profiles(name, avatar_url)
          `
          )
          .gte("date", new Date().toISOString())
          .order("date", { ascending: true })
          .limit(2);

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

        setUpcomingEvents(eventsWithCounts);

        // Fetch recent vehicles with owner profiles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from("vehicles")
          .select(
            `
            *,
            user:profiles!user_id(name, avatar_url)
          `
          )
          .order("created_at", { ascending: false })
          .limit(3);

        if (vehiclesError) throw vehiclesError;

        // Transform vehicle data
        const transformedVehicles = vehiclesData.map((vehicle) => {
          // Parse images
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

          // Get the first image or use a fallback
          const imageSrc =
            Array.isArray(parsedImages) && parsedImages.length > 0
              ? parsedImages[0].replace(/^\["|"\]$/g, "") // Remove [" and "] if present
              : "https://source.unsplash.com/random/800x600/?car";

          return {
            id: vehicle.id,
            name: vehicle.name,
            owner: vehicle.user?.name || "Anonymous",
            image: imageSrc,
            likes: vehicle.likes_count || 0, // Use real likes count from database
            comments: 0, // TODO: Implement comments system
            modifications: vehicle.modifications || [],
          };
        });

        setFeaturedVehicles(transformedVehicles);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!profileChecked) {
    // Prevents any data fetching or rendering until profile is confirmed
    return null; // or a loading spinner
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          height: 400,
          borderRadius: 4,
          overflow: "hidden",
          mb: 6,
        }}
      >
        <CardMedia
          component="img"
          image={highlightImage}
          alt="Car Meet"
          sx={{
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.7)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 4,
            background: "linear-gradient(transparent, rgba(0, 0, 0, 0.8))",
            color: "white",
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Gearly
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Connect with car enthusiasts, share your builds, and join events
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              backgroundColor: "#d4af37",
              color: "#0a0f2c",
              "&:hover": { backgroundColor: "#e4bf47" },
            }}
            onClick={() => navigate("/events")}
          >
            Explore Events
          </Button>
        </Box>
      </Box>

      {/* Featured Vehicles Section */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{ color: "#d4af37", mb: 3 }}
        >
          Featured Vehicles
        </Typography>
        <Grid container spacing={3}>
          {featuredVehicles.map((vehicle) => (
            <Grid key={vehicle.id} item xs={12} md={4}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
                onClick={() => navigate(`/vehicle/${vehicle.id}`)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={vehicle.image}
                  alt={vehicle.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {vehicle.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Owner: {vehicle.owner}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {vehicle.modifications.map((mod, index) => (
                      <Chip
                        key={index}
                        label={mod}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      startIcon={<Favorite />}
                      size="small"
                      sx={{ color: "text.secondary" }}
                    >
                      {vehicle.likes}
                    </Button>
                    <Button
                      startIcon={<Comment />}
                      size="small"
                      sx={{ color: "text.secondary" }}
                    >
                      {vehicle.comments}
                    </Button>
                    <Button
                      startIcon={<Share />}
                      size="small"
                      sx={{ color: "text.secondary" }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Upcoming Events Section */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{ color: "#d4af37", mb: 3 }}
        >
          Upcoming Events
        </Typography>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : upcomingEvents.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No upcoming events
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Be the first to create an event!
            </Typography>
            <Button
              variant="contained"
              sx={{
                mt: 2,
                backgroundColor: "#d4af37",
                color: "#0a0f2c",
                "&:hover": { backgroundColor: "#e4bf47" },
              }}
              onClick={() => navigate("/events")}
            >
              Create Event
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {upcomingEvents.map((event) => (
              <Grid key={event.id} item xs={12} md={6}>
                <Card
                  sx={{
                    display: "flex",
                    height: "100%",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: 200 }}
                    image={
                      event.image_url ||
                      "https://source.unsplash.com/random/800x600/?car-meet"
                    }
                    alt={event.title}
                  />
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Avatar
                        src={event.created_by?.avatar_url}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {event.created_by?.name || "Unknown Creator"}
                      </Typography>
                    </Box>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {event.title}
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
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Trending Topics Section */}
      <Box>
        <Typography
          variant="h4"
          component="h2"
          sx={{ color: "#d4af37", mb: 3 }}
        >
          Trending Topics
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {trendingTopics.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              sx={{
                backgroundColor: "rgba(212, 175, 55, 0.1)",
                color: "#d4af37",
                "&:hover": {
                  backgroundColor: "rgba(212, 175, 55, 0.2)",
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Container>
  );
};
