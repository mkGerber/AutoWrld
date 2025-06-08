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

const upcomingEvents = [
  {
    id: 1,
    title: "Cars & Coffee",
    date: "2024-03-15",
    location: "Downtown Plaza",
    image: "https://source.unsplash.com/random/800x600/?car-meet",
  },
  {
    id: 2,
    title: "Track Day",
    date: "2024-03-20",
    location: "Local Raceway",
    image: "https://source.unsplash.com/random/800x600/?race-track",
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
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          height: "60vh",
          minHeight: "500px",
          mb: 6,
          borderRadius: 4,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(10, 15, 44, 0.7), rgba(10, 15, 44, 0.9))",
            zIndex: 1,
          },
        }}
      >
        <CardMedia
          component="img"
          image={highlightImage}
          alt="Featured Car"
          sx={{
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 4,
            zIndex: 2,
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: "#d4af37",
              mb: 2,
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            Welcome to Car Enthusiast
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "#fdfdfd",
              mb: 4,
              maxWidth: "600px",
            }}
          >
            Connect with fellow car enthusiasts, share your builds, and discover
            amazing vehicles
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<DirectionsCar />}
            onClick={() => navigate("/garage")}
            sx={{
              backgroundColor: "#d4af37",
              color: "#0a0f2c",
              "&:hover": {
                backgroundColor: "#e4bf47",
              },
            }}
          >
            Explore Garage
          </Button>
        </Box>
      </Box>

      {/* Featured Vehicles Section */}
      <Box sx={{ mb: 6 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h2" sx={{ color: "#d4af37" }}>
            Featured Vehicles
          </Typography>
          <Button
            variant="outlined"
            sx={{
              borderColor: "#d4af37",
              color: "#d4af37",
              "&:hover": {
                borderColor: "#e4bf47",
                backgroundColor: "rgba(212, 175, 55, 0.1)",
              },
            }}
          >
            View All
          </Button>
        </Box>
        <Grid container spacing={3}>
          {featuredVehicles.map((vehicle) => (
            <Grid key={vehicle.id} item xs={12} md={4}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="240"
                  image={vehicle.image}
                  alt={vehicle.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ mr: 1 }}>{vehicle.owner[0]}</Avatar>
                    <Typography variant="subtitle2" color="text.secondary">
                      {vehicle.owner}
                    </Typography>
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {vehicle.name}
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}
                  >
                    {vehicle.modifications.map((mod) => (
                      <Chip
                        key={mod}
                        label={mod}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(212, 175, 55, 0.1)",
                          color: "#d4af37",
                          border: "1px solid rgba(212, 175, 55, 0.2)",
                        }}
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
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ width: 200 }}
                  image={event.image}
                  alt={event.title}
                />
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {event.date} • {event.location}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: "#d4af37",
                      color: "#d4af37",
                      "&:hover": {
                        borderColor: "#e4bf47",
                        backgroundColor: "rgba(212, 175, 55, 0.1)",
                      },
                    }}
                  >
                    RSVP
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {trendingTopics.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              sx={{
                backgroundColor: "rgba(212, 175, 55, 0.1)",
                color: "#d4af37",
                border: "1px solid rgba(212, 175, 55, 0.2)",
                "&:hover": {
                  backgroundColor: "rgba(212, 175, 55, 0.2)",
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
