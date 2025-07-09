import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { Provider } from "react-redux";
import { store } from "./store";
import { theme } from "./theme";
import { Layout } from "./components/common/Layout";
import { Home } from "./pages/Home";
import { Events } from "./pages/Events";
import { Garage } from "./pages/Garage";
import { Profile } from "./pages/Profile";
import { VehicleDetails } from "./pages/VehicleDetails";
import { AuthProvider } from "./context/AuthContext";
import AuthPage from "./pages/Auth";
import ProtectedRoute from "./components/common/ProtectedRoute";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import SetupProfile from "./pages/SetupProfile";
import { EventDetails } from "./pages/EventDetails";
import { Discover } from "./pages/Discover";
import { Friends } from "./pages/Friends";
import { ChatRoom } from "./components/chat/ChatRoom";
import { Groups } from "./pages/Chats";
import LPR from "./pages/LPR";
import { Feed } from "./pages/Feed";
import { GroupDetails } from "./pages/GroupDetails";
import { Badges } from "./pages/Badges";

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/setup-profile" element={<SetupProfile />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/garage" element={<Garage />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/:userId" element={<Profile />} />
                        <Route path="/discover" element={<Discover />} />
                        <Route path="/friends" element={<Friends />} />
                        <Route path="/chats" element={<Groups />} />
                        <Route
                          path="/vehicle/:id"
                          element={<VehicleDetails />}
                        />
                        <Route path="/events/:id" element={<EventDetails />} />
                        <Route path="/chat/:id" element={<ChatRoom />} />
                        <Route path="/lpr" element={<LPR />} />
                        <Route path="/feed" element={<Feed />} />
                        <Route
                          path="/group/:id/details"
                          element={<GroupDetails />}
                        />
                        <Route path="/badges" element={<Badges />} />
                      </Routes>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
