import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  useTheme,
} from "@mui/material";
import {
  DirectionsCar,
  Event,
  Home,
  Person,
  Explore,
} from "@mui/icons-material";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const navItems = [
    { label: "Home", path: "/", icon: <Home /> },
    { label: "Discover", path: "/discover", icon: <Explore /> },
    { label: "Events", path: "/events", icon: <Event /> },
    { label: "Garage", path: "/garage", icon: <DirectionsCar /> },
    { label: "Profile", path: "/profile", icon: <Person /> },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="static"
        sx={{
          background: "linear-gradient(90deg, #0a0f2c 0%, #1a1f3c 100%)",
          borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
          boxShadow: "0 2px 4px rgba(212, 175, 55, 0.1)",
        }}
      >
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <DirectionsCar sx={{ mr: 1, color: "#d4af37", fontSize: "2rem" }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                cursor: "pointer",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "#d4af37",
                textShadow: "0 0 10px rgba(212, 175, 55, 0.3)",
              }}
              onClick={() => navigate("/")}
            >
              AUTO WRLD
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  color:
                    location.pathname === item.path ? "#d4af37" : "#fdfdfd",
                  borderBottom:
                    location.pathname === item.path
                      ? "2px solid #d4af37"
                      : "none",
                  "&:hover": {
                    backgroundColor: "rgba(212, 175, 55, 0.1)",
                    transform: "translateY(-1px)",
                    color: "#d4af37",
                  },
                  transition: "all 0.2s",
                  "& .MuiSvgIcon-root": {
                    color:
                      location.pathname === item.path ? "#d4af37" : "#fdfdfd",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 4,
          background: "linear-gradient(180deg, #0a0f2c 0%, #1a1f3c 100%)",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent)",
          },
        }}
      >
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  );
};
