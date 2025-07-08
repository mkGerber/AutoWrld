import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Search, PersonAdd, PersonRemove, People } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";

export const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState<{ [id: string]: string }>(
    {}
  );
  const [viewingOtherUser, setViewingOtherUser] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Get URL parameters
  const tabParam = searchParams.get("tab");
  const userIdParam = searchParams.get("userId");
  const targetUserId = userIdParam || user?.id;

  useEffect(() => {
    // Set active tab based on URL parameter
    if (tabParam === "followers") {
      setActiveTab(1);
    } else {
      setActiveTab(0);
    }
  }, [tabParam]);

  useEffect(() => {
    const fetchFollowData = async () => {
      if (!targetUserId) return;
      setLoading(true);
      try {
        // Fetch users that the target user follows
        const { data: followingData, error: followingError } = await supabase
          .from("follows")
          .select(
            `id, created_at, followed:followed_id (id, name, username, avatar_url)`
          )
          .eq("follower_id", targetUserId)
          .order("created_at", { ascending: false });
        if (followingError) throw followingError;

        // Fetch users that follow the target user
        const { data: followersData, error: followersError } = await supabase
          .from("follows")
          .select(
            `id, created_at, follower:follower_id (id, name, username, avatar_url)`
          )
          .eq("followed_id", targetUserId)
          .order("created_at", { ascending: false });
        if (followersError) throw followersError;

        setFollowing(followingData || []);
        setFollowers(followersData || []);

        // If viewing another user's profile, fetch their profile info
        if (userIdParam && userIdParam !== user?.id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, name, username, avatar_url")
            .eq("id", userIdParam)
            .single();
          setOtherUserProfile(profileData);
          setViewingOtherUser(true);
        } else {
          setViewingOtherUser(false);
          setOtherUserProfile(null);
        }
      } catch (err) {
        console.error("Error fetching follow data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowData();
  }, [targetUserId, userIdParam, user?.id]);

  // Fetch recommendations (only for current user)
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || viewingOtherUser) {
        setLoadingRecommendations(false);
        return;
      }

      setLoadingRecommendations(true);
      try {
        // Get users that the current user follows
        const { data: following, error: followingError } = await supabase
          .from("follows")
          .select("followed_id")
          .eq("follower_id", user.id);

        if (followingError) throw followingError;

        // Build a set of following IDs
        const followingIds = new Set<string>();
        following?.forEach((f) => {
          followingIds.add(f.followed_id);
        });

        // Get users that your following users follow (excluding yourself and your following)
        let mutualMap: Record<string, { count: number; user: any }> = {};

        for (const fid of followingIds) {
          const { data: fof, error: fofError } = await supabase
            .from("follows")
            .select(
              "followed_id, followed:followed_id(id, name, username, avatar_url)"
            )
            .eq("follower_id", fid);

          if (fofError) throw fofError;

          fof?.forEach((f) => {
            const otherId = f.followed_id;
            if (otherId !== user.id && !followingIds.has(otherId)) {
              // Get user info
              const userInfo = f.followed;
              if (!mutualMap[otherId]) {
                mutualMap[otherId] = { count: 1, user: userInfo };
              } else {
                mutualMap[otherId].count += 1;
              }
            }
          });
        }

        // Convert to array and sort by mutual count
        const recs = Object.entries(mutualMap)
          .map(([id, { count, user }]) => ({
            id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            mutualCount: count,
          }))
          .sort((a, b) => b.mutualCount - a.mutualCount)
          .slice(0, 5); // top 5

        setRecommendations(recs);

        // If no recommendations, get recent users
        if (recs.length === 0) {
          const excludeIds = [user.id, ...Array.from(followingIds)];
          const { data: recent, error: recentError } = await supabase
            .from("profiles")
            .select("id, name, username, avatar_url")
            .not("id", "in", `(${excludeIds.join(",")})`)
            .order("created_at", { ascending: false })
            .limit(5);

          if (recentError) throw recentError;
          setRecentUsers(recent || []);
        } else {
          setRecentUsers([]);
        }

        // Check for existing follows for each user
        const displayUsers = recs.length > 0 ? recs : recentUsers;
        if (displayUsers.length > 0) {
          const ids = displayUsers.map((u) => u.id);
          const { data: follows, error: checkError } = await supabase
            .from("follows")
            .select("followed_id")
            .eq("follower_id", user.id)
            .in("followed_id", ids);

          if (checkError) throw checkError;

          // Build a map of userId -> status
          const statusMap: Record<string, "following"> = {};
          follows?.forEach((f) => {
            statusMap[f.followed_id] = "following";
          });

          // Set followStatus for each user
          setFollowStatus((prev) => {
            const updated = { ...prev };
            displayUsers.forEach((u) => {
              if (statusMap[u.id] === "following") updated[u.id] = "following";
              else updated[u.id] = "idle";
            });
            return updated;
          });
        }
      } catch (err: any) {
        console.error("Error in fetchRecommendations:", err);
        setRecommendations([]);
        setRecentUsers([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [user, viewingOtherUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const newTab = newValue === 0 ? "following" : "followers";
    setSearchParams({
      tab: newTab,
      ...(userIdParam && { userId: userIdParam }),
    });
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url")
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(5);
      if (error) throw error;
      const filtered = data?.filter((u) => u.id !== user?.id) || [];
      setSearchResults(filtered);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollow = async (targetUser: any) => {
    if (!user) return;
    setFollowStatus((prev) => ({ ...prev, [targetUser.id]: "loading" }));
    try {
      // Check if already following
      const { data: existing, error: checkError } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("followed_id", targetUser.id)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) {
        setFollowStatus((prev) => ({ ...prev, [targetUser.id]: "following" }));
        return;
      }
      // Follow user
      const { error: followError } = await supabase.from("follows").insert({
        follower_id: user.id,
        followed_id: targetUser.id,
      });
      if (followError) throw followError;
      setFollowStatus((prev) => ({ ...prev, [targetUser.id]: "following" }));
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error("Error following user:", err);
      setFollowStatus((prev) => ({ ...prev, [targetUser.id]: "error" }));
    }
  };

  const handleUnfollow = async (followId: string) => {
    if (!user || viewingOtherUser) return;
    try {
      await supabase.from("follows").delete().eq("id", followId);
      setFollowing(following.filter((f) => f.id !== followId));
    } catch (err) {
      console.error("Error unfollowing:", err);
    }
  };

  const renderUserItem = (item: any, isFollowing: boolean = false) => {
    const profile = isFollowing ? item.followed : item.follower;
    return (
      <ListItem
        key={item.id}
        sx={{
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "rgba(212, 175, 55, 0.1)",
            borderRadius: 1,
          },
        }}
        onClick={() => navigate(`/profile/${profile.id}`)}
      >
        <ListItemAvatar>
          <Avatar src={profile.avatar_url} alt={profile.name} />
        </ListItemAvatar>
        <ListItemText
          primary={profile.name}
          secondary={`@${profile.username}`}
          primaryTypographyProps={{
            sx: { color: "#fff" },
          }}
          secondaryTypographyProps={{
            sx: { color: "rgba(255, 255, 255, 0.7)" },
          }}
        />
        {isFollowing && !viewingOtherUser && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleUnfollow(item.id);
            }}
            sx={{ color: "error.main" }}
          >
            <PersonRemove />
          </IconButton>
        )}
      </ListItem>
    );
  };

  const renderRecommendationItem = (item: any, isRecent: boolean = false) => (
    <ListItem key={item.id}>
      <ListItemAvatar>
        <Avatar src={item.avatar_url} alt={item.name} />
      </ListItemAvatar>
      <ListItemText
        primary={item.name}
        secondary={
          <>
            @{item.username}
            {!isRecent && item.mutualCount > 0 && (
              <Typography
                component="span"
                variant="body2"
                sx={{
                  display: "block",
                  color: "#d4af37",
                  fontSize: "0.75rem",
                }}
              >
                {item.mutualCount} mutual follow
                {item.mutualCount !== 1 ? "s" : ""}
              </Typography>
            )}
          </>
        }
        primaryTypographyProps={{
          sx: { color: "#fff" },
        }}
        secondaryTypographyProps={{
          sx: { color: "rgba(255, 255, 255, 0.7)" },
        }}
      />
      <Button
        variant="contained"
        size="small"
        startIcon={<PersonAdd />}
        onClick={() => handleFollow(item)}
        disabled={followStatus[item.id] === "following"}
      >
        {followStatus[item.id] === "following" ? "Following" : "Follow"}
      </Button>
    </ListItem>
  );

  const getTitle = () => {
    if (viewingOtherUser && otherUserProfile) {
      return `${otherUserProfile.name}'s ${
        activeTab === 0 ? "Following" : "Followers"
      }`;
    }
    return "Friends";
  };

  const displayRecommendations =
    recommendations.length > 0 ? recommendations : recentUsers;
  const isRecent = recommendations.length === 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#d4af37", mb: 3 }}>
        {getTitle()}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {/* Search Section */}
          <Card sx={{ mb: 3, background: "rgba(30, 30, 40, 0.98)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: "#d4af37" }}>
                Search Users
              </Typography>
              <TextField
                fullWidth
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              {searchLoading && <CircularProgress size={20} />}
              {searchQuery.trim() && searchResults.length > 0 && (
                <List>
                  {searchResults.map((user) => (
                    <ListItem key={user.id}>
                      <ListItemAvatar>
                        <Avatar src={user.avatar_url} alt={user.name} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={`@${user.username}`}
                        primaryTypographyProps={{
                          sx: { color: "#fff" },
                        }}
                        secondaryTypographyProps={{
                          sx: { color: "rgba(255, 255, 255, 0.7)" },
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PersonAdd />}
                        onClick={() => handleFollow(user)}
                        disabled={followStatus[user.id] === "following"}
                      >
                        {followStatus[user.id] === "following"
                          ? "Following"
                          : "Follow"}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Recommendations Section - Only show for current user */}
          {!viewingOtherUser && (
            <Card sx={{ mb: 3, background: "rgba(30, 30, 40, 0.98)" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: "#d4af37" }}>
                  {isRecent ? "Recently Joined" : "Recommended Users"}
                </Typography>
                {loadingRecommendations ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={20} />
                  </Box>
                ) : displayRecommendations.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ py: 2 }}
                  >
                    No recommendations available.
                  </Typography>
                ) : (
                  <List>
                    {displayRecommendations.map((item) =>
                      renderRecommendationItem(item, isRecent)
                    )}
                  </List>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          {/* Following/Followers Tabs */}
          <Card sx={{ background: "rgba(30, 30, 40, 0.98)" }}>
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  mb: 3,
                  "& .MuiTab-root": {
                    color: "rgba(255, 255, 255, 0.7)",
                    "&.Mui-selected": {
                      color: "#d4af37",
                    },
                  },
                }}
              >
                <Tab
                  label={`Following (${following.length})`}
                  icon={<People />}
                  iconPosition="start"
                />
                <Tab
                  label={`Followers (${followers.length})`}
                  icon={<People />}
                  iconPosition="start"
                />
              </Tabs>

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : activeTab === 0 ? (
                following.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ py: 4 }}
                  >
                    {viewingOtherUser
                      ? "Not following anyone yet."
                      : "You are not following anyone yet."}
                  </Typography>
                ) : (
                  <List>
                    {following.map((item) => renderUserItem(item, true))}
                  </List>
                )
              ) : followers.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 4 }}
                >
                  {viewingOtherUser
                    ? "No followers yet."
                    : "You have no followers yet."}
                </Typography>
              ) : (
                <List>
                  {followers.map((item) => renderUserItem(item, false))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
