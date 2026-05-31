import { useNavigate } from "react-router-dom";

import { useState } from "react";

import "../styles/HospitalSignup.css";

import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

function HospitalSignup() {

  const navigate = useNavigate();

  const [hospitalName,
    setHospitalName] =
    useState("");

  const [email,
    setEmail] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  const [confirmPassword,
    setConfirmPassword] =
    useState("");

  const [emergencyContact,
    setEmergencyContact] =
    useState("");

  const [address,
    setAddress] =
    useState("");

  const [city,
    setCity] =
    useState("");

  const [stateName,
    setStateName] =
    useState("");

  const [hospitalType,
    setHospitalType] =
    useState(
      "Private Tertiary Hospital"
    );

  const [bedCount,
    setBedCount] =
    useState("");

  const [loading,
    setLoading] =
    useState(false);

  /* GET LATITUDE LONGITUDE */

  const getCoordinates =
    async (
      fullAddress: string
    ) => {

      try {

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              fullAddress
            )}`
          );

        const data =
          await response.json();

        if (
          data &&
          data.length > 0
        ) {

          return {

            latitude:
              parseFloat(
                data[0].lat
              ),

            longitude:
              parseFloat(
                data[0].lon
              ),

          };

        }

        return null;

      } catch {

        return null;

      }

    };


const handleSignup = async () => {

  /* ONLY EMAIL + PASSWORD REQUIRED */

  if (!email || !password) {

    alert(
      "Email and password are required."
    );

    return;

  }

  if (
    password !==
    confirmPassword
  ) {

    alert(
      "Passwords do not match."
    );

    return;

  }

  try {

    setLoading(true);

    let latitude = null;
    let longitude = null;

    let fullAddress = "";

    /* OPTIONAL ADDRESS */

    if (
      address &&
      city &&
      stateName
    ) {

      fullAddress =
        `${address}, ${city}, ${stateName}`;

      /* TRY GETTING COORDINATES */

      const coordinates =
        await getCoordinates(
          fullAddress
        );

      /* ONLY SAVE IF FOUND */

      if (coordinates) {

        latitude =
          coordinates.latitude;

        longitude =
          coordinates.longitude;

      }

    }

    /* CREATE USER */

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    /* SAVE HOSPITAL */

    await setDoc(
      doc(
        db,
        "hospitals",
        userCredential.user.uid
      ),

      {
        hospitalId:
          userCredential.user.uid,

        hospitalName:
          hospitalName || "",

        email,

        emergencyContact:
          emergencyContact || "",

        address:
          address || "",

        city:
          city || "",

        state:
          stateName || "",

        fullAddress,

        latitude,

        longitude,

        hospitalType,

        emergencyBeds:
          bedCount || "",

        createdAt:
          Date.now(),
      }
    );

    alert(
      "Hospital registered successfully."
    );

    navigate(
      "/hospital-login"
    );

  } catch (
    error: any
  ) {

    alert(
      error.message
    );

  } finally {

    setLoading(false);

  }

};



  return (

    <div className="hospital-signup-page">

      {/* NAVBAR */}

      <nav className="hospital-navbar">

        <div className="hospital-logo">
          RakshaSOS
        </div>

        <div className="hospital-nav-links">

          <span>
            Emergency Network
          </span>

          <span className="active-link">
            Hospital Coordination
          </span>

          <span>
            Police Response
          </span>

          <span>
            Help Desk
          </span>

        </div>

        <div className="hospital-status">
          System Status
        </div>

      </nav>

      {/* MAIN */}

      <div className="hospital-main-wrapper">

        {/* LEFT */}

        <div className="hospital-left">

          {/* TOP */}

          <div className="top-info-card">

            <div className="medical-badge">

              VERIFIED MEDICAL
              INFRASTRUCTURE ACCESS

            </div>

            <h1>

              Hospital Emergency
              Network Registration

            </h1>

            <p>

              Register your hospital,
              trauma center,
              or emergency response
              department into
              the RakshaSOS real-time
              emergency coordination
              system.

            </p>

          </div>

          {/* HOSPITAL INFO */}

          <div className="form-card">

            <h2>
              Hospital Information
            </h2>

            <div className="input-grid">

              <input
                placeholder="Hospital Name"
                value={
                  hospitalName
                }
                onChange={(e) =>
                  setHospitalName(
                    e.target.value
                  )
                }
              />

              <input
                type="email"
                placeholder="Official Email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Emergency Contact"
                value={
                  emergencyContact
                }
                onChange={(e) =>
                  setEmergencyContact(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Hospital Address"
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="City"
                value={city}
                onChange={(e) =>
                  setCity(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="State"
                value={
                  stateName
                }
                onChange={(e) =>
                  setStateName(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          {/* OPERATIONS */}

          <div className="form-card">

            <h2>
              Emergency Operations
            </h2>

            <div className="input-grid">

              <select
                value={
                  hospitalType
                }
                onChange={(e) =>
                  setHospitalType(
                    e.target.value
                  )
                }
              >

                <option>
                  Private Tertiary Hospital
                </option>

                <option>
                  Government Hospital
                </option>

                <option>
                  Trauma Center
                </option>

                <option>
                  Emergency Care Unit
                </option>

              </select>

              <input
                placeholder="Emergency Beds Count"
                value={bedCount}
                onChange={(e) =>
                  setBedCount(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="checkbox-row">

              <div className="feature-box">
                ICU Available
              </div>

              <div className="feature-box">
                Ambulance Fleet
              </div>

              <div className="feature-box">
                24/7 Service
              </div>

            </div>

          </div>

          {/* DOCUMENTS */}

          <div className="form-card">

            <h2>
              Verification Documents
            </h2>

            <div className="upload-row">

              <div className="upload-box">

                <h4>
                  Authorization Document
                </h4>

                <p>
                  PDF, JPG or PNG
                </p>

              </div>

              <div className="upload-box">

                <h4>
                  Medical Registration Certificate
                </h4>

                <p>
                  Government Issued Certificate
                </p>

              </div>

            </div>

            <div className="verify-note">

              Verification usually takes
              24–48 business hours.

            </div>

          </div>

          {/* PASSWORD */}

          <div className="form-card">

            <h2>
              Secure Access
            </h2>

            <div className="input-grid">

              <input
                type="password"
                placeholder="Create Admin Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={
                  confirmPassword
                }
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          {/* BUTTON */}

          <button
            className="register-hospital-btn"
            onClick={
              handleSignup
            }
            disabled={loading}
          >

            {loading
              ? "Creating Hospital..."
              : "Register Hospital Network"}

          </button>

          <div className="login-link">

            Already registered?

            <span
              onClick={() =>
                navigate(
                  "/hospital-login"
                )
              }
            >

              Access Hospital Dashboard

            </span>

          </div>

        </div>

        {/* RIGHT */}

        <div className="hospital-right">

          <div className="preview-panel">

            <div className="preview-header">

              <h2>
                Live Preview
              </h2>

              <span>
                LIVE SOS
              </span>

            </div>

            <div className="alert-card red">

              <h4>
                Critical:
                Cardiac Arrest
              </h4>

              <p>
                Ambulance ETA: 4m
              </p>

            </div>

            <div className="alert-card yellow">

              <h4>
                Dispatch:
                Trauma Ward 4
              </h4>

              <p>
                Police Escort Assigned
              </p>

            </div>

            <div className="stats-row">

              <div className="stat-box">

                <span>
                  ACTIVE CASES
                </span>

                <h3>
                  14
                </h3>

              </div>

              <div className="stat-box">

                <span>
                  LIVE AMBULANCES
                </span>

                <h3>
                  6
                </h3>

              </div>

            </div>

            <img
              className="dashboard-image"
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop"
              alt="hospital"
            />

          </div>

          <div className="side-feature">
            Real-Time Ambulance Dispatch
          </div>

          <div className="side-feature">
            AI Emergency Severity Detection
          </div>

          <div className="side-feature">
            Live SOS Location Tracking
          </div>

        </div>

      </div>

      {/* FOOTER */}

      <footer className="hospital-footer">

        <div className="footer-logo">
          RakshaSOS
        </div>

        <p>
          Emergency Coordination
          Infrastructure
        </p>

        <div className="footer-links">

          <span>
            Privacy
          </span>

          <span>
            Terms
          </span>

          <span>
            Contact
          </span>

        </div>

      </footer>

    </div>

  );

}

export default HospitalSignup;