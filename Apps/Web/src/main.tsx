import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* LAYOUTS */

import HospitalFixedLayout from "./layouts/HospitalFixedLayout";
import PoliceFixedLayout from "./layouts/PoliceFixedLayout";

/* MAIN PAGES */

import LandingPage from "./pages/LandingPage";

import HospitalSignup from "./pages/HospitalSignup";
import HospitalLogin from "./pages/HospitalLogin";

import PoliceSignup from "./pages/PoliceSignup";
import PoliceLogin from "./pages/PoliceLogin";

/* HOSPITAL PAGES */

import HospitalDashboard from "./pages/HospitalDashboard";
import AmbulanceLogistics from "./pages/AmbulanceLogistics";
import IncidentLogs from "./pages/IncidentLogs";
import HospitalProfile from "./pages/HospitalProfile";

/* POLICE PAGES */

import PoliceDashboard from "./pages/PoliceDashboard";
import PoliceIncidentLogs from "./pages/PoliceIncidentLogs";
import PoliceProfile from "./pages/PoliceProfile";

/* ROOT */

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <BrowserRouter>

      <Routes>

        {/* LANDING */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* HOSPITAL AUTH */}

        <Route
          path="/hospital-signup"
          element={<HospitalSignup />}
        />

        <Route
          path="/hospital-login"
          element={<HospitalLogin />}
        />

        {/* POLICE AUTH */}

        <Route
          path="/police-signup"
          element={<PoliceSignup />}
        />

        <Route
          path="/police-login"
          element={<PoliceLogin />}
        />

        {/* HOSPITAL PANEL */}

        <Route
          path="/hospital-dashboard"
          element={<HospitalFixedLayout />}
        >

          {/* Dashboard */}

          <Route
             path="/hospital-dashboard"
            element={<HospitalDashboard />}
          />

          {/* Ambulance Logistics */}

          <Route
            path="ambulance-logistics"
            element={
              <AmbulanceLogistics />
            }
          />

          {/* Incident Logs */}

          <Route
            path="incident-logs"
            element={
              <IncidentLogs />
            }
          />

          {/* Hospital Profile */}

          <Route
            path="profile"
            element={
              <HospitalProfile />
            }
          />

        </Route>

        {/* POLICE PANEL */}

        <Route
          path="/police-dashboard"
          element={<PoliceFixedLayout />}
        >

          {/* Dashboard */}

          <Route
            index
            element={<PoliceDashboard />}
          />

          {/* Incident Logs */}

          <Route
            path="incident-logs"
            element={
              <PoliceIncidentLogs />
            }
          />

          {/* Police Profile */}

          <Route
            path="profile"
            element={
              <PoliceProfile />
            }
          />

        </Route>

        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  </React.StrictMode>
);