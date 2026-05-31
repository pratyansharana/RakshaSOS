import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import {
  AlertTriangle,
  Shield,
  Plus,
  Phone,
  MapPinned,
  Siren,
  X,
  CheckCircle2,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

import "../styles/Policedashboard.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SOSData {
  id: string;

  victimName: string;

  victimPhone: string;

  medicalHistory: string;

  severity: string;

  type: string;

  latitude: number;

  longitude: number;

  humanReadableLocation: string;

  status: string;

  acceptedHospitalId?: string;

  acceptedPoliceStationId?: string;

  acceptedPoliceStationName?: string;

  acceptedHospitalName?: string;

  assignedAmbulance?: string;

  assignedAmbulanceId?: string;

  assignedAmbulanceNumber?: string;

  assignedDriverName?: string;

  assignedDriverPhone?: string;

  ambulanceStatus?: string;

  estimatedArrivalMinutes?: number;

  fireStatus?: string;

  createdAt: number;
}

interface PoliceUnit {
  id: string;

  policeStationId: string;

  policeStationName: string;

  vehicleNumber: string;

  inspectorName: string;

  phone: string;

  patrolArea: string;

  status: string;

  latitude?: number;

  longitude?: number;

  assignedSOS?: string;
}

interface FireDispatch {
  id: string;

  fireStationName: string;

  phone: string;

  status: string;

  eta: string;
}

