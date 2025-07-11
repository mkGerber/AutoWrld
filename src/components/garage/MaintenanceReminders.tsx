import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Schedule,
  DirectionsCar,
  CalendarToday,
  AttachMoney,
  Build,
  History,
} from "@mui/icons-material";
import { supabase } from "../../services/supabase/client";
import { useAuth } from "../../context/AuthContext";

interface MaintenanceReminder {
  id: string;
  vehicle_id: string;
  title: string;
  description?: string;
  reminder_type: "mileage" | "time" | "both";
  interval_miles?: number;
  interval_months?: number;
  last_service_miles?: number;
  last_service_date?: string;
  next_reminder_date?: string;
  next_reminder_miles?: number;
  is_active: boolean;
  priority: "high" | "medium" | "low";
  estimated_cost?: number;
  service_provider?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  reminder_id?: string;
  title: string;
  description?: string;
  service_date: string;
  service_miles?: number;
  cost?: number;
  service_provider?: string;
  notes?: string;
  photos?: string[];
  created_at: string;
}

interface MaintenanceRemindersProps {
  vehicleId: string;
  vehicleMiles?: number;
}

const priorityColors = {
  high: "#f44336",
  medium: "#ff9800",
  low: "#4caf50",
};

const reminderTypeLabels = {
  mileage: "Mileage-based",
  time: "Time-based",
  both: "Mileage & Time",
};

