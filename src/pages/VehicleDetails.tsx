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
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Sample data - In a real app, this would come from an API
const sampleVehicles = [
  {
    id: "1",
    name: "Project RX-7",
    make: "Mazda",
    model: "RX-7",
    year: 1993,
    type: "Project Car",
    horsepower: 280,
    description:
      "My dream project car. Currently undergoing a full restoration and engine rebuild.",
    modifications: [
      "13B-REW Engine Swap",
      "Twin Turbo Setup",
      "Coilover Suspension",
      "Widebody Kit",
    ],
    images: [
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "In Progress",
    buildProgress: 65,
    owner: {
      name: "John Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
  },
  {
    id: "2",
    name: "Daily Driver Civic Type R",
    make: "Honda",
    model: "Civic Type R",
    year: 2020,
    type: "Daily Driver",
    horsepower: 306,
    description:
      "My daily driver with some tasteful modifications for street use.",
    modifications: [
      "Cold Air Intake",
      "Cat-back Exhaust",
      "Lowering Springs",
      "Wheel Spacers",
    ],
    images: [
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "Complete",
    buildProgress: 100,
    owner: {
      name: "John Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
  },
  {
    id: "3",
    name: "Show Car Supra",
    make: "Toyota",
    model: "Supra",
    year: 2021,
    type: "Show Car",
    horsepower: 500,
    description:
      "Built for car shows and weekend drives. Full custom widebody and paint job.",
    modifications: [
      "Custom Widebody Kit",
      "Stage 3 Turbo",
      "Custom Paint Job",
      "Air Suspension",
      "Custom Interior",
    ],
    images: [
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "Complete",
    buildProgress: 100,
    owner: {
      name: "John Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
  },
];

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

  // Find the vehicle by ID
  const vehicle = sampleVehicles.find((v) => v.id === id);

  // If vehicle not found, redirect to garage
  if (!vehicle) {
    navigate("/garage");
    return null;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
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
            <Typography variant="h4" component="h1" sx={{ color: "#d4af37" }}>
              {vehicle.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Avatar src={vehicle.owner.avatar} sx={{ mr: 1 }} />
              <Typography variant="subtitle1" color="text.secondary">
                {vehicle.owner.name}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={vehicle.status.toUpperCase()}
            sx={{
              backgroundColor: statusColors[vehicle.status],
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
              image={vehicle.images[selectedImage]}
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
            {vehicle.images.map((image, index) => (
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
            <LinearProgress
              variant="determinate"
              value={vehicle.buildProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "rgba(212, 175, 55, 0.1)",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "#d4af37",
                },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, textAlign: "right" }}
            >
              {vehicle.buildProgress}%
            </Typography>
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
                  <Typography variant="body1" paragraph>
                    {vehicle.description}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Modifications
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {vehicle.modifications.map((mod, index) => (
                      <Chip
                        key={index}
                        label={mod}
                        sx={{
                          backgroundColor: "rgba(212, 175, 55, 0.1)",
                          color: "#d4af37",
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedTab === 1 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Make
                      </Typography>
                      <Typography variant="body1">{vehicle.make}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Model
                      </Typography>
                      <Typography variant="body1">{vehicle.model}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Year
                      </Typography>
                      <Typography variant="body1">{vehicle.year}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body1">{vehicle.type}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Horsepower
                      </Typography>
                      <Typography variant="body1">
                        {vehicle.horsepower} hp
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {selectedTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Build Timeline
                  </Typography>
                  <Timeline>
                    <TimelineItem>
                      <TimelineSeparator>
                        <TimelineDot sx={{ bgcolor: "#d4af37" }} />
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="h6">Engine Swap</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed 13B-REW engine swap with twin turbo setup
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          March 15, 2023
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                    <TimelineItem>
                      <TimelineSeparator>
                        <TimelineDot sx={{ bgcolor: "#d4af37" }} />
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="h6">Suspension Upgrade</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Installed coilover suspension and upgraded sway bars
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          February 28, 2023
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                    <TimelineItem>
                      <TimelineSeparator>
                        <TimelineDot sx={{ bgcolor: "#d4af37" }} />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="h6">
                          Widebody Installation
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed widebody kit installation and paint
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          January 15, 2023
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  </Timeline>
                </Box>
              )}

              {selectedTab === 3 && (
                <Box>
                  <Grid container spacing={2}>
                    {vehicle.images.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
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
              32 Comments
            </Button>
            <Button startIcon={<Share />} sx={{ color: "text.secondary" }}>
              Share
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
