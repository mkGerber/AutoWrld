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
} from "@mui/icons-material";

const featuredVehicles = [
  {
    id: 1,
    name: "Project RX-7",
    owner: "John Doe",
    image: "https://source.unsplash.com/random/800x600/?mazda-rx7",
    likes: 234,
    modifications: 12,
  },
  {
    id: 2,
    name: "Supra Build",
    owner: "Jane Smith",
    image: "https://source.unsplash.com/random/800x600/?toyota-supra",
    likes: 189,
    modifications: 8,
  },
  {
    id: 3,
    name: "Skyline GT-R",
    owner: "Mike Johnson",
    image: "https://source.unsplash.com/random/800x600/?nissan-skyline",
    likes: 312,
    modifications: 15,
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Summer Car Meet 2024",
    date: "June 15, 2024",
    location: "Central Park, New York",
    attendees: 156,
  },
  {
    id: 2,
    title: "Track Day Experience",
    date: "July 20, 2024",
    location: "Laguna Seca Raceway",
    attendees: 89,
  },
];

const trendingTopics = [
  "JDM Culture",
  "Electric Vehicles",
  "Track Racing",
  "Car Modifications",
  "Classic Cars",
  "Supercars",
];

export const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          height: "500px",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          mb: 6,
          borderRadius: "16px",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7))",
            zIndex: 1,
          },
        }}
      >
        <CardMedia
          component="img"
          image="https://source.unsplash.com/random/1920x1080/?car-show"
          alt="Hero"
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Container sx={{ position: "relative", zIndex: 2 }}>
          <Box sx={{ maxWidth: "600px" }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                color: "white",
                fontWeight: 700,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Welcome to Car Enthusiast
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "white",
                mb: 4,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Your ultimate platform for car enthusiasts. Connect, share, and
              discover.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
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
          <Typography
            variant="h4"
            component="h2"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <DirectionsCar sx={{ mr: 1, color: "primary.main" }} />
            Featured Vehicles
          </Typography>
          <Button endIcon={<ArrowForward />}>View All</Button>
        </Box>
        <Grid container spacing={3}>
          {featuredVehicles.map((vehicle) => (
            <Grid item xs={12} md={4} key={vehicle.id}>
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
                  image={vehicle.image}
                  alt={vehicle.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1,
                        bgcolor: "primary.main",
                      }}
                    >
                      {vehicle.owner[0]}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {vehicle.owner}
                    </Typography>
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {vehicle.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Chip
                      icon={<Star />}
                      label={`${vehicle.likes} likes`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<Build />}
                      label={`${vehicle.modifications} mods`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Button variant="outlined" fullWidth>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Upcoming Events Section */}
      <Box sx={{ mb: 6 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Event sx={{ mr: 1, color: "primary.main" }} />
            Upcoming Events
          </Typography>
          <Button endIcon={<ArrowForward />}>View All</Button>
        </Box>
        <Grid container spacing={3}>
          {upcomingEvents.map((event) => (
            <Grid item xs={12} md={6} key={event.id}>
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
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {event.title}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      📅 {event.date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📍 {event.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      👥 {event.attendees} attendees
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

      {/* Trending Topics Section */}
      <Box>
        <Typography
          variant="h4"
          component="h2"
          sx={{ display: "flex", alignItems: "center", mb: 3 }}
        >
          <TrendingUp sx={{ mr: 1, color: "primary.main" }} />
          Trending Topics
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {trendingTopics.map((topic, index) => (
            <Chip
              key={index}
              label={topic}
              sx={{
                "&:hover": {
                  backgroundColor: "primary.main",
                  color: "white",
                },
                transition: "all 0.2s",
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
