import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Edit,
  DirectionsCar,
  Event,
  Build,
  PhotoCamera,
  LocationOn,
  Email,
  Phone,
} from "@mui/icons-material";

const mockUser = {
  name: "John Doe",
  username: "@johndoe",
  avatar: "https://source.unsplash.com/random/200x200/?portrait",
  bio: "Car enthusiast and track day regular. Currently working on a Mazda RX-7 project.",
  location: "New York, NY",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  stats: {
    vehicles: 2,
    events: 15,
    modifications: 25,
    photos: 156,
  },
};

export const Profile = () => {
  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <Box
          sx={{ position: "relative", height: 200, bgcolor: "primary.main" }}
        />
        <Box sx={{ position: "relative", px: 3, pb: 3 }}>
          <Avatar
            src={mockUser.avatar}
            sx={{
              width: 120,
              height: 120,
              border: "4px solid white",
              position: "absolute",
              top: -60,
              left: 24,
            }}
          />
          <Box sx={{ ml: 15, pt: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {mockUser.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {mockUser.username}
            </Typography>
            <Typography variant="body1" paragraph>
              {mockUser.bio}
            </Typography>
            <Button variant="outlined" startIcon={<Edit />} sx={{ mt: 2 }}>
              Edit Profile
            </Button>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={mockUser.location}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Email" secondary={mockUser.email} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Phone color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Phone" secondary={mockUser.phone} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <DirectionsCar color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {mockUser.stats.vehicles}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vehicles
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Event color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {mockUser.stats.events}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Events
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Build color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {mockUser.stats.modifications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Modifications
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <PhotoCamera color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {mockUser.stats.photos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Photos
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
