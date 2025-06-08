import { Box, Typography, Grid, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import { VehicleCard } from "../components/garage/VehicleCard";
import { useState } from "react";

// Sample data - this would come from your backend in a real application
const sampleVehicles = [
  {
    id: 1,
    name: "Project RX-7",
    make: "Mazda",
    model: "RX-7",
    year: 1993,
    type: "Sports Car",
    horsepower: 450,
    description:
      "My dream project car. Currently undergoing a full restoration and engine rebuild.",
    modifications: ["Turbo", "Coilovers", "Widebody", "Built Engine"],
    images: [
      "https://source.unsplash.com/random/800x600/?mazda-rx7",
      "https://source.unsplash.com/random/800x600/?mazda-rx7-engine",
      "https://source.unsplash.com/random/800x600/?mazda-rx7-interior",
    ],
    status: "project",
    buildProgress: 65,
    owner: {
      name: "John Doe",
      avatar: "https://source.unsplash.com/random/100x100/?portrait",
    },
  },
  {
    id: 2,
    name: "Daily Driver",
    make: "Honda",
    model: "Civic Type R",
    year: 2021,
    type: "Hot Hatch",
    horsepower: 306,
    description:
      "My daily driver and weekend track car. Perfect balance of comfort and performance.",
    modifications: ["Intake", "Exhaust", "Tune", "Coilovers"],
    images: [
      "https://source.unsplash.com/random/800x600/?honda-civic",
      "https://source.unsplash.com/random/800x600/?honda-civic-interior",
      "https://source.unsplash.com/random/800x600/?honda-civic-engine",
    ],
    status: "daily",
    buildProgress: 90,
    owner: {
      name: "John Doe",
      avatar: "https://source.unsplash.com/random/100x100/?portrait",
    },
  },
  {
    id: 3,
    name: "Show Car",
    make: "Toyota",
    model: "Supra",
    year: 2020,
    type: "Sports Car",
    horsepower: 382,
    description: "My show car with custom widebody kit and unique paint job.",
    modifications: ["Widebody Kit", "Custom Paint", "Wheels", "Lowering Kit"],
    images: [
      "https://source.unsplash.com/random/800x600/?toyota-supra",
      "https://source.unsplash.com/random/800x600/?toyota-supra-interior",
      "https://source.unsplash.com/random/800x600/?toyota-supra-engine",
    ],
    status: "show",
    buildProgress: 100,
    owner: {
      name: "John Doe",
      avatar: "https://source.unsplash.com/random/100x100/?portrait",
    },
  },
];

export const Garage = () => {
  const [vehicles, setVehicles] = useState(sampleVehicles);

  const handleEdit = (id: number) => {
    // TODO: Implement edit functionality
    console.log("Edit vehicle:", id);
  };

  const handleDelete = (id: number) => {
    // TODO: Implement delete functionality
    console.log("Delete vehicle:", id);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ color: "#d4af37" }}>
          My Garage
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            backgroundColor: "#d4af37",
            color: "#0a0f2c",
            "&:hover": {
              backgroundColor: "#e4bf47",
            },
          }}
        >
          Add Vehicle
        </Button>
      </Box>

      <Grid container spacing={3}>
        {vehicles.map((vehicle) => (
          <Grid key={vehicle.id} item xs={12} md={6} lg={4}>
            <VehicleCard
              vehicle={vehicle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
