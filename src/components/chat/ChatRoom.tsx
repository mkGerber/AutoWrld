import { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Autocomplete,
} from "@mui/material";
import {
  Send,
  PersonAdd,
  MoreVert,
  Group,
  PhotoCamera,
  Settings,
  Menu,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
  };
  role: "admin" | "member";
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
}

export const ChatRoom = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineMembers, setOnlineMembers] = useState<
    { id: string; name: string; avatar_url: string | null }[]
  >([]);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchGroup = async () => {
    if (!id) return;

    try {
      const { data: groupData, error: groupError } = await supabase
        .from("group_chats")
        .select(
          "id, name, description, image_url, created_by, created_at, updated_at"
        )
        .eq("id", id)
        .single();

      if (groupError) {
        console.error("Error fetching group:", groupError);
        setError("Failed to load group information. Please try again.");
        return;
      }

      if (!groupData) {
        setError("Group not found.");
        return;
      }

      // Fetch creator information
      const { data: creatorData, error: creatorError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("id", groupData.created_by)
        .single();

      if (creatorError) {
        console.error("Error fetching creator:", creatorError);
        setError("Failed to load creator information. Please try again.");
        return;
      }

      setGroup({
        ...groupData,
        creator: creatorData,
      });
    } catch (error) {
      console.error("Error in fetchGroup:", error);
      setError("Failed to load group information. Please try again.");
    }
  };

  const fetchMessages = async () => {
    if (!id) return;

    try {
      // First fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("group_chat_messages")
        .select("id, content, created_at, sender_id")
        .eq("group_chat_id", id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        setError("Failed to load messages. Please try again.");
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      // Then fetch sender information for all messages
      const senderIds = [...new Set(messagesData.map((msg) => msg.sender_id))];
      const { data: senderData, error: senderError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", senderIds);

      if (senderError) {
        console.error("Error fetching senders:", senderError);
        setError("Failed to load sender information. Please try again.");
        return;
      }

      // Create a map of sender information
      const senderMap = new Map(
        (senderData || []).map((sender) => [sender.id, sender])
      );

      // Format messages with sender information
      const formattedMessages = messagesData.map((msg) => {
        const sender = senderMap.get(msg.sender_id);
        return {
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          sender: sender
            ? {
                id: sender.id,
                name: sender.name,
                avatar_url: sender.avatar_url,
              }
            : {
                id: msg.sender_id,
                name: "Unknown User",
                avatar_url: null,
              },
        };
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      setError("Failed to load messages. Please try again.");
    }
  };

  const fetchMembers = async () => {
    if (!id) return;

    try {
      const { data: membersData, error: membersError } = await supabase
        .from("group_chat_members")
        .select("id, role, joined_at, user_id")
        .eq("group_chat_id", id);

      if (membersError) {
        console.error("Error fetching members:", membersError);
        setError("Failed to load members. Please try again.");
        return;
      }

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        return;
      }

      // Fetch user information for all members
      const userIds = [...new Set(membersData.map((member) => member.user_id))];
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds);

      if (userError) {
        console.error("Error fetching users:", userError);
        setError("Failed to load user information. Please try again.");
        return;
      }

      // Create a map of user information
      const userMap = new Map((userData || []).map((user) => [user.id, user]));

      // Format members with user information
      const formattedMembers = membersData.map((member) => {
        const user = userMap.get(member.user_id);
        return {
          id: member.id,
          role: member.role,
          joined_at: member.joined_at,
          user: user
            ? {
                id: user.id,
                name: user.name,
                avatar_url: user.avatar_url,
              }
            : {
                id: member.user_id,
                name: "Unknown User",
                avatar_url: null,
              },
        };
      });

      setMembers(formattedMembers);
    } catch (error) {
      console.error("Error in fetchMembers:", error);
      setError("Failed to load members. Please try again.");
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user || !id) return;

    let isMounted = true;

    // Load initial data
    const loadData = async () => {
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        await Promise.all([fetchGroup(), fetchMessages(), fetchMembers()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
        if (isMounted) {
          setError("Failed to load chat data. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`group_chat:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chat_messages",
          filter: `group_chat_id=eq.${id}`,
        },
        async (payload) => {
          try {
            const newMessage = payload.new;
            // Fetch sender information
            const { data: senderData, error: senderError } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", newMessage.sender_id)
              .single();

            if (senderError) {
              console.error("Error fetching sender:", senderError);
              return;
            }

            const formattedMessage = {
              id: newMessage.id,
              content: newMessage.content,
              created_at: newMessage.created_at,
              sender: {
                id: newMessage.sender_id,
                name: senderData.name,
                avatar_url: senderData.avatar_url,
              },
            };

            setMessages((prev) => [...prev, formattedMessage]);
            // Scroll to bottom after a short delay to ensure the new message is rendered
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          } catch (error) {
            console.error("Error handling new message:", error);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_chat_messages",
          filter: `group_chat_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    // Subscribe to member changes
    const memberSubscription = supabase
      .channel(`group_members:${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_chat_members",
          filter: `group_chat_id=eq.${id}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    // Set up presence
    const presenceChannel = supabase.channel(`presence:${id}`, {
      config: {
        broadcast: {
          self: true,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const presenceState = presenceChannel.presenceState();
        const onlineMembers = Object.keys(presenceState).map((key) => ({
          id: key,
          name: presenceState[key][0].name,
          avatar_url: presenceState[key][0].avatar_url,
        }));
        setOnlineMembers(onlineMembers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: user.id,
            name: user.user_metadata.name,
            avatar_url: user.user_metadata.avatar_url,
          });
        }
      });

    return () => {
      isMounted = false;
      messageSubscription.unsubscribe();
      memberSubscription.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [user, id]);

  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url")
          .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
          .limit(5);

        if (error) throw error;

        // Filter out users who are already members
        const memberIds = new Set(members.map((member) => member.user.id));
        const filteredResults =
          data?.filter((result) => !memberIds.has(result.id)) || [];

        setSearchResults(filteredResults);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, members]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    try {
      const { error } = await supabase.from("group_chat_messages").insert({
        group_chat_id: id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleAddMember = async (selectedUser: User) => {
    if (!id) return;

    try {
      // Add user to group
      const { error: memberError } = await supabase
        .from("group_chat_members")
        .insert({
          group_chat_id: id,
          user_id: selectedUser.id,
          role: "member",
        });

      if (memberError) throw memberError;

      setAddMemberDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditGroup = async () => {
    if (!id || !user) return;

    try {
      const { error } = await supabase
        .from("group_chats")
        .update({
          name: editedName,
          description: editedDescription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("created_by", user.id);

      if (error) throw error;

      setGroup((prev) =>
        prev
          ? { ...prev, name: editedName, description: editedDescription }
          : null
      );
      setIsEditingGroup(false);
    } catch (error) {
      console.error("Error updating group:", error);
      setError("Failed to update group. Please try again.");
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !id || !user) return;

    try {
      setUploadingImage(true);

      // Upload image to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("group-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("group-images").getPublicUrl(fileName);

      // Update group with new image URL
      const { error: updateError } = await supabase
        .from("group_chats")
        .update({
          image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("created_by", user.id);

      if (updateError) throw updateError;

      setGroup((prev) => (prev ? { ...prev, image_url: publicUrl } : null));
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenSettings = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDescription(group.description || "");
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!group || !user) return;
    setSaving(true);
    let imageUrl = group.image_url;
    try {
      if (editImage) {
        const fileExt = editImage.name.split(".").pop();
        const fileName = `${group.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("group-images")
          .upload(fileName, editImage);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("group-images").getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
      const { error } = await supabase
        .from("group_chats")
        .update({
          name: editName,
          description: editDescription,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", group.id)
        .eq("created_by", user.id);
      if (error) throw error;
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              name: editName,
              description: editDescription,
              image_url: imageUrl,
            }
          : null
      );
      setSettingsOpen(false);
      setEditImage(null);
    } catch (err) {
      setError("Failed to update group.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !user) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    )
      return;
    try {
      // Delete group members
      await supabase
        .from("group_chat_members")
        .delete()
        .eq("group_chat_id", group.id);
      // Delete group messages
      await supabase
        .from("group_chat_messages")
        .delete()
        .eq("group_chat_id", group.id);
      // Delete the group itself
      await supabase
        .from("group_chats")
        .delete()
        .eq("id", group.id)
        .eq("created_by", user.id);
      setSettingsOpen(false);
      navigate("/chats");
    } catch (err) {
      setError("Failed to delete group.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!group) {
    return (
      <Box p={2}>
        <Alert severity="error">Group chat not found</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">{group.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {group.description}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ mr: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {members.length} members • {onlineMembers.length} online
              </Typography>
            </Box>
            <IconButton onClick={() => setAddMemberDialogOpen(true)}>
              <PersonAdd />
            </IconButton>
            {isMobile && (
              <IconButton onClick={() => setMembersDialogOpen(true)}>
                <Menu />
              </IconButton>
            )}
            {user?.id === group.created_by && (
              <IconButton onClick={handleOpenSettings}>
                <Settings />
              </IconButton>
            )}
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Main content area: chat on left, members on right */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Chat/messages area */}
        <Paper
          elevation={2}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            <List>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    flexDirection:
                      message.sender.id === user?.id ? "row-reverse" : "row",
                    gap: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      color={
                        onlineMembers.some(
                          (online) => online.id === message.sender.id
                        )
                          ? "success"
                          : "default"
                      }
                    >
                      <Avatar
                        src={message.sender.avatar_url}
                        alt={message.sender.name}
                      />
                    </Badge>
                  </ListItemAvatar>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1,
                      maxWidth: "70%",
                      backgroundColor:
                        message.sender.id === user?.id
                          ? "rgba(212, 175, 55, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {message.sender.name} •{" "}
                      {new Date(message.created_at).toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          <Divider />

          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{ p: 2, display: "flex", gap: 1 }}
          >
            <TextField
              fullWidth
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              variant="outlined"
              size="small"
            />
            <IconButton
              type="submit"
              color="primary"
              disabled={!newMessage.trim()}
            >
              <Send />
            </IconButton>
          </Box>
        </Paper>

        {/* Members sidebar: only show on desktop */}
        {!isMobile && (
          <Box
            sx={{
              width: 280,
              borderLeft: 1,
              borderColor: "divider",
              p: 2,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "auto",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Members ({members.length})
            </Typography>
            <List>
              {members.map((member) => (
                <ListItem key={member.id}>
                  <ListItemAvatar>
                    <Avatar
                      src={member.user.avatar_url || undefined}
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/profile/${member.user.id}`)}
                    >
                      {member.user.name?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                          color: "#fff",
                        }}
                        onClick={() => navigate(`/profile/${member.user.id}`)}
                      >
                        {member.user.name}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ color: "goldenrod" }}>
                        {member.role}
                      </Typography>
                    }
                  />
                  {onlineMembers.some(
                    (online) => online.id === member.user.id
                  ) && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                        ml: 1,
                      }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>

      <Dialog
        open={addMemberDialogOpen}
        onClose={() => {
          setAddMemberDialogOpen(false);
          setSearchQuery("");
          setSearchResults([]);
        }}
        PaperProps={{ sx: { minWidth: 380 } }}
      >
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <Autocomplete
            freeSolo
            options={searchResults}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : `${option.name} (@${option.username})`
            }
            renderOption={(props, option) => (
              <ListItem {...props}>
                <ListItemAvatar>
                  <Avatar src={option.avatar_url} alt={option.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={option.name}
                  secondary={`@${option.username}`}
                />
              </ListItem>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                margin="dense"
                label="Search users"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={searchLoading}
                sx={{ minWidth: 340 }}
              />
            )}
            loading={searchLoading}
            onChange={(_, value) => {
              if (value && typeof value !== "string") {
                handleAddMember(value);
              }
            }}
            onInputChange={(_, value) => setSearchQuery(value)}
            sx={{ minWidth: 340 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddMemberDialogOpen(false);
              setSearchQuery("");
              setSearchResults([]);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditingGroup} onClose={() => setIsEditingGroup(false)}>
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditingGroup(false)}>Cancel</Button>
          <Button onClick={handleEditGroup} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <Box mt={2} display="flex" alignItems="center">
            {group?.image_url && (
              <Avatar
                src={group.image_url}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={(e) => setEditImage(e.target.files?.[0] || null)}
            />
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              <PhotoCamera />
            </IconButton>
            {editImage && <Typography ml={1}>{editImage.name}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            disabled={saving}
          >
            Save
          </Button>
          <Button onClick={handleDeleteGroup} color="error" disabled={saving}>
            Delete Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Members Dialog for mobile */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        fullWidth
      >
        <DialogTitle>Members ({members.length})</DialogTitle>
        <DialogContent>
          <List>
            {members.map((member) => (
              <ListItem key={member.id}>
                <ListItemAvatar>
                  <Avatar
                    src={member.user.avatar_url || undefined}
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/profile/${member.user.id}`)}
                  >
                    {member.user.name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      sx={{ cursor: "pointer", fontWeight: 500, color: "#fff" }}
                      onClick={() => navigate(`/profile/${member.user.id}`)}
                    >
                      {member.user.name}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ color: "goldenrod" }}>
                      {member.role}
                    </Typography>
                  }
                />
                {onlineMembers.some(
                  (online) => online.id === member.user.id
                ) && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "success.main",
                      ml: 1,
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
