import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from "@mui/material";
import {
  DirectionsCar,
  Event,
  Home,
  Person,
  Explore,
  Menu as MenuIcon,
  People,
  Chat,
  PhotoCamera,
  Mail,
  TrendingUp,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  useEffect(() => {
    const fetchPendingInvitesCount = async () => {
      if (!user) return;

      try {
        const { count, error } = await supabase
          .from("lpr_invites")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("status", "pending");

        if (!error && count !== null) {
          setPendingInvitesCount(count);
        }
      } catch (err) {
        console.error("Error fetching pending invites count:", err);
      }
    };

    fetchPendingInvitesCount();

    // Set up real-time subscription for LPR invites
    const channel = supabase
      .channel("lpr_invites_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lpr_invites",
          filter: `recipient_id=eq.${user?.id}`,
        },
        () => {
          fetchPendingInvitesCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems = [
    { label: "Home", path: "/", icon: <Home /> },
    { label: "Feed", path: "/feed", icon: <TrendingUp /> },
    { label: "Discover", path: "/discover", icon: <Explore /> },
    { label: "Events", path: "/events", icon: <Event /> },
    {
      label: "Garage",
      path: "/garage",
      icon: (
        <Badge badgeContent={pendingInvitesCount} color="error">
          <Mail />
        </Badge>
      ),
      showBadge: pendingInvitesCount > 0,
    },
    { label: "LPR", path: "/lpr", icon: <PhotoCamera /> },
    { label: "Friends", path: "/friends", icon: <People /> },
    { label: "Chats", path: "/chats", icon: <Chat /> },
    { label: "Profile", path: "/profile", icon: <Person /> },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const drawer = (
    <Box
      sx={{
        width: 250,
        background: "linear-gradient(180deg, #0a0f2c 0%, #1a1f3c 100%)",
        height: "100%",
        color: "#fdfdfd",
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <img
          src="/AutoWrldLogo.png"
          alt="Auto Wrld Logo"
          style={{
            height: "40px",
            width: "auto",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        />
      </Box>
      <Divider sx={{ borderColor: "rgba(212, 175, 55, 0.2)" }} />
      <List>
        {navItems.map((item) => (
          <ListItem
            component="div"
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            sx={{
              backgroundColor:
                location.pathname === item.path
                  ? "rgba(212, 175, 55, 0.1)"
                  : "transparent",
              "&:hover": {
                backgroundColor: "rgba(212, 175, 55, 0.1)",
              },
              cursor: "pointer",
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path ? "#d4af37" : "#fdfdfd",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                color: location.pathname === item.path ? "#d4af37" : "#fdfdfd",
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

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
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, color: "#d4af37" }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <img
              src="/AutoWrldLogo.png"
              alt="Auto Wrld Logo"
              style={{
                height: "40px",
                width: "auto",
                cursor: "pointer",
              }}
              onClick={() => navigate("/")}
            />
          </Box>
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  startIcon={item.icon}
                  onClick={() => handleNavigation(item.path)}
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
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 250,
            borderRight: "1px solid rgba(212, 175, 55, 0.2)",
          },
        }}
      >
        {drawer}
      </Drawer>

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
