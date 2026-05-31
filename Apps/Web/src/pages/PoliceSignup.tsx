import { useState } from "react";
import {
  NavLink,
  useNavigate
} from "react-router-dom";

import { signupUser } from "../firebase/auth";


import "../styles/PoliceSignup.css";

function PoliceSignup() {

  const navigate = useNavigate();

  // REQUIRED ONLY
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OPTIONAL
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // SIGNUP
 const handleSignup = async () => {

  try {

    if (password !== confirmPassword) {

      alert("Passwords do not match");

      return;

    }

    await signupUser(
      email,
      password
    );

    alert(
      "Police station registered successfully."
    );

    navigate("/police-login");

  } catch (error: any) {

    alert(error.message);

  }

};

  return (

    <div className="signup-container">

      {/* Navbar */}
      <nav className="signup-navbar">

        <div className="signup-logo">
          RakshaSOS
        </div>

        <div className="signup-nav-links">

          <span>Dashboard</span>

          <span>Incidents</span>

          <span>Resources</span>

          <span>Directory</span>

          <NavLink
            to="/police-signup"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            Police Console
          </NavLink>

        </div>

        <button className="dispatch-btn">
          Dispatch Emergency
        </button>

      </nav>

      {/* Header */}
      <div className="signup-header">

        <div className="critical-badge">
          ● CRITICAL INFRASTRUCTURE ENROLLMENT
        </div>

        <h2>
          Police Station Network Registration
        </h2>

        <p>
          Onboard your jurisdiction into the
          RakshaSOS emergency response network.
        </p>

      </div>

      {/* Main */}
      <div className="signup-main">

        {/* LEFT */}
        <div className="signup-form-card">

          <div className="form-title">
            Official Registration Form
          </div>

          <p className="form-subtitle">
            Only email and password are required.
            Remaining information can be completed later.
          </p>

          {/* SECTION */}
          <div className="section-title">
            STATION IDENTIFICATION
          </div>

          <div className="form-grid">

            <input
              placeholder="Station Name (Optional)"
            />

            {/* REQUIRED EMAIL */}
            <input
              type="email"
              placeholder="Official Email *"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              placeholder="Contact Number (Optional)"
            />

            <input
              placeholder="Full Address (Optional)"
            />

            <input
              placeholder="State (Optional)"
            />

            <input
              placeholder="City (Optional)"
            />

          </div>

          {/* SECTION */}
          <div className="section-title">
            OPERATIONAL PARAMETERS
          </div>

          <div className="form-grid">

            <input
              placeholder="Station Type (Optional)"
            />

            <input
              placeholder="Dispatch Units (Optional)"
            />

          </div>

          {/* TOGGLE */}
          <div className="toggle-box">

            <div>

              <h4>
                24/7 Control Room Active
              </h4>

              <p>
                Station has around-the-clock
                emergency operations.
              </p>

            </div>

            <div className="toggle-switch"></div>

          </div>

          {/* DOCUMENTS */}
          <div className="section-title">
            SECURITY VERIFICATION DOCUMENTS
          </div>

          <div className="upload-grid">

            <div className="upload-card">

              <h4>
                Authorization Letter
              </h4>

              <p>
                Optional during signup
              </p>

              <button>
                Upload PDF
              </button>

            </div>

            <div className="upload-card">

              <h4>
                Govt ID
              </h4>

              <p>
                Optional during signup
              </p>

              <button>
                Upload JPG/PDF
              </button>

            </div>

          </div>

          {/* PASSWORD */}
          <div className="section-title">
            SECURE ACCESS
          </div>

          <div className="form-grid">

            {/* REQUIRED PASSWORD */}
            <input
              type="password"
              placeholder="Password *"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            {/* OPTIONAL CONFIRM */}
            <input
              type="password"
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

          </div>

          {/* BUTTON */}
          <button
            className="register-btn"
            onClick={handleSignup}
          >
            Register Police Station
          </button>

          {/* LOGIN */}
          <div className="login-redirect">

            Already have an account?

            <span
              onClick={() =>
                navigate("/police-login")
              }
            >
              Log In
            </span>

          </div>

        </div>

        {/* RIGHT */}
        <div className="signup-sidebar">

          <div className="sidebar-card">

            <div className="live-title">
              ● LIVE PREVIEW
            </div>

            <div className="mini-card">

              <h4>
                142 Hospitals
              </h4>

              <p>
                Connected in your grid
              </p>

            </div>

            <div className="mini-card">

              <h4>
                89 Active Units
              </h4>

              <p>
                Real-time GPS tracking
              </p>

            </div>

          </div>

          <div className="dark-card">

            <h3>
              Network Reliability
            </h3>

            <p>
              ✔ Verified Government Access
            </p>

            <p>
              ✔ Encrypted Emergency Network
            </p>

            <p>
              ✔ 99.99% Network Uptime
            </p>

          </div>

          <div className="image-card">

            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
              alt="dashboard"
            />

            <div className="image-overlay">
              Modernizing emergency response
              infrastructure
            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

export default PoliceSignup;