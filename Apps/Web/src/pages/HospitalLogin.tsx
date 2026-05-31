import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HospitalLogin.css";

import { loginUser } from "../firebase/auth";

function HospitalLogin() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const user = await loginUser(
        email,
        password
      );

      navigate("/hospital-dashboard");

    } catch (error: any) {

      alert(error.message);

    }

  };

  return (

    <div className="hospital-login-page">

      {/* Navbar */}
      <nav className="hospital-login-navbar">

        <div className="hospital-login-logo">
          RakshaSOS
        </div>

        <div className="hospital-login-links">

          <span>Emergency Network</span>

          <span className="active-link">
            Hospital Coordination
          </span>

          <span>Police Response</span>

          <span>Help Desk</span>

        </div>

        <div className="system-status">
          ● SYSTEM STATUS
        </div>

      </nav>

      {/* Main */}
      <div className="hospital-login-wrapper">

        {/* Left Side */}
        <div className="hospital-info-panel">

          <h2>
            Integrated Emergency Infrastructure
          </h2>

          <p>
            Unified coordination for mission-critical
            medical response.
          </p>

          <div className="feature-item">
            <h4>Priority Patient Routing</h4>

            <p>
              AI-driven hospital allocation based
              on trauma specialty.
            </p>
          </div>

          <div className="feature-item">
            <h4>Real-Time Telemetry</h4>

            <p>
              Secure ambulance-to-ER data synchronization.
            </p>
          </div>

          <div className="feature-item">
            <h4>Inter-Agency Network</h4>

            <p>
              Direct coordination with police and
              municipal dispatch.
            </p>
          </div>

          <div className="feature-item">
            <h4>Secure Infrastructure</h4>

            <p>
              AES-256 encrypted data for medical compliance.
            </p>
          </div>

          <div className="bottom-icons">

            <span>E2E Encrypted</span>
            <span>Real-Time Sync</span>
            <span>Verified Network</span>

          </div>

        </div>

        {/* Right Side */}
        <div className="hospital-login-card">

          <div className="medical-access-badge">
            Verified Medical Infrastructure Access
          </div>

          <h1>
            Hospital Emergency Operations Login
          </h1>

          <p className="hospital-subtitle">
            Secure access for authorized hospitals,
            trauma centers, and emergency departments.
          </p>

          {/* Email */}
          <div className="hospital-input-group">

            <label>
              Official Hospital Email
            </label>

            <input
              type="email"
              placeholder="admin@hospital-group.gov"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>

          {/* Password */}
          <div className="hospital-input-group">

            <div className="password-row">

              <label>
                Secure Password
              </label>

              <span>
                Forgot Password?
              </span>

            </div>

            <input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

          </div>

          {/* Checkbox */}
          <div className="remember-row">

            <input type="checkbox" />

            <span>
              Remember this device
            </span>

          </div>

          {/* Button */}
          <button
            className="hospital-dashboard-btn"
            onClick={handleLogin}
          >
            Access Hospital Dashboard →
          </button>

          {/* Bottom Buttons */}
          <div className="hospital-action-row">

            <button className="support-btn">
              Emergency Access Support
            </button>

            <button
              className="register-btn"
              onClick={() =>
                navigate("/hospital-signup")
              }
            >
              Register Hospital Network
            </button>

          </div>

          <div className="request-access">

            New Hospital?

            <span>
              Request Access Credentials
            </span>

          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="hospital-login-footer">

        <div className="footer-logo">
          RakshaSOS
        </div>

        <p>
          © 2024 RakshaSOS Emergency Response.
          All rights reserved.
        </p>

        <div className="footer-links">

          <span>Privacy Policy</span>
          <span>Emergency Protocols</span>
          <span>Contact Support</span>
          <span>Department Directory</span>

        </div>

      </footer>

    </div>

  );

}

export default HospitalLogin;