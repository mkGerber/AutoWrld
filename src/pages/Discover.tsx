import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Avatar,
  Button,
  Paper,
  Container,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Search,
  FilterList,
  Favorite,
  Comment,
  Share,
  Sort,
  DirectionsCar,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase/client";
import { makes } from "../constants/makes"; // "constants" folder created that can contain constants (like makes) so we don't have to repeat them in multiple files
import { vehicleTypes } from "../constants/vehicleTypes"; // accessing vehicle types from constants... (same is done in AddVehicleForm.tsx)

export const Discover = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [originalVehicles, setOriginalVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetchVehicles();
  }, [sortBy]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      let query = supabase.from("vehicles").select(
        `
          *,
          user:profiles!user_id(name, avatar_url)
        `
      );

      // Apply sorting
      switch (sortBy) {
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform vehicle data
      const transformedVehicles = data.map((vehicle) => {
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
            ? parsedImages[0].replace(/^\["|"\]$/g, "")
            : "https://source.unsplash.com/random/800x600/?car";

        return {
          ...vehicle,
          image: imageSrc,
          owner: vehicle.user?.name || "Anonymous",
          avatar: vehicle.user?.avatar_url,
        };
      });

      setOriginalVehicles(transformedVehicles);
      setVehicles(transformedVehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Filter vehicles based on search query and filters
    const filteredVehicles = originalVehicles.filter((vehicle) => {
      const matchesSearch = searchQuery
        ? vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (vehicle.modifications || []).some((mod: string) =>
            mod.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : true;

      const matchesMake = selectedMake ? vehicle.make === selectedMake : true;

      const matchesType = selectedType ? vehicle.type === selectedType : true;

      return matchesSearch && matchesMake && matchesType;
    });

    setVehicles(filteredVehicles);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedMake("");
    setSelectedType("");
    setVehicles(originalVehicles);
  };

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          px: isMobile ? 2 : 0,
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: isMobile ? 2 : 4, px: isMobile ? 0.5 : 2 }}
    >
      {/* Header Section */}
      <Box sx={{ mb: isMobile ? 2 : 4, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: isMobile ? 1 : 2,
          }}
        >
          <DirectionsCar
            sx={{
              fontSize: isMobile ? 28 : 40,
              color: "#d4af37",
              mr: isMobile ? 1 : 2,
            }}
          />
          <Typography
            variant={isMobile ? "h5" : "h3"}
            sx={{
              color: "#d4af37",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Discover Builds
          </Typography>
        </Box>
        <Typography
          variant={isMobile ? "body2" : "subtitle1"}
          color="text.secondary"
          sx={{ mb: isMobile ? 2 : 4 }}
        >
          Explore amazing car builds from our community
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 1.5 : 3,
          mb: isMobile ? 2 : 4,
          backgroundColor: "rgba(30, 30, 40, 0.98)",
          borderRadius: 2,
          border: "1px solid rgba(212, 175, 55, 0.1)",
        }}
      >
        <Grid container spacing={isMobile ? 1.5 : 3} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search builds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: isMobile ? 44 : 56,
                  fontSize: isMobile ? "1rem" : "1.1rem",
                  "& fieldset": {
                    borderColor: "rgba(212, 175, 55, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(212, 175, 55, 0.4)",
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel
                sx={{ fontSize: isMobile ? "1rem" : "1.15rem", top: "-6px" }}
              >
                Make
              </InputLabel>
              <Select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                label="Make"
                sx={{
                  minWidth: isMobile ? "100px" : "140px",
                  height: isMobile ? 44 : 56,
                  fontSize: isMobile ? "1rem" : "1.15rem",
                  display: "flex",
                  alignItems: "center",
                  "& .MuiSelect-select": {
                    minHeight: isMobile ? 44 : 56,
                    fontSize: isMobile ? "1rem" : "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    py: isMobile ? 1 : 1.5,
                    px: isMobile ? 1 : 2,
                  },
                  "& .MuiSelect-icon": {
                    fontSize: isMobile ? "1.5rem" : "2rem",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(212, 175, 55, 0.2)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(212, 175, 55, 0.4)",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      fontSize: isMobile ? "1rem" : "1.15rem",
                      minWidth: isMobile ? "100px" : "140px",
                    },
                  },
                }}
              >
                <MenuItem
                  value=""
                  sx={{
                    fontSize: isMobile ? "1rem" : "1.15rem",
                    minHeight: isMobile ? 40 : 48,
                    py: isMobile ? 1 : 1.5,
                  }}
                >
                  All Makes
                </MenuItem>
                {makes.map((make) => (
                  <MenuItem
                    key={make}
                    value={make}
                    sx={{
                      fontSize: isMobile ? "1rem" : "1.15rem",
                      minHeight: isMobile ? 40 : 48,
                      py: isMobile ? 1 : 1.5,
                    }}
                  >
                    {make}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel
                sx={{ fontSize: isMobile ? "1rem" : "1.15rem", top: "-6px" }}
              >
                Type
              </InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                label="Type"
                sx={{
                  minWidth: isMobile ? "100px" : "140px",
                  height: isMobile ? 44 : 56,
                  fontSize: isMobile ? "1rem" : "1.15rem",
                  display: "flex",
                  alignItems: "center",
                  "& .MuiSelect-select": {
                    minHeight: isMobile ? 44 : 56,
                    fontSize: isMobile ? "1rem" : "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    py: isMobile ? 1 : 1.5,
                    px: isMobile ? 1 : 2,
                  },
                  "& .MuiSelect-icon": {
                    fontSize: isMobile ? "1.5rem" : "2rem",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(212, 175, 55, 0.2)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(212, 175, 55, 0.4)",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      fontSize: isMobile ? "1rem" : "1.15rem",
                      minWidth: isMobile ? "100px" : "140px",
                    },
                  },
                }}
              >
                <MenuItem
                  value=""
                  sx={{
                    fontSize: isMobile ? "1rem" : "1.15rem",
                    minHeight: isMobile ? 40 : 48,
                    py: isMobile ? 1 : 1.5,
                  }}
                >
                  All Types
                </MenuItem>
                {vehicleTypes.map((type) => (
                  <MenuItem
                    key={type}
                    value={type}
                    sx={{
                      fontSize: isMobile ? "1rem" : "1.15rem",
                      minHeight: isMobile ? 40 : 48,
                      py: isMobile ? 1 : 1.5,
                    }}
                  >
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              onClick={handleSearch}
              startIcon={<FilterList />}
              sx={{
                height: isMobile ? 44 : 56,
                fontSize: isMobile ? "1rem" : "1.1rem",
                backgroundColor: "#d4af37",
                "&:hover": {
                  backgroundColor: "#e4bf47",
                },
              }}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilters}
              sx={{
                height: isMobile ? 44 : 56,
                fontSize: isMobile ? "1rem" : "1.1rem",
                borderColor: "rgba(212, 175, 55, 0.2)",
                color: "#d4af37",
                "&:hover": {
                  borderColor: "rgba(212, 175, 55, 0.4)",
                },
              }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Sort Options */}
      <Box
        sx={{
          mb: isMobile ? 2 : 4,
          display: isMobile ? "block" : "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
        }}
      >
        <Typography
          variant={isMobile ? "body1" : "h6"}
          color="text.secondary"
          sx={{ mb: isMobile ? 1 : 0 }}
        >
          {vehicles.length} builds found
        </Typography>
        <FormControl sx={{ minWidth: isMobile ? 120 : 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Sort By"
            startAdornment={
              <InputAdornment position="start">
                <Sort />
              </InputAdornment>
            }
            sx={{
              height: isMobile ? 44 : 56,
              fontSize: isMobile ? "1rem" : "1.1rem",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(212, 175, 55, 0.2)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(212, 175, 55, 0.4)",
              },
            }}
          >
            <MenuItem value="recent">Most Recent</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Vehicle Grid */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {vehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
            <Card
              onClick={() => handleVehicleClick(vehicle.id)}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                backgroundColor: "rgba(30, 30, 40, 0.98)",
                borderRadius: 2,
                border: "1px solid rgba(212, 175, 55, 0.1)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                },
                width: "100%",
                minHeight: isMobile ? 320 : 380,
              }}
            >
              <CardMedia
                component="img"
                height={isMobile ? "160" : "240"}
                image={vehicle.image}
                alt={vehicle.name}
                sx={{
                  objectFit: "cover",
                  borderBottom: "1px solid rgba(212, 175, 55, 0.1)",
                }}
              />
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: isMobile ? 1 : 2,
                  }}
                >
                  <Avatar
                    src={vehicle.avatar}
                    alt={vehicle.owner}
                    sx={{
                      mr: 1,
                      border: "2px solid rgba(212, 175, 55, 0.3)",
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? "0.95rem" : undefined }}
                  >
                    {vehicle.owner}
                  </Typography>
                </Box>
                <Typography
                  variant={isMobile ? "body1" : "h6"}
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: "#d4af37",
                  }}
                >
                  {vehicle.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ mb: isMobile ? 1 : 2 }}
                >
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: isMobile ? 0.5 : 1,
                  }}
                >
                  {(vehicle.modifications || []).map(
                    (mod: string, index: number) => (
                      <Chip
                        key={index}
                        label={mod}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(212, 175, 55, 0.1)",
                          color: "#d4af37",
                          border: "1px solid rgba(212, 175, 55, 0.2)",
                          fontSize: isMobile ? "0.85rem" : undefined,
                          height: isMobile ? 22 : 24,
                          "&:hover": {
                            backgroundColor: "rgba(212, 175, 55, 0.2)",
                          },
                        }}
                      />
                    )
                  )}
                </Box>
                <Divider
                  sx={{
                    my: isMobile ? 1 : 2,
                    borderColor: "rgba(212, 175, 55, 0.1)",
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", gap: isMobile ? 0.5 : 1 }}>
                    <IconButton
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "#d4af37" },
                        p: isMobile ? 0.75 : 1,
                      }}
                    >
                      <Favorite />
                    </IconButton>
                    <IconButton
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "#d4af37" },
                        p: isMobile ? 0.75 : 1,
                      }}
                    >
                      <Comment />
                    </IconButton>
                    <IconButton
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "#d4af37" },
                        p: isMobile ? 0.75 : 1,
                      }}
                    >
                      <Share />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? "0.8rem" : undefined }}
                  >
                    {new Date(vehicle.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
