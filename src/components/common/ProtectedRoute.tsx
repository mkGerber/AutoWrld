import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CircularProgress, Box, Alert, Typography } from "@mui/material";
import { supabase } from "../../services/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (
        user &&
        location.pathname !== "/setup-profile" &&
        location.pathname !== "/login"
      ) {
        console.log("ProtectedRoute: Checking profile for user:", user.id);
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        console.log(
          "ProtectedRoute: Profile query result:",
          data,
          "Error:",
          error
        );
        if (error) {
          setProfileError(error.message);
          setHasProfile(false);
        } else if (!data) {
          setHasProfile(false);
          setProfileError(null);
        } else {
          setHasProfile(true);
          setProfileError(null);
        }
        setProfileChecked(true);
      } else {
        setProfileChecked(true);
      }
    };
    if (user && !profileChecked) {
      checkProfile();
    } else if (!user) {
      setProfileChecked(true);
    }
    // eslint-disable-next-line
  }, [user, location.pathname]);

  console.log(
    "ProtectedRoute: user:",
    user,
    "loading:",
    loading,
    "profileChecked:",
    profileChecked,
    "hasProfile:",
    hasProfile,
    "profileError:",
    profileError,
    "pathname:",
    location.pathname
  );

  if (loading || (user && !profileChecked)) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profileError) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Alert severity="error">Profile check error: {profileError}</Alert>
      </Box>
    );
  }

  if (user && !hasProfile && location.pathname !== "/setup-profile") {
    console.log("ProtectedRoute: Redirecting to /setup-profile");
    return <Navigate to="/setup-profile" replace />;
  }

  // Fallback: If all else fails, show a message
  if (!children) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Typography variant="h6" color="error">
          Something went wrong. Please try refreshing the page or contact
          support.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
