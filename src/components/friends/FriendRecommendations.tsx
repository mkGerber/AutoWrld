import { Box, Typography, Paper } from "@mui/material";

export const FriendRecommendations = () => {
  return (
    <Paper elevation={2}>
      <Box p={2} textAlign="center">
        <Typography variant="h6" gutterBottom>
          Recommended Friends
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Friend recommendations are coming soon!
        </Typography>
      </Box>
    </Paper>
  );
};
