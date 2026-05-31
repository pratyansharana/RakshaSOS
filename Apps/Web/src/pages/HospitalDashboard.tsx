
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import "../styles/HospitalDashboard.css";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HospitalDashboard() {

  const [
    currentUser,
    setCurrentUser,
  ] = useState<any>(null);

  const [
    hospitalData,
    setHospitalData,
  ] = useState<any>(null);

  const [
    hospitalLocation,
    setHospitalLocation,
  ] = useState(
    defaultCenter
  );

  const [
    acceptedSOS,
    setAcceptedSOS,
  ] = useState<any[]>([]);

  const [
    popupSOS,
    setPopupSOS,
  ] = useState<any | null>(null);

  const [
    ambulances,
    setAmbulances,
  ] = useState<any[]>([]);

  const [
    mapLoaded,
    setMapLoaded,
  ] = useState(false);

  const { isLoaded } =
    useLoadScript({

      googleMapsApiKey:
        import.meta.env
          .VITE_GOOGLE_MAPS_API,

    });

  /* AUTH */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(
            user
          );
        }
      );

    return () =>
      unsubscribe();

  }, []);

  /* HOSPITAL */

  useEffect(() => {

    if (!currentUser)
      return;

    const fetchHospital =
      async () => {

        try {

          const hospitalRef =
            doc(
              db,
              "hospitals",
              currentUser.uid
            );

          const hospitalSnap =
            await getDoc(
              hospitalRef
            );

          if (
            hospitalSnap.exists()
          ) {

            const data =
              hospitalSnap.data();

            setHospitalData(
              data
            );

            if (
              data.latitude &&
              data.longitude
            ) {

              setHospitalLocation({

                lat: Number(
                  data.latitude
                ),

                lng: Number(
                  data.longitude
                ),

              });

            }

          }

        } catch (error) {

          console.error(
            error
          );

        }

      };

    fetchHospital();

  }, [currentUser]);

  /* SOS ALERTS (PENDING & ACCEPTED) */

  useEffect(() => {

    if (!currentUser) {
      setPopupSOS(null);
      setAcceptedSOS([]);
      return;
    }

    const sosQuery = query(
      collection(db, "sos_alerts"),
      where("hospitals_notified", "array-contains", currentUser.uid)
    );

    const unsubscribe =
      onSnapshot(
        sosQuery,
        (snapshot) => {

          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
          }));

          const incoming = data.filter(
            (sos) => !sos.accepted_by_hospital && (sos.status === "active" || sos.status === "triggered")
          );
          setPopupSOS(incoming[0] || null);

          setAcceptedSOS(
            data.filter((sos) => sos.accepted_by_hospital === currentUser.uid)
          );
        }
      );

    return () => unsubscribe();

  }, [currentUser]);

  /* AMBULANCES */

  useEffect(() => {

    if (!currentUser)
      return;

    const ambulanceRef =
      collection(
        db,
        "ambulances"
      );

    const ambulanceQuery =
      query(

        ambulanceRef,

        where(
          "hospital_id",
          "==",
          currentUser.uid
        )

      );

    const unsubscribe =
      onSnapshot(
        ambulanceQuery,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({

                id:
                  doc.id,

                ...doc.data(),

              })
            );

          setAmbulances(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [currentUser]);

  /* ACCEPT SOS */

  const acceptSOS =
    async (
      sosId: string
    ) => {

      if (!currentUser || !hospitalData)
        return;

      try {

        const parsedAge    = popupSOS.victim_age || popupSOS.age || "N/A";
        const parsedGender = popupSOS.victim_gender || popupSOS.gender || "N/A";

        const hospitalLat = Number(hospitalData.latitude || hospitalData.lat || hospitalLocation.lat);
        const hospitalLng = Number(hospitalData.longitude || hospitalData.lng || hospitalLocation.lng);
        const sosLat = Number(popupSOS.last_known_lat);
        const sosLng = Number(popupSOS.last_known_lng);

        let eta = 10;
        let distanceText = "Unknown";

        if (hospitalLat && hospitalLng && sosLat && sosLng) {
          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${hospitalLat},${hospitalLng}&destinations=${sosLat},${sosLng}&key=${apiKey}`
            );
            const dmData = await response.json();
            const element = dmData.rows?.[0]?.elements?.[0];
            if (element && element.status === "OK") {
              eta = Math.ceil(element.duration.value / 60);
              distanceText = element.distance.text;
            } else {
              const distanceKm = getDistanceKm(hospitalLat, hospitalLng, sosLat, sosLng);
              eta = Math.max(2, Math.ceil((distanceKm / 40) * 60));
              distanceText = `${distanceKm.toFixed(1)} km`;
            }
          } catch (dmErr) {
            console.error("Distance Matrix failed, using Haversine:", dmErr);
            const distanceKm = getDistanceKm(hospitalLat, hospitalLng, sosLat, sosLng);
            eta = Math.max(2, Math.ceil((distanceKm / 40) * 60));
            distanceText = `${distanceKm.toFixed(1)} km`;
          }
        }

        // Write incident log fields directly into the sos_alerts doc (merge)
        await setDoc(
          doc(db, "sos_alerts", sosId),
          {
            victimName:              popupSOS.victim_name || "Unknown",
            gender:                  parsedGender,
            age:                     parsedAge,
            bloodGroup:              popupSOS.blood_group || "N/A",
            condition:               popupSOS.chronic_conditions || popupSOS.condition || "N/A",
            pulse:                   popupSOS.pulse || "N/A",
            type:                    popupSOS.sos_type || "Emergency",
            severity:                popupSOS.severity || "Critical",
            imageUrl:                popupSOS.image_url || null,
            voiceNoteUrl:            popupSOS.voice_note_url || popupSOS.audio_recording_url || null,
            address:                 popupSOS.address_text || "N/A",
            latitude:                sosLat || 0,
            longitude:               sosLng || 0,
            acceptedHospitalId:      currentUser.uid,
            incidentStatus:          "active",
            ambulanceStatus:         "waiting",
            ambulanceAssigned:       false,
            estimatedArrivalMinutes: eta,
            distanceText:            distanceText,
            createdAt:               Date.now(),
          },
          { merge: true }
        );

        await updateDoc(
          doc(
            db,
            "sos_alerts",
            sosId
          ),
          {
            status:
              "accepted",
            accepted_by_hospital:
              currentUser.uid,
            accepted_by_name:
              hospitalData.name ||
              hospitalData.hospital_name ||
              "Unknown Hospital",
            accepted_at:
              serverTimestamp(),
            ambulance_eta:
              eta,
          }
        );

        // ── Write accepted timeline event to emergency_timeline ──
        try {
          await addDoc(
            collection(db, "emergency_timeline"),
            {
              sos_id:       sosId,
              event_type:   "hospital_accepted",
              timestamp:    serverTimestamp(),
              event_details: {
                hospital_id:   currentUser.uid,
                hospital_name: hospitalData.name ||
                               hospitalData.hospital_name ||
                               "Unknown Hospital",
                eta_minutes:   eta,
                distance:      distanceText,
                victim_name:   popupSOS.victim_name || "Unknown",
              },
            }
          );
        } catch (tlErr) {
          console.warn("Timeline write failed (non-critical):", tlErr);
        }

        setPopupSOS(null);

      } catch (error) {

        console.error(
          error
        );

      }

    };

  /* REJECT SOS */

  const rejectSOS =
    async (
      _sosId: string
    ) => {

      try {

        setPopupSOS(null);

      } catch (error) {

        console.error(
          error
        );

      }

    };

  /* MAP CENTER */

  const mapCenter =
    useMemo(() => {

      if (
        acceptedSOS.length >
        0
      ) {

        return {

          lat: Number(
            acceptedSOS[0]
              .last_known_lat
          ),

          lng: Number(
            acceptedSOS[0]
              .last_known_lng
          ),

        };

      }

      return hospitalLocation;

    }, [
      acceptedSOS,
      hospitalLocation,
    ]);

  useEffect(() => {

    if (isLoaded) {

      setMapLoaded(
        true
      );

    }

  }, [isLoaded]);

  if (!mapLoaded) {

    return (
      <div className="dashboard-loading">

        Loading Tactical
        Map...

      </div>
    );

  }

  return (
    <>

      {/* SOS POPUP */}

      {popupSOS && (

        <div className="sos-modal-overlay">

          <div className="sos-modal">

            <div className="sos-modal-header">

              <h1>
                INCOMING SOS
              </h1>

              <p>
                RAPID RESPONSE
              </p>

            </div>

            <div className="modal-alert-box">

              <div className="modal-alert-top">

                <span>
                  CRITICAL ALERT
                </span>

                <span>
                  JUST NOW
                </span>

              </div>

              <h2>

                {
                  popupSOS.sos_type ||
                  "Emergency"
                }

              </h2>

              <p>

                Location:
                {" "}

                {
                  popupSOS.address_text ||
                  "N/A"
                }

              </p>

              <p className="victim-preview">
                <strong>Victim:</strong> {popupSOS.victim_name || "Unknown"}
              </p>
              <p className="medical-preview">
                <strong>Blood Group:</strong> {popupSOS.blood_group || "N/A"}
              </p>

              {(() => {
                const hospitalLat = Number(hospitalData?.latitude || hospitalData?.lat || hospitalLocation.lat);
                const hospitalLng = Number(hospitalData?.longitude || hospitalData?.lng || hospitalLocation.lng);
                const sosLat = Number(popupSOS.last_known_lat);
                const sosLng = Number(popupSOS.last_known_lng);
                if (hospitalLat && hospitalLng && sosLat && sosLng) {
                  const dist = getDistanceKm(hospitalLat, hospitalLng, sosLat, sosLng);
                  const estEta = Math.max(2, Math.ceil((dist / 40) * 60));
                  return (
                    <p className="location-preview" style={{ marginTop: "8px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                      <strong>Distance:</strong> {dist.toFixed(1)} km &nbsp;•&nbsp; <strong>ETA:</strong> ~{estEta} mins
                    </p>
                  );
                }
                return null;
              })()}

            </div>

            <div className="modal-actions">

              <button
                className="accept-btn"
                onClick={() =>
                  acceptSOS(
                    popupSOS.id
                  )
                }
              >

                ACCEPT CALL

              </button>

              <button
                className="reject-btn"
                onClick={() =>
                  rejectSOS(
                    popupSOS.id
                  )
                }
              >

                REJECT

              </button>

            </div>

          </div>

        </div>

      )}

      <div className="hospital-dashboard">

        {/* LEFT */}

        <div className="dashboard-left">

          {/* MAP */}

          <div className="dashboard-map-card">

            <div className="map-header">

              <div>

                <p className="map-subtitle">

                  Tactical Response

                </p>

                <h2 className="map-title">

                  Live Command Map

                </h2>

              </div>

              <div className="live-badge">

                LIVE

              </div>

            </div>

            <div className="map-wrapper">

              <GoogleMap
                mapContainerStyle={
                  mapContainerStyle
                }
                zoom={13}
                center={
                  mapCenter
                }
                options={{

                  disableDefaultUI:
                    true,

                  zoomControl:
                    true,

                }}
              >

                {/* HOSPITAL */}

                {hospitalData?.latitude &&
                  hospitalData?.longitude && (

                  <Marker
                    position={{

                      lat: Number(
                        hospitalData.latitude
                      ),

                      lng: Number(
                        hospitalData.longitude
                      ),

                    }}
                  />

                )}

                {/* ACCEPTED SOS */}

                {acceptedSOS.map(
                  (sos) => (

                    <Marker
                      key={
                        sos.id
                      }
                      position={{

                        lat: Number(
                          sos.last_known_lat
                        ),

                        lng: Number(
                          sos.last_known_lng
                        ),

                      }}
                    />

                  )
                )}

              </GoogleMap>

            </div>

          </div>

          {/* LIVE UNIT TRACKING */}

          <div className="live-tracking-card">

            <div className="live-tracking-header">

              <div className="tracking-title">

                <h2>
                  Live Unit Tracking
                </h2>

              </div>

              <div className="tracking-stats">

                <div className="available-stat">

                  {
                    ambulances.filter(
                      (
                        ambulance
                      ) =>
                        ambulance.status ===
                        "available"
                    ).length
                  }
                  {" "}
                  Available

                </div>

                <div className="active-stat">

                  {
                    ambulances.filter(
                      (
                        ambulance
                      ) =>
                        ambulance.status ===
                        "on_route"
                    ).length
                  }
                  {" "}
                  Active

                </div>

              </div>

            </div>

            {ambulances.filter(
              (
                ambulance
              ) =>
                ambulance.status ===
                "on_route"
            ).length === 0 ? (

              <div className="empty-state">

                <h2>
                  No Active Unit
                </h2>

                <p>
                  Ambulance dispatches
                  will appear here in
                  realtime after SOS
                  assignment.
                </p>

              </div>

            ) : (

              <div className="tracking-grid">

                {ambulances
                  .filter(
                    (
                      ambulance
                    ) =>
                      ambulance.status ===
                      "on_route"
                  )
                  .map(
                    (
                      ambulance
                    ) => (

                      <div
                        key={
                          ambulance.id
                        }
                        className="tracking-unit-card"
                      >

                        <div className="tracking-top">

                          <div>

                            <h3>

                              {
                                ambulance.ambulance_number ||
                                "N/A"
                              }

                            </h3>

                            <p>

                              {
                                ambulance.driver_name ||
                                "N/A"
                              }

                            </p>

                            <strong>

                              {
                                ambulance.driver_phone ||
                                "N/A"
                              }

                            </strong>

                          </div>

                          <div className="tracking-badges">

                            <span>
                              ON
                            </span>

                            <span>
                              ROUTE
                            </span>

                          </div>

                        </div>

                        <div className="tracking-eta">

                          <span>
                            ESTIMATED ARRIVAL
                          </span>

                          <h1>

                            {
                              ambulance.estimated_arrival_minutes ||
                              "--"
                            }
                            m

                          </h1>

                        </div>

                        <div className="tracking-progress">

                          <div className="tracking-line" />

                        </div>

                        <div className="tracking-actions">

                          <button
                            onClick={() => {

                              const message =
`
🚑 Live Ambulance Dispatch

Ambulance:
${ambulance.ambulance_number}

Driver:
${ambulance.driver_name}

ETA:
${ambulance.estimated_arrival_minutes} mins
`;

                              window.open(

                                `https://wa.me/?text=${encodeURIComponent(
                                  message
                                )}`

                              );

                            }}
                          >

                            Share Location

                          </button>

                          <button
                            className="arrived-btn"
                            onClick={async () => {

                              try {

                                await updateDoc(

                                  doc(
                                    db,
                                    "ambulances",
                                    ambulance.id
                                  ),

                                  {

                                    status:
                                      "available",

                                    current_sos_id:
                                      null,

                                    assigned_victim_name:
                                      null,

                                    estimated_arrival_minutes:
                                      null,

                                  }

                                );

                                if (
                                  ambulance.current_sos_id
                                ) {

                                  await updateDoc(

                                    doc(
                                      db,
                                      "sos_alerts",
                                      ambulance.current_sos_id
                                    ),

                                    {

                                      ambulanceStatus:
                                        "arrived",

                                      arrivedAt:
                                        Date.now(),

                                    }

                                  );

                                }

                              } catch (
                                error
                              ) {

                                console.error(
                                  error
                                );

                              }

                            }}
                          >

                            Arrived

                          </button>

                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </div>

        </div>

        {/* RIGHT */}

        <div className="dashboard-right">

          <div className="right-card">

            <div className="right-card-header">

              <h2>
                SOS Stream
              </h2>

              <span>

                {
                  acceptedSOS.length
                }
                {" "}
                Active

              </span>

            </div>

            {acceptedSOS.length ===
            0 ? (

              <div className="empty-stream">

                No Active SOS

              </div>

            ) : (

              acceptedSOS.map(
                (sos) => (

                  <div
                    key={
                      sos.id
                    }
                    className="stream-card"
                  >

                    <div className="stream-severity">

                      {
                        sos.severity ||
                        "Critical"
                      }

                    </div>

                    <h3>

                      {
                        sos.sos_type ||
                        "Emergency"
                      }

                    </h3>

                    <div className="medical-grid">

                      <div className="medical-item">

                        <span>
                          Victim
                        </span>

                        <strong>

                          {
                            sos.victim_name ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Age
                        </span>

                        <strong>

                          {
                            sos.victim_age ||
                            sos.age ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Gender
                        </span>

                        <strong>

                          {
                            sos.victim_gender ||
                            sos.gender ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Blood Group
                        </span>

                        <strong>

                          {
                            sos.blood_group ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Pulse
                        </span>

                        <strong>

                          {
                            sos.pulse ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Condition
                        </span>

                        <strong>

                          {
                            sos.condition ||
                            sos.chronic_conditions ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item full-width">

                        <span>
                          Address
                        </span>

                        <strong>

                          {
                            sos.address_text ||
                            "N/A"
                          }

                        </strong>

                      </div>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </div>

    </>
  );

}
