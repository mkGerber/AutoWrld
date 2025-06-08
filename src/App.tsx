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

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/garage" element={<Garage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/vehicle/:id" element={<VehicleDetails />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
