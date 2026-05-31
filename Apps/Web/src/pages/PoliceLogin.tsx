import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PoliceLogin.css";



function PoliceLogin() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {



      navigate("/police-dashboard");


  };

  return (

    <div className="police-login-page">

      {/* Navbar */}
      <nav className="police-navbar">

        <div className="police-logo">
          🛡 RakshaSOS
        </div>

        <div className="police-nav-links">

          <span>Emergency Network</span>
          <span>Hospital Coordination</span>

          <span className="active-link">
            Police Response
          </span>

        </div>

        <button className="status-btn">
          Live System Status
        </button>

      </nav>

      {/* Main */}
      <div className="police-login-wrapper">

        {/* Left */}
        <div className="police-login-card">

          <div className="verify-badge">
            ● VERIFIED EMERGENCY INFRASTRUCTURE ACCESS
          </div>

          <h1>
            Police Emergency Operations Login
          </h1>

          <p className="login-subtext">
            Secure access for authorized police stations
            and emergency coordination control rooms.
          </p>

          {/* Email */}
          <div className="police-input-group">

            <label>
              Official Police Station Email
            </label>

            <input
              type="email"
              placeholder="station.id@police.gov.in"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>

          {/* Password */}
          <div className="police-input-group">

            <label>
              Secure Password
            </label>

            <input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

          </div>

          {/* Remember */}
          <div className="remember-device">

            <input type="checkbox" />

            <span>
              Remember this device
            </span>

          </div>

          {/* Links */}
          <div className="login-links">

            <span>
              Forgot Password?
            </span>

            <span>
              Emergency Access Support
            </span>

          </div>

          {/* Button */}
          <button
            className="dashboard-btn"
            onClick={handleLogin}
          >
            Access Police Dashboard →
          </button>

          {/* Bottom Cards */}
          <div className="bottom-security-cards">

            <div className="security-card">
              <h4>
                AES-256 Encryption
              </h4>

              <p>
                End-to-End Emergency Data
              </p>
            </div>

            <div className="security-card">
              <h4>
                Real-Time Sync
              </h4>

              <p>
                Instant Incident Updates
              </p>
            </div>

          </div>

        </div>

        {/* Right */}
        <div className="network-panel">

          <div className="network-header">

            <h3>
              Network Preview
            </h3>

            <span className="live-badge">
              LIVE
            </span>

          </div>

          <div className="network-card">

            <div>
              <h4>
                Active SOS Alerts
              </h4>

              <p>14</p>
            </div>

            <span className="red-dot"></span>

          </div>

          <div className="network-card">

            <div>
              <h4>
                Hospitals Online
              </h4>

              <p>128</p>
            </div>

            <span className="green-text">
              ↗ 99%
            </span>

          </div>

          <div className="network-card">

            <div>
              <h4>
                Police Units Connected
              </h4>

              <p>432</p>
            </div>

          </div>

          <div className="network-card">

            <div>
              <h4>
                Ambulances Active
              </h4>

              <p>87</p>
            </div>

          </div>

          {/* White Box */}
          <div className="verified-box">

            <p>
              <strong>
                24/7 Verified Access:
              </strong>

              Unauthorized access attempts are logged
              and reported to Federal Cybersecurity authorities.
            </p>

          </div>

          {/* Register Box */}
          <div
            className="register-panel"
            onClick={() =>
              navigate("/police-signup")
            }
          >

            <h3>
              New Police Station?
            </h3>

            <p>
              Register Emergency Control Room →
            </p>

          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="police-footer">

        <div className="footer-logo">
          🛡 RakshaSOS
        </div>

        <p>
          © 2024 RakshaSOS Emergency Response Infrastructure.
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

export default PoliceLogin;