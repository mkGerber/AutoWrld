import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
} from "@mui/material";
import { supabase } from "../services/supabase/client";
import { useAuth } from "../context/AuthContext";

export const Badges = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      const { data: badges } = await supabase
        .from("badges")
        .select("id, name, description, icon_url");
      let userBadgeIds = new Set<string>();
      if (user?.id) {
        const { data: userBadgesData } = await supabase
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", user.id);
        userBadgeIds = new Set((userBadgesData || []).map((b) => b.badge_id));
      }
      setAllBadges(badges || []);
      setUserBadges(userBadgeIds);
      setLoading(false);
    };
    fetchBadges();
  }, [user]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Badges & Achievements
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Collect badges by being active in the app! Earn them for posting,
        attending events, building your garage, and more.
      </Typography>
      <Grid container spacing={3}>
        {allBadges.map((badge) => {
          const earned = userBadges.has(badge.id);
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
              <Card
                sx={{
                  opacity: earned ? 1 : 0.4,
                  border: earned
                    ? `2px solid ${theme.palette.warning.main}`
                    : `1px solid ${theme.palette.divider}`,
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  boxShadow: earned ? 6 : 1,
                  "&:hover": { boxShadow: 8 },
                  textAlign: "center",
                }}
                onClick={() => {
                  setSelectedBadge(badge);
                  setModalOpen(true);
                }}
              >
                <CardMedia
                  component="img"
                  image={badge.icon_url}
                  alt={badge.name}
                  sx={{
                    width: 80,
                    height: 80,
                    mx: "auto",
                    mt: 2,
                    borderRadius: "50%",
                    background: "#222",
                  }}
                />
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: earned
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                    }}
                  >
                    {badge.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {badge.description}
                  </Typography>
                  {!earned && (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ mt: 1 }}
                    >
                      Not earned yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        {selectedBadge && (
          <>
            <DialogTitle>{selectedBadge.name}</DialogTitle>
            <DialogContent>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <img
                  src={selectedBadge.icon_url}
                  alt={selectedBadge.name}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    marginBottom: 16,
                  }}
                />
                <Typography variant="body1" sx={{ textAlign: "center" }}>
                  {selectedBadge.description}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setModalOpen(false)} variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
