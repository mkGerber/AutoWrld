import { useEffect, useState } from "react";
import { Button } from "@mui/material";
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
  const [loading, setLoading] = useState(false);
  const [isRSVPd, setIsRSVPd] = useState(false);

  useEffect(() => {
    const checkRSVP = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("event_attendees")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single();
      setIsRSVPd(!!data);
    };
    checkRSVP();
  }, [user, eventId]);

  const handleToggleRSVP = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isRSVPd) {
        await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);
      } else {
        if (maxAttendees && currentAttendees >= maxAttendees) {
          setLoading(false);
          return;
        }
        await supabase.from("event_attendees").insert({
          event_id: eventId,
          user_id: user.id,
          status: "attending",
        });
      }
      setIsRSVPd(!isRSVPd);
      onSuccess();
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      fullWidth
      onClick={handleToggleRSVP}
      disabled={loading}
      sx={{
        backgroundColor: isRSVPd ? "#b0b3b8" : "#d4af37",
        color: isRSVPd ? "#23262f" : "#0a0f2c",
        "&:hover": { backgroundColor: isRSVPd ? "#a0a3a8" : "#e4bf47" },
      }}
    >
      {isRSVPd ? "Cancel RSVP" : "RSVP"}
    </Button>
  );
};
