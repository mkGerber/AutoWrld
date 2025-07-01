import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Favorite, FavoriteBorder, Comment, Close } from "@mui/icons-material";
import { supabase } from "../services/supabase/client";
import { useAuth } from "../context/AuthContext";
import MobileStepper from "@mui/material/MobileStepper";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

export const Feed = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [imageStep, setImageStep] = useState<{ [postId: string]: number }>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`*, user:profiles(name, avatar_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user:profiles(name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setComments(error ? [] : data || []);
    setCommentsLoading(false);
  };

  const handleOpenComments = (post: any) => {
    setSelectedPost(post);
    setCommentDialogOpen(true);
    fetchComments(post.id);
  };

  const handleCloseComments = () => {
    setCommentDialogOpen(false);
    setSelectedPost(null);
    setCommentText("");
  };

  const handleLike = (postId: string) => {
    // TODO: Implement like logic
  };

  const handleAddComment = async () => {
    // TODO: Implement comment logic
    setSubmittingComment(true);
    setTimeout(() => {
      setSubmittingComment(false);
      setCommentText("");
      handleCloseComments();
    }, 1000);
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 4,
        px: isMobile ? 1 : 2,
        background: theme.palette.background.default,
      }}
    >
      <Typography
        variant={isMobile ? "h5" : "h4"}
        sx={{ mb: 3, fontWeight: 700 }}
      >
        Feed
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ mt: 8 }}>
          No posts yet.
        </Typography>
      ) : (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          {posts.map((post) => {
            const images = Array.isArray(post.images) ? post.images : [];
            const step = imageStep[post.id] || 0;
            return (
              <Card
                key={post.id}
                sx={{
                  width: "100%",
                  maxWidth: 500,
                  borderRadius: 3,
                  boxShadow: 2,
                  mb: 2,
                }}
              >
                {images.length > 1 ? (
                  <Box sx={{ position: "relative" }}>
                    <CardMedia
                      component="img"
                      height={isMobile ? 180 : 300}
                      image={images[step]}
                      alt="Post image"
                      sx={{
                        objectFit: "cover",
                        width: "100%",
                        maxHeight: 300,
                        minHeight: 180,
                      }}
                    />
                    <MobileStepper
                      steps={images.length}
                      position="static"
                      activeStep={step}
                      sx={{
                        background: "rgba(0,0,0,0.2)",
                        position: "absolute",
                        bottom: 0,
                        width: "100%",
                        justifyContent: "center",
                      }}
                      nextButton={
                        <IconButton
                          size="small"
                          onClick={() =>
                            setImageStep((prev) => ({
                              ...prev,
                              [post.id]: Math.min(step + 1, images.length - 1),
                            }))
                          }
                          disabled={step === images.length - 1}
                        >
                          <KeyboardArrowRight />
                        </IconButton>
                      }
                      backButton={
                        <IconButton
                          size="small"
                          onClick={() =>
                            setImageStep((prev) => ({
                              ...prev,
                              [post.id]: Math.max(step - 1, 0),
                            }))
                          }
                          disabled={step === 0}
                        >
                          <KeyboardArrowLeft />
                        </IconButton>
                      }
                    />
                  </Box>
                ) : images[0] ? (
                  <CardMedia
                    component="img"
                    height={isMobile ? 180 : 300}
                    image={images[0]}
                    alt="Post image"
                    sx={{
                      objectFit: "cover",
                      width: "100%",
                      maxHeight: 300,
                      minHeight: 180,
                    }}
                  />
                ) : null}
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar src={post.user?.avatar_url} sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {post.user?.name || "Anonymous"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {new Date(post.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {post.content}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mt: 1,
                    }}
                  >
                    <IconButton onClick={() => handleLike(post.id)}>
                      {post.is_liked ? (
                        <Favorite sx={{ color: "#d4af37" }} />
                      ) : (
                        <FavoriteBorder />
                      )}
                    </IconButton>
                    <Typography variant="body2">
                      {post.likes_count || 0}
                    </Typography>
                    <IconButton onClick={() => handleOpenComments(post)}>
                      <Comment />
                    </IconButton>
                    <Typography variant="body2">
                      {post.comments_count || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Comments Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={handleCloseComments}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Comments
          <IconButton onClick={handleCloseComments}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {commentsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : comments.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ my: 2 }}>
              No comments yet.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {comments.map((comment) => (
                <Box
                  key={comment.id}
                  sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}
                >
                  <Avatar
                    src={comment.user?.avatar_url}
                    alt={comment.user?.name}
                  />
                  <Box>
                    <Typography variant="subtitle2">
                      {comment.user?.name || "Anonymous"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {new Date(comment.created_at).toLocaleString()}
                    </Typography>
                    <Typography variant="body1">{comment.content}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <TextField
            label="Add a comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            disabled={submittingComment}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#d4af37",
              color: "#0a0f2c",
              fontWeight: 600,
            }}
            onClick={handleAddComment}
            disabled={submittingComment || !commentText.trim()}
          >
            {submittingComment ? "Posting..." : "Post"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Feed;
