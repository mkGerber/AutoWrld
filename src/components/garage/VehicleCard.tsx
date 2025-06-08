import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Grid,
  Avatar,
  Button,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  Edit,
  Delete,
  PhotoLibrary,
  Build,
  Timeline,
  Favorite,
  Share,
  Comment,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface VehicleCardProps {
  vehicle: {
    id: number;
    name: string;
    make: string;
    model: string;
    year: number;
    type: string;
    horsepower: number;
    description: string;
    modifications: string[];
    images: string[];
    status: "project" | "daily" | "show" | "track";
    buildProgress: number;
    owner: {
      name: string;
      avatar: string;
    };
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const VehicleCard = ({
  vehicle,
  onEdit,
  onDelete,
}: VehicleCardProps) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

  const statusColors = {
    project: "#ff9800",
    daily: "#4caf50",
    show: "#2196f3",
    track: "#f44336",
  };

  const handleCardClick = () => {
    navigate(`/vehicle/${vehicle.id}`);
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
        },
        cursor: "pointer",
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height="300"
          image={vehicle.images[selectedImage]}
          alt={vehicle.name}
        />
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            gap: 1,
          }}
        >
          <IconButton
            size="small"
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
            onClick={() => onEdit?.(vehicle.id)}
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
            onClick={() => onDelete?.(vehicle.id)}
          >
            <Delete />
          </IconButton>
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
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
                width: 60,
                height: 60,
                flexShrink: 0,
                cursor: "pointer",
                border: selectedImage === index ? "2px solid #d4af37" : "none",
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

      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar src={vehicle.owner.avatar} sx={{ mr: 1 }} />
          <Typography variant="subtitle2" color="text.secondary">
            {vehicle.owner.name}
          </Typography>
        </Box>

        <Typography variant="h5" component="h3" gutterBottom>
          {vehicle.name}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Chip
            label={vehicle.status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: statusColors[vehicle.status],
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Make/Model
            </Typography>
            <Typography variant="body1">
              {vehicle.make} {vehicle.model}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Year
            </Typography>
            <Typography variant="body1">{vehicle.year}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Type
            </Typography>
            <Typography variant="body1">{vehicle.type}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Horsepower
            </Typography>
            <Typography variant="body1">{vehicle.horsepower} HP</Typography>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" gutterBottom>
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
          sx={{ mt: 0.5, textAlign: "right" }}
        >
          {vehicle.buildProgress}%
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Modifications
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
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

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" paragraph>
          {vehicle.description}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Timeline />}
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
            Build Timeline
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhotoLibrary />}
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
            Gallery
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            startIcon={<Favorite />}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            245
          </Button>
          <Button
            startIcon={<Comment />}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            32
          </Button>
          <Button
            startIcon={<Share />}
            size="small"
            sx={{ color: "text.secondary" }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