export const MaintenanceReminders: React.FC<MaintenanceRemindersProps> = ({
  vehicleId,
  vehicleMiles = 0,
}) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [maintenanceLog, setMaintenanceLog] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] =
    useState<MaintenanceReminder | null>(null);
  const [selectedReminder, setSelectedReminder] =
    useState<MaintenanceReminder | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminder_type: "mileage" as "mileage" | "time" | "both",
    interval_miles: "",
    interval_months: "",
    priority: "medium" as "high" | "medium" | "low",
    estimated_cost: "",
    service_provider: "",
    notes: "",
  });
  const [logFormData, setLogFormData] = useState({
    title: "",
    description: "",
    service_date: new Date().toISOString().split("T")[0],
    service_miles: "",
    cost: "",
    service_provider: "",
    notes: "",
  });

  useEffect(() => {
    fetchReminders();
    fetchMaintenanceLog();
  }, [vehicleId]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_reminders")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("next_reminder_date", { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  };

  const fetchMaintenanceLog = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_log")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("service_date", { ascending: false });

      if (error) throw error;
      setMaintenanceLog(data || []);
    } catch (error) {
      console.error("Error fetching maintenance log:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = () => {
    setEditingReminder(null);
    setFormData({
      title: "",
      description: "",
      reminder_type: "mileage",
      interval_miles: "",
      interval_months: "",
      priority: "medium",
      estimated_cost: "",
      service_provider: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleEditReminder = (reminder: MaintenanceReminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || "",
      reminder_type: reminder.reminder_type,
      interval_miles: reminder.interval_miles?.toString() || "",
      interval_months: reminder.interval_months?.toString() || "",
      priority: reminder.priority,
      estimated_cost: reminder.estimated_cost?.toString() || "",
      service_provider: reminder.service_provider || "",
      notes: reminder.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSaveReminder = async () => {
    if (!formData.title) return;

    try {
      const reminderData = {
        vehicle_id: vehicleId,
        title: formData.title,
        description: formData.description || null,
        reminder_type: formData.reminder_type,
        interval_miles: formData.interval_miles
          ? parseInt(formData.interval_miles)
          : null,
        interval_months: formData.interval_months
          ? parseInt(formData.interval_months)
          : null,
        priority: formData.priority,
        estimated_cost: formData.estimated_cost
          ? parseFloat(formData.estimated_cost)
          : null,
        service_provider: formData.service_provider || null,
        notes: formData.notes || null,
      };

      if (editingReminder) {
        const { error } = await supabase
          .from("maintenance_reminders")
          .update(reminderData)
          .eq("id", editingReminder.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("maintenance_reminders")
          .insert(reminderData);
        if (error) throw error;
      }

      setDialogOpen(false);
      fetchReminders();
    } catch (error) {
      console.error("Error saving reminder:", error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;

    try {
      const { error } = await supabase
        .from("maintenance_reminders")
        .delete()
        .eq("id", reminderId);
      if (error) throw error;
      fetchReminders();
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  const handleCompleteService = (reminder: MaintenanceReminder) => {
    setSelectedReminder(reminder);
    setLogFormData({
      title: reminder.title,
      description: reminder.description || "",
      service_date: new Date().toISOString().split("T")[0],
      service_miles: vehicleMiles.toString(),
      cost: reminder.estimated_cost?.toString() || "",
      service_provider: reminder.service_provider || "",
      notes: "",
    });
    setLogDialogOpen(true);
  };

  const handleSaveLogEntry = async () => {
    if (!logFormData.title || !logFormData.service_date) return;

    try {
      const logData = {
        vehicle_id: vehicleId,
        reminder_id: selectedReminder?.id || null,
        title: logFormData.title,
        description: logFormData.description || null,
        service_date: logFormData.service_date,
        service_miles: logFormData.service_miles
          ? parseInt(logFormData.service_miles)
          : null,
        cost: logFormData.cost ? parseFloat(logFormData.cost) : null,
        service_provider: logFormData.service_provider || null,
        notes: logFormData.notes || null,
      };

      const { error } = await supabase.from("maintenance_log").insert(logData);
      if (error) throw error;

      // Update the reminder with new last service info
      if (selectedReminder) {
        const { error: updateError } = await supabase
          .from("maintenance_reminders")
          .update({
            last_service_date: logFormData.service_date,
            last_service_miles: logFormData.service_miles
              ? parseInt(logFormData.service_miles)
              : null,
            next_reminder_date: selectedReminder.interval_months
              ? new Date(logFormData.service_date).setMonth(
                  new Date(logFormData.service_date).getMonth() +
                    selectedReminder.interval_months
                )
              : null,
            next_reminder_miles:
              selectedReminder.interval_miles && logFormData.service_miles
                ? parseInt(logFormData.service_miles) +
                  selectedReminder.interval_miles
                : null,
          })
          .eq("id", selectedReminder.id);
        if (updateError) throw updateError;
      }

      setLogDialogOpen(false);
      fetchReminders();
      fetchMaintenanceLog();
    } catch (error) {
      console.error("Error saving log entry:", error);
    }
  };

  const getReminderStatus = (reminder: MaintenanceReminder) => {
    const now = new Date();
    const nextDate = reminder.next_reminder_date
      ? new Date(reminder.next_reminder_date)
      : null;
    const nextMiles = reminder.next_reminder_miles || 0;

    if (nextDate && nextDate <= now) return "overdue";
    if (
      nextDate &&
      nextDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    )
      return "due-soon";
    if (nextMiles > 0 && vehicleMiles >= nextMiles) return "overdue";
    if (nextMiles > 0 && vehicleMiles >= nextMiles - 1000) return "due-soon";
    return "upcoming";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return "#f44336";
      case "due-soon":
        return "#ff9800";
      default:
        return "#4caf50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <Warning />;
      case "due-soon":
        return <Schedule />;
      default:
        return <CheckCircle />;
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: "#d4af37" }}>
          Maintenance Reminders
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddReminder}
          sx={{
            backgroundColor: "#d4af37",
            "&:hover": { backgroundColor: "#b8941f" },
          }}
        >
          Add Reminder
        </Button>
      </Box>

      {/* Active Reminders */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {reminders
          .filter((r) => r.is_active)
          .map((reminder) => {
            const status = getReminderStatus(reminder);
            return (
              <Grid item xs={12} md={6} lg={4} key={reminder.id}>
                <Card
                  sx={{
                    border: `2px solid ${getStatusColor(status)}`,
                    position: "relative",
                    "&:hover": { boxShadow: 4 },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {reminder.title}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Complete Service">
                          <IconButton
                            size="small"
                            onClick={() => handleCompleteService(reminder)}
                            sx={{ color: "#4caf50" }}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditReminder(reminder)}
                            sx={{ color: "#2196f3" }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            sx={{ color: "#f44336" }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      {getStatusIcon(status)}
                      <Chip
                        label={reminderTypeLabels[reminder.reminder_type]}
                        size="small"
                        sx={{ fontSize: "0.75rem" }}
                      />
                      <Chip
                        label={reminder.priority}
                        size="small"
                        sx={{
                          backgroundColor: priorityColors[reminder.priority],
                          color: "white",
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>

                    {reminder.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {reminder.description}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {reminder.next_reminder_date && (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CalendarToday
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            Due:{" "}
                            {new Date(
                              reminder.next_reminder_date
                            ).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      {reminder.next_reminder_miles && (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <DirectionsCar
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            Due at:{" "}
                            {reminder.next_reminder_miles.toLocaleString()}{" "}
                            miles
                          </Typography>
                        </Box>
                      )}
                      {reminder.estimated_cost && (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <AttachMoney
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            Est. Cost: ${reminder.estimated_cost}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
      </Grid>

      {/* Maintenance History */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ color: "#d4af37", mb: 2 }}>
          Maintenance History
        </Typography>
        <List>
          {maintenanceLog.map((log, index) => (
            <React.Fragment key={log.id}>
              <ListItem>
                <ListItemText
                  primary={log.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(log.service_date).toLocaleDateString()}
                        {log.service_miles &&
                          ` • ${log.service_miles.toLocaleString()} miles`}
                        {log.cost && ` • $${log.cost}`}
                        {log.service_provider && ` • ${log.service_provider}`}
                      </Typography>
                      {log.description && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {log.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < maintenanceLog.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* Add/Edit Reminder Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingReminder
            ? "Edit Maintenance Reminder"
            : "Add Maintenance Reminder"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Reminder Type</InputLabel>
                <Select
                  value={formData.reminder_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminder_type: e.target.value as any,
                    })
                  }
                  label="Reminder Type"
                >
                  <MenuItem value="mileage">Mileage-based</MenuItem>
                  <MenuItem value="time">Time-based</MenuItem>
                  <MenuItem value="both">Mileage & Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as any,
                    })
                  }
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(formData.reminder_type === "mileage" ||
              formData.reminder_type === "both") && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Interval (miles)"
                  type="number"
                  fullWidth
                  value={formData.interval_miles}
                  onChange={(e) =>
                    setFormData({ ...formData, interval_miles: e.target.value })
                  }
                />
              </Grid>
            )}
            {(formData.reminder_type === "time" ||
              formData.reminder_type === "both") && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Interval (months)"
                  type="number"
                  fullWidth
                  value={formData.interval_months}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interval_months: e.target.value,
                    })
                  }
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                label="Estimated Cost"
                type="number"
                fullWidth
                value={formData.estimated_cost}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_cost: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Service Provider"
                fullWidth
                value={formData.service_provider}
                onChange={(e) =>
                  setFormData({ ...formData, service_provider: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveReminder}
            variant="contained"
            sx={{ backgroundColor: "#d4af37" }}
          >
            {editingReminder ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Service Dialog */}
      <Dialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Service</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Service Title"
                fullWidth
                value={logFormData.title}
                onChange={(e) =>
                  setLogFormData({ ...logFormData, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={logFormData.description}
                onChange={(e) =>
                  setLogFormData({
                    ...logFormData,
                    description: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Service Date"
                type="date"
                fullWidth
                value={logFormData.service_date}
                onChange={(e) =>
                  setLogFormData({
                    ...logFormData,
                    service_date: e.target.value,
                  })
                }
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Service Miles"
                type="number"
                fullWidth
                value={logFormData.service_miles}
                onChange={(e) =>
                  setLogFormData({
                    ...logFormData,
                    service_miles: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Cost"
                type="number"
                fullWidth
                value={logFormData.cost}
                onChange={(e) =>
                  setLogFormData({ ...logFormData, cost: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Service Provider"
                fullWidth
                value={logFormData.service_provider}
                onChange={(e) =>
                  setLogFormData({
                    ...logFormData,
                    service_provider: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={logFormData.notes}
                onChange={(e) =>
                  setLogFormData({ ...logFormData, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveLogEntry}
            variant="contained"
            sx={{ backgroundColor: "#d4af37" }}
          >
            Complete Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
