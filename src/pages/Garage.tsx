import { useState } from "react";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Add,
  Edit,
  DirectionsCar,
  Speed,
  Build,
  Delete,
} from "@mui/icons-material";
import { AddVehicleForm } from "../components/garage/AddVehicleForm";

interface Vehicle {
  id: number;
  name: string;
  make: string;
  model: string;
  year: string;
  image: string;
  status: string;
  modifications: number;
  horsepower: string;
}

export const Garage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 1,
      name: "Project RX-7",
      make: "Mazda",
      model: "RX-7",
      year: "1993",
      image: "https://source.unsplash.com/random/800x600/?mazda-rx7",
      status: "Project",
      modifications: 12,
      horsepower: "280",
    },
    {
      id: 2,
      name: "Daily Driver",
      make: "Honda",
      model: "Civic Type R",
      year: "2022",
      image: "https://source.unsplash.com/random/800x600/?honda-civic",
      status: "Daily",
      modifications: 3,
      horsepower: "320",
    },
  ]);

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const handleAddVehicle = (vehicleData: any) => {
    const newVehicle: Vehicle = {
      id: vehicles.length + 1,
      name: vehicleData.name,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      image:
        vehicleData.images[0] ||
        "https://source.unsplash.com/random/800x600/?car",
      status: vehicleData.type,
      modifications: vehicleData.modifications.length,
      horsepower: vehicleData.horsepower,
    };
    setVehicles([...vehicles, newVehicle]);
  };

  const handleDeleteVehicle = (id: number) => {
    setVehicles(vehicles.filter((vehicle) => vehicle.id !== id));
  };

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
            My Garage
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your vehicle collection
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsAddFormOpen(true)}
          sx={{ height: "fit-content" }}
        >
          Add Vehicle
        </Button>
      </Box>

      <Grid container spacing={3}>
        {vehicles.map((vehicle) => (
          <Grid item xs={12} md={6} key={vehicle.id}>
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
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  height="240"
                  image={vehicle.image}
                  alt={vehicle.name}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    gap: 1,
                  }}
                >
                  <IconButton
                    sx={{
                      bgcolor: "background.paper",
                      "&:hover": { bgcolor: "background.paper" },
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    sx={{
                      bgcolor: "background.paper",
                      "&:hover": { bgcolor: "background.paper" },
                    }}
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {vehicle.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Typography>
                  </Box>
                  <Chip
                    label={vehicle.status}
                    size="small"
                    color={
                      vehicle.status === "Project" ? "secondary" : "primary"
                    }
                  />
                </Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <DirectionsCar sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.year}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Speed sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.horsepower} HP
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Build sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.modifications} mods
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Button variant="outlined" fullWidth>
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <AddVehicleForm
        open={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSubmit={handleAddVehicle}
      />
    </Box>
  );
};
