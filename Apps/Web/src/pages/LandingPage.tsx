import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();

  const scrollToAccess = () => {
    const section = document.getElementById("access-section");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="landing-page">

      {/* NAVBAR */}
      <nav className="landing-navbar">

        <div className="landing-logo">
          Raksha<span>SOS</span>
        </div>

        <div className="landing-nav-links">
          <a href="/" className="active">Emergency Network</a>
          <span>Hospital Coordination</span>
          <span>Police Response</span>
          <span>Help Desk</span>
        </div>

        <div className="landing-nav-right">

          <div className="landing-status">
            <div className="status-dot"></div>
            Live Status: Stable
          </div>

     

        </div>

      </nav>

      {/* HERO SECTION */}
      <section className="hero-wrapper">

        <div className="hero-left">

          <h1>
            Real-Time Emergency
            <br />
            <span>Response Coordination</span>
          </h1>

          <p>
            RakshaSOS connects hospitals, police stations,
            ambulances, and emergency responders during
            critical situations to reduce response time
            and save lives.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-btn"
              onClick={scrollToAccess}
            >
              Access Emergency Portal →
            </button>

            <button className="secondary-btn">
              View Live Coordination
            </button>

          </div>

        </div>

        <div className="hero-right">

          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
            alt="Emergency Dashboard"
          />

        </div>

      </section>

      {/* ACCESS SECTION */}
      <section
        className="access-section"
        id="access-section"
      >

        {/* HOSPITAL CARD */}
        <div className="access-card">

          <div className="card-top">

            <div className="card-icon hospital-icon">
              ✚
            </div>

            <div className="card-badge green-badge">
              CERTIFIED NODE
            </div>

          </div>

          <h2>Hospital Access</h2>

          <p>
            Manage emergencies, cross-agency ambulance
            coordination, and real-time patient bed
            monitoring with high-reliability data
            synchronization.
          </p>

          <ul>
            <li>Trauma Center Prioritization</li>
            <li>Bed Capacity Telemetry</li>
          </ul>

          <button
            className="portal-btn"
            onClick={() => navigate("/hospital-signup")}
          >
            Open Hospital Portal ↗
          </button>

        </div>

        {/* POLICE CARD */}
        <div className="access-card">

          <div className="card-top">

            <div className="card-icon police-icon">
              🛡
            </div>

            <div className="card-badge blue-badge">
              SECURE ACCESS
            </div>

          </div>

          <h2>Police Access</h2>

          <p>
            Incident monitoring, high-priority women
            safety alerts, and automated accident
            tracking for municipal-wide security
            operations.
          </p>

          <ul>
            <li>Geofenced Dispatch Control</li>
            <li>SOS Signal Interception</li>
          </ul>

          <button
            className="portal-btn"
            onClick={() => navigate("/police-signup")}
          >
            Open Police Portal ↗
          </button>

        </div>

      </section>

      {/* COMMAND SECTION */}
      <section className="command-section">

        <div className="command-heading">

          <h2>
            Command & Control Infrastructure
          </h2>

          <p>
            Unified visualization layer for municipal
            emergency departments.
          </p>

        </div>

        <div className="command-grid">

          <div className="map-card">

            <img
              src="/Users/raunaktiwari07/Desktop/RakshaSOS/photo-1586449480537-3a22cf98b04c.avif"
              alt="Emergency Map"
            />

          </div>

          <div className="side-cards">

            <div className="mini-card">

              <h4>Dispatch Timeline</h4>

              <p>
                Ambulance #A92 dispatched to trauma
                center.
              </p>

              <p>
                Police blockade active near Ring Road.
              </p>

            </div>

            <div className="mini-card">

              <h4>Capacity Monitor</h4>

              <div className="progress-item">
                <span>ICU Availability</span>

                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>

              <div className="progress-item">
                <span>General Ward</span>

                <div className="progress-bar">
                  <div
                    className="progress-fill second"
                  ></div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* FEATURES */}
      <section className="features-section">

        <div className="feature-card">
          <h4>Verified Network</h4>

          <p>
            All responders are verified by municipal
            authorities.
          </p>
        </div>

        <div className="feature-card">
          <h4>Data Protection</h4>

          <p>
            AES-256 end-to-end encryption for patient
            privacy.
          </p>
        </div>

        <div className="feature-card">
          <h4>Fast Routing</h4>

          <p>
            AI-optimized pathways through urban
            traffic.
          </p>
        </div>

        <div className="feature-card">
          <h4>Multi-agency Sync</h4>

          <p>
            Seamless data handoff between emergency
            units.
          </p>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="landing-footer">

        <div className="footer-left">

          <h2>
            Raksha<span>SOS</span>
          </h2>

          <p>
            Providing high-reliability infrastructure
            for metropolitan emergency services and
            life-critical coordination.
          </p>

        </div>

        <div className="footer-links-wrapper">

          <div>
            <h4>Directory</h4>

            <span>Department Directory</span>
            <span>Emergency Protocols</span>
            <span>Security Whitepaper</span>
          </div>

          <div>
            <h4>Legal</h4>

            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>

        </div>

        <div className="footer-emergency">

          <h4>Emergency Hotline</h4>

          <div className="hotline-box">
            911 / 112 / 100
          </div>

        </div>

      </footer>

    </div>
  );
}

export default LandingPage;