import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  ListItemSecondaryAction,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";
import { Link } from "react-router-dom";

interface User {
  id: string;
  name: string;
  avatar_url: string;
  mutualCount?: number;
}

export const FriendRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<Record<string, "idle" | "loading" | "sent" | "error">>({});
  const [requestError, setRequestError] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // compile all friends of user
        const { data: friendships, error: friendsError } = await supabase
          .from("friendships")
          .select("id, sender_id, receiver_id, status")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq("status", "accepted");

        if (friendsError) throw friendsError;

        // build a set of friend IDs
        const friendIds = new Set<string>();
        friendships?.forEach((f) => {
          if (f.sender_id === user.id) friendIds.add(f.receiver_id);
          else friendIds.add(f.sender_id);
        });

        // get all friends of your friends (excluding yourself and your friends)
        let mutualMap: Record<string, { count: number; user: any }> = {};

        for (const fid of friendIds) {
          const { data: fof, error: fofError } = await supabase
            .from("friendships")
            .select("sender_id, receiver_id, status, sender:sender_id(id, name, avatar_url), receiver:receiver_id(id, name, avatar_url)")
            .or(`sender_id.eq.${fid},receiver_id.eq.${fid}`)
            .eq("status", "accepted");

          if (fofError) throw fofError;

          fof?.forEach((f) => {
            const otherId = f.sender_id === fid ? f.receiver_id : f.sender_id;
            if (
              otherId !== user.id &&
              !friendIds.has(otherId)
            ) {
              // Get user info
              const userInfo = f.sender_id === otherId ? f.sender : f.receiver;
              if (!mutualMap[otherId]) {
                mutualMap[otherId] = { count: 1, user: userInfo };
              } else {
                mutualMap[otherId].count += 1;
              }
            }
          });
        }

        // convert to array and sort by mutual count
        const recs = Object.entries(mutualMap)
          .map(([id, { count, user }]) => ({
            id,
            name: user.name,
            avatar_url: user.avatar_url,
            mutualCount: count,
          }))
          .sort((a, b) => b.mutualCount - a.mutualCount)
          .slice(0, 10); // top 10

        setRecommendations(recs);

        let usersToCheck: User[] = [];
        if (recs.length === 0) {
          // exclude current user and their friends
          const excludeIds = [user.id, ...Array.from(friendIds)];
          const { data: recent, error: recentError } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .not("id", "in", `(${excludeIds.join(",")})`)
            .order("created_at", { ascending: false })
            .limit(10);

          if (recentError) throw recentError;
          setRecentUsers(recent || []);
          usersToCheck = recent || [];
        } else {
          setRecentUsers([]);
          usersToCheck = recs;
        }

        // --- NEW: Check for existing friendships/requests ---
        if (usersToCheck.length > 0) {
          const ids = usersToCheck.map(u => u.id);
          const { data: friendships, error: checkError } = await supabase
            .from("friendships")
            .select("sender_id, receiver_id, status")
            .or(
              `and(sender_id.eq.${user.id},receiver_id.in.(${ids.join(",")})),and(sender_id.in.(${ids.join(",")}),receiver_id.eq.${user.id})`
            )
            .in("status", ["pending", "accepted"]);

          if (checkError) throw checkError;

          // Build a map of userId -> status
          const statusMap: Record<string, "sent" | "accepted"> = {};
          friendships?.forEach(f => {
            const otherId = f.sender_id === user.id ? f.receiver_id : f.sender_id;
            if (f.status === "pending") statusMap[otherId] = "sent";
            if (f.status === "accepted") statusMap[otherId] = "accepted";
          });

          // Set requestStatus for each user
          setRequestStatus(prev => {
            const updated = { ...prev };
            usersToCheck.forEach(u => {
              if (statusMap[u.id] === "sent") updated[u.id] = "sent";
              else if (statusMap[u.id] === "accepted") updated[u.id] = "sent"; // treat accepted as sent
              else updated[u.id] = "idle";
            });
            return updated;
          });
        }
        // --- END NEW ---
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  const handleSendRequest = async (targetUser: User) => {
    if (!user) return;
    setRequestStatus((prev) => ({ ...prev, [targetUser.id]: "loading" }));
    setRequestError((prev) => ({ ...prev, [targetUser.id]: "" }));

    try {
      // Check if a friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from("friendships")
        .select("id, status")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`
        )
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingFriendship) {
        if (existingFriendship.status === "pending") {
          throw new Error("Friend request already sent");
        } else if (existingFriendship.status === "accepted") {
          throw new Error("Already friends with this user");
        } else if (existingFriendship.status === "rejected") {
          throw new Error("Friend request was previously rejected");
        }
      }

      // Send the friend request
      const { error: sendError } = await supabase.from("friendships").insert({
        sender_id: user.id,
        receiver_id: targetUser.id,
        status: "pending",
      });

      if (sendError) throw sendError;

      setRequestStatus((prev) => ({ ...prev, [targetUser.id]: "sent" }));
    } catch (err: any) {
      setRequestStatus((prev) => ({ ...prev, [targetUser.id]: "error" }));
      setRequestError((prev) => ({ ...prev, [targetUser.id]: err.message }));
    }
  };

  return (
    <Paper elevation={2} sx={{ minWidth: 400, width: "100%", maxWidth: 600 }}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Recommended Friends
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : recommendations.length > 0 ? (
          <List>
            {recommendations.map((rec) => (
              <ListItem key={rec.id} alignItems="center" disableGutters>
                <ListItemAvatar>
                  <Avatar src={rec.avatar_url} alt={rec.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Link
                      to={`/profile/${rec.id}`}
                      style={{
                        color: "#fff", 
                        textDecoration: "none",
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      {rec.name}
                    </Link>
                  }
                  secondary={`${rec.mutualCount} mutual friend${rec.mutualCount && rec.mutualCount > 1 ? "s" : ""}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      minWidth: 100,
                      bgcolor: "#232b2b",
                      color: "#fff",
                      "&:hover": { bgcolor: "#2a3439" }
                    }}
                    disabled={requestStatus[rec.id] === "loading" || requestStatus[rec.id] === "sent"}
                    onClick={() => handleSendRequest(rec)}
                  >
                    {requestStatus[rec.id] === "loading"
                      ? <CircularProgress size={20} sx={{ color: "#fff" }} />
                      : requestStatus[rec.id] === "sent"
                      ? "Sent"
                      : "Send Request"}
                  </Button>
                </ListItemSecondaryAction>
                {requestStatus[rec.id] === "error" && (
                  <Alert severity="error" sx={{ ml: 2 }}>
                    {requestError[rec.id]}
                  </Alert>
                )}
              </ListItem>
            ))}
          </List>
        ) : recentUsers.length > 0 ? (
          <>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              Recently joined users
            </Typography>
            <List>
              {recentUsers.map((user) => (
                <ListItem key={user.id} alignItems="center" disableGutters>
                  <ListItemAvatar>
                    <Avatar src={user.avatar_url} alt={user.name} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Link
                        to={`/profile/${user.id}`}
                        style={{
                          color: "#232b2b", // gunmetal grey
                          textDecoration: "none",
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        {user.name}
                      </Link>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        minWidth: 100,
                        bgcolor: "#232b2b",
                        color: "#fff",
                        "&:hover": { bgcolor: "#2a3439" }
                      }}
                      disabled={requestStatus[user.id] === "loading" || requestStatus[user.id] === "sent"}
                      onClick={() => handleSendRequest(user)}
                    >
                      {requestStatus[user.id] === "loading"
                        ? <CircularProgress size={20} sx={{ color: "#fff" }} />
                        : requestStatus[user.id] === "sent"
                        ? "Sent"
                        : "Send Request"}
                    </Button>
                  </ListItemSecondaryAction>
                  {requestStatus[user.id] === "error" && (
                    <Alert severity="error" sx={{ ml: 2 }}>
                      {requestError[user.id]}
                    </Alert>
                  )}
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No recommendations yet!
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