function PoliceDashboard() {

  const [
    sosList,

    setSOSList,
  ] = useState<
    SOSData[]
  >([]);

  const [
    popupSOS,

    setPopupSOS,
  ] = useState<
    SOSData | null
  >(null);

  const [
    policeUnits,

    setPoliceUnits,
  ] = useState<
    PoliceUnit[]
  >([]);

  const [
    fireUnits,

    setFireUnits,
  ] = useState<
    FireDispatch[]
  >([]);

  const [
    showUnitModal,

    setShowUnitModal,
  ] = useState(false);

  const [
    vehicleNumber,

    setVehicleNumber,
  ] = useState("");

  const [
    inspectorName,

    setInspectorName,
  ] = useState("");

  const [
    phone,

    setPhone,
  ] = useState("");

  const [
    patrolArea,

    setPatrolArea,
  ] = useState("");

  const [
    stationName,

    setStationName,
  ] = useState("");

  const currentUser =
    auth.currentUser;

  const policeStationId =
    currentUser?.uid;

  const ambulanceDispatches =
    sosList.filter(
      (sos) =>
        sos.assignedAmbulanceNumber ||
        sos.ambulanceStatus
    );

  /* FETCH POLICE STATION */

  useEffect(() => {

    const getStation =
      async () => {

        if (
          !policeStationId
        )
          return;

        const stationRef =
          doc(
            db,
            "policeStations",
            policeStationId
          );

        const stationSnap =
          await getDoc(
            stationRef
          );

        if (
          stationSnap.exists()
        ) {

          const data =
            stationSnap.data();

          setStationName(
            data.policeStationName || data.stationName || ""
          );
        }

      };

    getStation();

  }, [policeStationId]);

  /* SOS */

  useEffect(() => {

    if (
      !policeStationId
    )
      return;

    const unsubscribe =
      onSnapshot(
        query(
          collection(db, "sos_alerts"),
          where("police_station_id", "==", policeStationId)
        ),

        (
          snapshot
        ) => {

          const data =
            snapshot.docs.map(
              (
                firebaseDoc
              ) => ({

                id:
                  firebaseDoc.id,

                ...(firebaseDoc.data() as Omit<
                  SOSData,
                  "id"
                >),

                latitude:
                  firebaseDoc.data().last_known_lat || firebaseDoc.data().latitude || 0,

                longitude:
                  firebaseDoc.data().last_known_lng || firebaseDoc.data().longitude || 0,

                victimName:
                  firebaseDoc.data().victim_name || firebaseDoc.data().victimName || "Unknown",

                type:
                  firebaseDoc.data().sos_type || firebaseDoc.data().type || "Emergency",

                severity:
                  firebaseDoc.data().severity || "Critical",

              })
            );

          const filtered =
            data.filter(
              (sos) =>
                !sos.acceptedPoliceStationId ||
                sos.acceptedPoliceStationId === "" ||
                sos.acceptedPoliceStationId ===
                  policeStationId
            );

          setSOSList(
            filtered
          );

          const incomingSOS =
            filtered.find(
              (sos) =>
                !sos.acceptedPoliceStationId ||
                sos.acceptedPoliceStationId === ""
            );

          setPopupSOS(
            incomingSOS || null
          );

        }
      );

    return () =>
      unsubscribe();

  }, [policeStationId]);

  /* POLICE UNITS */

  useEffect(() => {

    if (
      !policeStationId
    )
      return;

    const q = query(
      collection(
        db,
        "policeUnits"
      ),

      where(
        "policeStationId",
        "==",
        policeStationId
      )
    );

    const unsubscribe =
      onSnapshot(
        q,

        (
          snapshot
        ) => {

          const data =
            snapshot.docs.map(
              (
                firebaseDoc
              ) => ({

                id:
                  firebaseDoc.id,

                ...(firebaseDoc.data() as Omit<
                  PoliceUnit,
                  "id"
                >),

              })
            );

          setPoliceUnits(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [policeStationId]);

  /* FIRE */

  useEffect(() => {

    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "fireDispatch"
        ),

        (
          snapshot
        ) => {

          const data =
            snapshot.docs.map(
              (
                firebaseDoc
              ) => ({

                id:
                  firebaseDoc.id,

                ...(firebaseDoc.data() as Omit<
                  FireDispatch,
                  "id"
                >),

              })
            );

          setFireUnits(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, []);

  /* ACCEPT SOS */

  const acceptSOS =
    async (
      sos: SOSData
    ) => {

      await updateDoc(
        doc(
          db,
          "sos_alerts",
          sos.id
        ),

        {
          acceptedPoliceStationId:
            policeStationId,

          acceptedPoliceStationName:
            stationName,

          policeStatus:
            "accepted",

          status:
            "accepted",
        }
      );

      setPopupSOS(null);

    };

  /* REJECT SOS */

  const rejectSOS =
    async (
      sos: SOSData
    ) => {

      await updateDoc(
        doc(
          db,
          "sos_alerts",
          sos.id
        ),

        {
          policeStatus:
            "rejected",
        }
      );

      setPopupSOS(null);

    };

  /* SAVE UNIT */

  const saveUnit =
    async () => {

      if (
        !vehicleNumber ||
        !inspectorName ||
        !phone ||
        !patrolArea
      ) {

        alert(
          "Fill all fields"
        );

        return;
      }

      await addDoc(
        collection(
          db,
          "policeUnits"
        ),

        {
          policeStationId,

          policeStationName:
            stationName,

          vehicleNumber,

          inspectorName,

          phone,

          patrolArea,

          status:
            "available",

          createdAt:
            Date.now(),
        }
      );

      setVehicleNumber(
        ""
      );

      setInspectorName(
        ""
      );

      setPhone("");

      setPatrolArea(
        ""
      );

      setShowUnitModal(
        false
      );

    };

  /* CALL */

  const callNumber =
    (
      number: string
    ) => {

      window.location.href =
        `tel:${number}`;
    };

  /* WHATSAPP */

  const shareLocation =
    (
      unit: PoliceUnit
    ) => {

      const mapsLink =
        `https://maps.google.com/?q=${unit.latitude},${unit.longitude}`;

      const message =
        `Police Unit Location:%0A${mapsLink}`;

      window.open(
        `https://wa.me/91${unit.phone}?text=${message}`
      );

    };

  return (

    <div className="police-dashboard">

      {/* TOP CARDS */}

      <div className="dashboard-cards">

        <div className="dashboard-card red">

          <AlertTriangle />

          <h2>
            {
              sosList.filter(
                (
                  item
                ) =>
                  item.status !==
                  "resolved"
              ).length
            }

          </h2>

          <p>
            Active Emergencies
          </p>

        </div>

        <div className="dashboard-card blue">

          <Shield />

          <h2>
            {
              policeUnits.length
            }

          </h2>

          <p>
            Active Units
          </p>

        </div>

        <div className="dashboard-card orange">

          <Siren />

          <h2>
            {
              ambulanceDispatches.length
            }

          </h2>

          <p>
            Ambulances Active
          </p>

        </div>

        <div className="dashboard-card green">

          <CheckCircle2 />

          <h2>
            {
              sosList.filter(
                (
                  item
                ) =>
                  item.status ===
                  "resolved"
              ).length
            }

          </h2>

          <p>
            Resolved Today
          </p>

        </div>

      </div>

      {/* MAIN */}

      <div className="dashboard-main">

        {/* LEFT */}

        <div className="dashboard-left">

          {/* LIVE SOS */}

          <div className="dashboard-panel">

            <div className="panel-top">

              <h2>
                Live SOS Incidents
              </h2>

              <button>

                <Plus size={18} />

                Add Incident

              </button>

            </div>

            <div className="sos-table">

              {sosList.map(
                (
                  sos
                ) => (

                  <div
                    key={sos.id}
                    className="sos-row"
                  >

                    <div>

                      <strong>
                        {
                          sos.id.slice(
                            0,
                            8
                          )
                        }

                      </strong>

                    </div>

                    <div>

                      {
                        sos.victimName
                      }

                    </div>

                    <div>

                      {
                        sos.type
                      }

                    </div>

                    <div className={`severity ${sos.severity}`}>

                      {
                        sos.severity
                      }

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

          {/* MAP */}

          <div className="map-wrapper">

            <MapContainer
              center={[
                22.7196,
                75.8577,
              ]}
              zoom={12}
              className="map"
            >

              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {sosList.map(
                (
                  sos
                ) => (

                  <Marker
                    key={sos.id}
                    position={[
                      sos.latitude,
                      sos.longitude,
                    ]}
                  >

                    <Popup>

                      {
                        sos.type
                      }

                    </Popup>

                  </Marker>

                )
              )}

            </MapContainer>

          </div>

        </div>

        {/* RIGHT */}

        <div className="dashboard-right">

          {/* FIRE */}

          <div className="dashboard-panel">

            <div className="panel-top">

              <h2>
                Fire Brigade
              </h2>

            </div>

            {fireUnits.length ===
            0 ? (

              <p className="empty-text">

                No fire brigade active

              </p>

            ) : (

              fireUnits.map(
                (
                  fire
                ) => (

                  <div
                    key={fire.id}
                    className="unit-card"
                  >

                    <div>

                      <h3>

                        {
                          fire.fireStationName
                        }

                      </h3>

                      <p>

                        ETA:
                        {" "}
                        {
                          fire.eta
                        }

                      </p>

                    </div>

                    <button
                      onClick={() =>
                        callNumber(
                          fire.phone
                        )
                      }
                    >

                      <Phone size={16} />

                      Call

                    </button>

                  </div>

                )
              )

            )}

          </div>

          {/* AMBULANCES */}

          <div className="dashboard-panel">

            <div className="panel-top">

              <h2>
                Ambulance Dispatch
              </h2>

            </div>

            {ambulanceDispatches.length ===
            0 ? (
              <p className="empty-text">
                No ambulance dispatch
                updates yet
              </p>
            ) : (
              ambulanceDispatches.map(
                (sos) => (
                  <div
                    key={sos.id}
                    className="unit-card"
                  >
                    <div>
                      <h3>
                        {sos.assignedAmbulanceNumber ||
                          "Ambulance"}
                      </h3>
                      <p>
                        {sos.assignedDriverName ||
                          sos.victimName ||
                          "Dispatch update"}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        callNumber(
                          sos.assignedDriverPhone ||
                            ""
                        )
                      }
                    >
                      <Phone size={16} />
                      Call
                    </button>
                  </div>
                )
              )
            )}

          </div>

          {/* POLICE UNITS */}

          <div className="dashboard-panel">

            <div className="panel-top">

              <h2>
                Active Units
              </h2>

              <button
                onClick={() =>
                  setShowUnitModal(
                    true
                  )
                }
              >

                <Plus size={16} />

                Add Unit

              </button>

            </div>

            {policeUnits.map(
              (
                unit
              ) => (

                <div
                  key={unit.id}
                  className="unit-card"
                >

                  <div>

                    <h3>

                      {
                        unit.vehicleNumber
                      }

                    </h3>

                    <p>

                      {
                        unit.inspectorName
                      }

                    </p>

                  </div>

                  <div className="unit-actions">

                    <button
                      onClick={() =>
                        shareLocation(
                          unit
                        )
                      }
                    >

                      <MapPinned size={16} />

                    </button>

                    <button
                      onClick={() =>
                        callNumber(
                          unit.phone
                        )
                      }
                    >

                      <Phone size={16} />

                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      </div>

      {/* SOS POPUP */}

      {popupSOS && (

        <div className="popup-overlay">

          <div className="sos-popup">

            <div className="popup-top">

              <div className="popup-title">

                <AlertTriangle />

                <h2>
                  Emergency SOS
                  Detected
                </h2>

              </div>

              <button
                onClick={() =>
                  setPopupSOS(
                    null
                  )
                }
              >

                <X />

              </button>

            </div>

            <div className="popup-content">

              <div className="victim-box">

                <div>

                  <span>
                    Name
                  </span>

                  <h3>

                    {
                      popupSOS.victimName
                    }

                  </h3>

                </div>

                <div>

                  <span>
                    Location
                  </span>

                  <h3>

                    {
                      popupSOS.humanReadableLocation
                    }

                  </h3>

                </div>

              </div>

              <div className="analysis-box">

                <p>

                  {
                    popupSOS.type
                  }

                </p>

                <span className={`severity ${popupSOS.severity}`}>

                  {
                    popupSOS.severity
                  }

                </span>

              </div>

              <button
                className="accept-btn"
                onClick={() =>
                  acceptSOS(
                    popupSOS
                  )
                }
              >

                ACCEPT &
                DISPATCH

              </button>

              <button
                className="reject-btn"
                onClick={() =>
                  rejectSOS(
                    popupSOS
                  )
                }
              >

                REJECT /
                FALSE ALARM

              </button>

            </div>

          </div>

        </div>

      )}

      {/* ADD UNIT */}

      {showUnitModal && (

        <div className="popup-overlay">

          <div className="unit-modal">

            <div className="popup-top">

              <h2>
                Add Police Unit
              </h2>

              <button
                onClick={() =>
                  setShowUnitModal(
                    false
                  )
                }
              >

                <X />

              </button>

            </div>

            <div className="unit-form">

              <input
                type="text"
                placeholder="Vehicle Number"
                value={
                  vehicleNumber
                }
                onChange={(
                  e
                ) =>
                  setVehicleNumber(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Inspector Name"
                value={
                  inspectorName
                }
                onChange={(
                  e
                ) =>
                  setInspectorName(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Phone"
                value={
                  phone
                }
                onChange={(
                  e
                ) =>
                  setPhone(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Patrol Area"
                value={
                  patrolArea
                }
                onChange={(
                  e
                ) =>
                  setPatrolArea(
                    e.target.value
                  )
                }
              />

              <button
                className="save-unit-btn"
                onClick={
                  saveUnit
                }
              >

                Save Unit

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default PoliceDashboard;