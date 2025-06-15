import { Box, Container, Grid } from "@mui/material";
import { FriendRequests } from "../components/friends/FriendRequests";
import { FriendsList } from "../components/friends/FriendsList";
import { SendFriendRequest } from "../components/friends/SendFriendRequest";

export const Friends = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SendFriendRequest />
        </Grid>
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            <FriendRequests />
          </Box>
          <FriendsList />
        </Grid>
      </Grid>
    </Container>
  );
};
