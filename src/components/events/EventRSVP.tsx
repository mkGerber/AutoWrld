import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from "@mui/material";
import { supabase } from "../../services/supabase/client";
import { useAuth } from "../../context/AuthContext";

interface EventRSVPProps {
  eventId: string;
  maxAttendees?: number;
  currentAttendees: number;
  onSuccess: () => void;
}

export const EventRSVP = ({
  eventId,
  maxAttendees,
  currentAttendees,
  onSuccess,
}: EventRSVPProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"attending" | "maybe" | "not_attending">(
    "attending"
  );
  const [loading, setLoading] = useState(false);

  const handleRSVP = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Check if user already has an RSVP
      const { data: existingRSVP } = await supabase
        .from("event_attendees")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single();

      if (existingRSVP) {
        // Update existing RSVP
        const { error } = await supabase
          .from("event_attendees")
          .update({ status })
          .eq("id", existingRSVP.id);

        if (error) throw error;
      } else {
        // Check if event is full
        if (maxAttendees && currentAttendees >= maxAttendees) {
          throw new Error("Event is full");
        }

        // Create new RSVP
        const { error } = await supabase.from("event_attendees").insert({
          event_id: eventId,
          user_id: user.id,
          status,
        });

        if (error) throw error;
      }

      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error("Error updating RSVP:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        fullWidth
        onClick={() => setOpen(true)}
        sx={{
          backgroundColor: "#d4af37",
          color: "#0a0f2c",
          "&:hover": { backgroundColor: "#e4bf47" },
        }}
      >
        RSVP Now
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>RSVP to Event</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Your Attendance Status</FormLabel>
            <RadioGroup
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <FormControlLabel
                value="attending"
                control={<Radio />}
                label="I'm Attending"
              />
              <FormControlLabel
                value="maybe"
                control={<Radio />}
                label="Maybe"
              />
              <FormControlLabel
                value="not_attending"
                control={<Radio />}
                label="Not Attending"
              />
            </RadioGroup>
          </FormControl>
          {maxAttendees && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {currentAttendees} of {maxAttendees} spots filled
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRSVP}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: "#d4af37",
              color: "#0a0f2c",
              "&:hover": { backgroundColor: "#e4bf47" },
            }}
          >
            {loading ? "Updating..." : "Confirm RSVP"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
