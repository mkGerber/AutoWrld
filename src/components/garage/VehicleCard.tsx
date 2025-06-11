import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface VehicleCardProps {
  vehicle: {
    id: number;
    name: string;
    make: string;
    model: string;
    year: number;
    type: string;
    horsepower?: number;
    description?: string;
    modifications?: string[];
    images?: string[] | string;
    status?: "project" | "daily" | "show" | "track";
    buildProgress?: number;
    owner?: {
      name: string;
      avatar: string;
    };
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const VehicleCard = ({ vehicle, onEdit, onDelete }: VehicleCardProps) => {
  const navigate = useNavigate();
  const handleCardClick = () => navigate(`/vehicle/${vehicle.id}`);

  const defaultImage =
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";

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

  let imageSrc =
    Array.isArray(parsedImages) && parsedImages.length > 0
      ? parsedImages[0]
      : defaultImage;

  //This removes the "[" and "]" from the imageSrc
  imageSrc = imageSrc.slice(2, -2);

  //console.log(imageSrc);
  //console.log(imageSrc.split('","'));

  imageSrc = imageSrc.split('","')[0];

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        width: 320,
        height: 480,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        cursor: "pointer",
        borderRadius: 3,
        boxShadow: 3,
        transition: "transform 0.15s",
        "&:hover": {
          transform: "scale(1.04)",
          boxShadow: 6,
        },
        m: "auto",
        background: "rgba(30, 30, 40, 0.98)",
      }}
    >
      <CardMedia
        component="img"
        image={imageSrc}
        alt={vehicle.name}
        sx={{
          height: 240,
          width: "100%",
          objectFit: "cover",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          display: "block",
        }}
      />

      <CardContent
        sx={{
          p: 3,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: "#d4af37", fontWeight: 700, fontSize: 22, mb: 0.5 }}
          noWrap
        >
          {vehicle.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          sx={{ mb: 1 }}
        >
          {vehicle.make} {vehicle.model} ({vehicle.year})
        </Typography>
        <Chip
          label={vehicle.status || vehicle.type}
          size="small"
          sx={{
            backgroundColor:
              vehicle.status === "Complete"
                ? "#4caf50"
                : vehicle.status === "In Progress"
                ? "#ff9800"
                : "#2196f3",
            color: "white",
            fontWeight: 600,
            fontSize: 13,
            mb: 1,
          }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {vehicle.description || "No description available"}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: "auto" }}>
          {vehicle.modifications &&
            vehicle.modifications.map((mod, idx) => (
              <Chip
                key={idx}
                label={mod}
                size="small"
                sx={{
                  backgroundColor: "rgba(212, 175, 55, 0.12)",
                  color: "#d4af37",
                  fontWeight: 500,
                  fontSize: 11,
                }}
              />
            ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
