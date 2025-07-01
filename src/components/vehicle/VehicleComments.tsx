import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import { supabase } from "../../services/supabase/client";
import { useAuth } from "../../context/AuthContext";

interface VehicleCommentsProps {
  vehicleId: string;
  onCommentChange?: (count: number) => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    avatar_url: string;
  };
}

const VehicleComments = ({
  vehicleId,
  onCommentChange,
}: VehicleCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user:profiles(name, avatar_url)")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false });
    if (error) setError("Failed to load comments");
    setComments(data || []);
    // Notify parent component of comment count change
    if (onCommentChange) {
      onCommentChange(data?.length || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
    // Optionally: subscribe to realtime updates here
  }, [vehicleId]);

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      content: newComment.trim(),
    });
    setPosting(false);
    if (error) {
      setError("Failed to post comment");
    } else {
      setNewComment("");
      fetchComments();
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {comments.length === 0 && (
            <Typography color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          )}
          {comments.map((comment) => (
            <Paper
              key={comment.id}
              sx={{
                p: 2,
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                background: "rgba(30,30,40,0.98)",
              }}
            >
              <Avatar src={comment.user?.avatar_url} alt={comment.user?.name} />
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
            </Paper>
          ))}
        </Box>
      )}
      {user && (
        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <TextField
            label="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            disabled={posting}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#d4af37",
              color: "#0a0f2c",
              fontWeight: 600,
              height: "fit-content",
              alignSelf: "flex-end",
            }}
            onClick={handleAddComment}
            disabled={posting || !newComment.trim()}
          >
            {posting ? "Posting..." : "Post"}
          </Button>
        </Box>
      )}
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default VehicleComments;
