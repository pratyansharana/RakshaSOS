
import { useEffect, useMemo, useState } from "react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  Ambulance,
  Plus,
  Search,
  Pencil,
  LocateFixed,
  Phone,
  X,
  Send,
  CheckCircle2,
  MapPin,
} from "lucide-react";

import { auth, db } from "../firebase/firebaseConfig";

import "../styles/AmbulanceLogistics.css";

type AmbulanceType = {
  id: string;

  hospitalId: string;

  ambulanceNumber: string;

  driverName: string;

  driverPhone: string;

  status:
    | "available"
    | "on_route";

  currentSOSId?: string | null;

  assignedVictimName?: string | null;

  estimatedArrivalMinutes?: number | null;
};

type SOSDataType = {
  id: string;

  victimName: string;

  humanReadableLocation: string;

  latitude: number;

  longitude: number;

  emergencyType?: string;

  severity?: string;

  ambulanceAssigned?: boolean;
};

function AmbulanceLogistics() {

  const hospitalId =
    auth.currentUser?.uid;

  const [
    ambulances,
    setAmbulances,
  ] = useState<
    AmbulanceType[]
  >([]);

  const [
    sosList,
    setSOSList,
  ] = useState<
    SOSDataType[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    openAddModal,
    setOpenAddModal,
  ] = useState(false);

  const [
    openDispatchModal,
    setOpenDispatchModal,
  ] = useState(false);

  const [
    selectedSOS,
    setSelectedSOS,
  ] =
    useState<SOSDataType | null>(
      null
    );

  const [
    selectedAmbulance,
    setSelectedAmbulance,
  ] =
    useState<AmbulanceType | null>(
      null
    );

  const [
    formData,
    setFormData,
  ] = useState({

    ambulanceNumber: "",

    driverName: "",

    driverPhone: "",

  });

  /* FETCH AMBULANCES */

  useEffect(() => {

    if (!hospitalId) return;

    const q = query(
      collection(
        db,
        "ambulances"
      ),

      where(
        "hospitalId",
        "==",
        hospitalId
      )
    );

    const unsubscribe =
      onSnapshot(
        q,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (
                firebaseDoc
              ) => ({

                id:
                  firebaseDoc.id,

                ...firebaseDoc.data(),

              })
            ) as AmbulanceType[];

          setAmbulances(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [hospitalId]);

  /* FETCH ACCEPTED SOS */

  useEffect(() => {

    if (!hospitalId) return;

    const q = query(
      collection(db, "sos_alerts"),

      where(
        "acceptedHospitalId",
        "==",
        hospitalId
      )
    );

    const unsubscribe =
      onSnapshot(
        q,
        (snapshot) => {

          const data =
            snapshot.docs
              .map(
                (
                  firebaseDoc
                ) => ({

                  id:
                    firebaseDoc.id,

                  latitude:
                    firebaseDoc.data().last_known_lat || firebaseDoc.data().latitude || 0,

                  longitude:
                    firebaseDoc.data().last_known_lng || firebaseDoc.data().longitude || 0,

                  victimName:
                    firebaseDoc.data().victim_name || firebaseDoc.data().victimName || "Unknown",

                  emergencyType:
                    firebaseDoc.data().sos_type || firebaseDoc.data().emergencyType || "Emergency",

                  severity:
                    firebaseDoc.data().severity || "Critical",

                  ...firebaseDoc.data(),

                })
              )
              .filter(
                (
                  sos: any
                ) =>
                  !sos.ambulanceAssigned
              ) as SOSDataType[];

          setSOSList(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [hospitalId]);

  /* SAVE AMBULANCE */

  const saveAmbulance =
    async () => {

      if (
        !formData.ambulanceNumber ||
        !formData.driverName ||
        !formData.driverPhone
      ) {

        alert(
          "Fill all fields"
        );

        return;

      }

      await addDoc(
        collection(
          db,
          "ambulances"
        ),

        {

          hospitalId,

          ambulanceNumber:
            formData.ambulanceNumber,

          driverName:
            formData.driverName,

          driverPhone:
            formData.driverPhone,

          status:
            "available",

          createdAt:
            serverTimestamp(),

        }
      );

      setOpenAddModal(
        false
      );

      setFormData({

        ambulanceNumber: "",

        driverName: "",

        driverPhone: "",

      });

    };

  /* DISPATCH SOS */

  const dispatchSOS =
    async () => {

      if (
        !selectedSOS ||
        !selectedAmbulance
      )
        return;

      try {

        const hospitalRef =
          doc(
            db,
            "hospitals",
            hospitalId!
          );

        const hospitalSnap =
          await getDoc(
            hospitalRef
          );

        const hospitalData =
          hospitalSnap.data();

        const hospitalLat =
          hospitalData?.latitude;

        const hospitalLng =
          hospitalData?.longitude;

        let eta = 10;

        let distanceText =
          "Unknown";

        try {

          const response =
            await fetch(

              `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${hospitalLat},${hospitalLng}&destinations=${selectedSOS.latitude},${selectedSOS.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API}`

            );

          const data =
            await response.json();

          const element =
            data.rows[0]
              .elements[0];

          if (
            element.status ===
            "OK"
          ) {

            eta =
              Math.ceil(
                element.duration
                  .value / 60
              );

            distanceText =
              element.distance
                .text;

          }

        } catch (
          error
        ) {

          console.error(
            error
          );

        }

        /* UPDATE AMBULANCE */

        await updateDoc(
          doc(
            db,
            "ambulances",
            selectedAmbulance.id
          ),

          {

            status:
              "on_route",

            currentSOSId:
              selectedSOS.id,

            assignedVictimName:
              selectedSOS.victimName,

            estimatedArrivalMinutes:
              eta,

          }
        );

        /* UPDATE SOS */

        await updateDoc(
          doc(
            db,
            "sos_alerts",
            selectedSOS.id
          ),

          {

            ambulanceAssigned:
              true,

            assignedAmbulanceId:
              selectedAmbulance.id,

            assignedAmbulanceNumber:
              selectedAmbulance.ambulanceNumber,

            assignedDriverName:
              selectedAmbulance.driverName,

            assignedDriverPhone:
              selectedAmbulance.driverPhone,

            ambulanceStatus:
              "on_route",

            estimatedArrivalMinutes:
              eta,

            distanceText,

            routeStartedAt:
              Date.now(),

          }
        );

        /* WHATSAPP */

        const whatsappMessage =
`
🚑 Emergency Ambulance Dispatch

Victim:
${selectedSOS.victimName}

Ambulance:
${selectedAmbulance.ambulanceNumber}

Driver:
${selectedAmbulance.driverName}

ETA:
${eta} mins

Distance:
${distanceText}

Location:
https://maps.google.com/?q=${selectedSOS.latitude},${selectedSOS.longitude}
`;

        window.open(

          `https://wa.me/?text=${encodeURIComponent(
            whatsappMessage
          )}`

        );

        setOpenDispatchModal(
          false
        );

        setSelectedSOS(
          null
        );

        setSelectedAmbulance(
          null
        );

      } catch (
        error
      ) {

        console.error(
          error
        );

      }

    };

  /* ARRIVED */

  const markArrived =
    async (
      ambulance:
        AmbulanceType
    ) => {

      if (
        !ambulance.currentSOSId
      )
        return;

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

            currentSOSId:
              null,

            assignedVictimName:
              null,

            estimatedArrivalMinutes:
              null,

          }
        );

        await updateDoc(
          doc(
            db,
            "sos_alerts",
            ambulance.currentSOSId
          ),

          {

            ambulanceStatus:
              "arrived",

            arrivedAt:
              Date.now(),

          }
        );

      } catch (
        error
      ) {

        console.error(
          error
        );

      }

    };

  /* FILTER */

  const filteredAmbulances =
    useMemo(() => {

      return ambulances.filter(
        (
          ambulance
        ) =>

          ambulance.ambulanceNumber
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

    }, [
      ambulances,
      search,
    ]);

  return (

    <div className="fleet-wrapper">

      <div className="fleet-top">

        <div className="fleet-heading">

          <h1>
            Ambulance Fleet
          </h1>

        </div>

        <button
          className="add-btn"
          onClick={() =>
            setOpenAddModal(
              true
            )
          }
        >

          <Plus size={18} />

          Add Ambulance

        </button>

      </div>

      <div className="search-box">

        <Search size={18} />

        <input
          placeholder="Search ambulance..."
          value={search}
          onChange={(
            e
          ) =>
            setSearch(
              e.target.value
            )
          }
        />

      </div>

      {ambulances.length ===
      0 ? (

        <div className="empty-box">

          <div className="empty-icon">

            <Ambulance size={70} />

          </div>

          <h2>
            No Ambulance Added
          </h2>

          <p>
            Add ambulance
            fleet to begin
            dispatch
            operations.
          </p>

          <button
            onClick={() =>
              setOpenAddModal(
                true
              )
            }
          >

            <Plus size={18} />

            Add Ambulance

          </button>

        </div>

      ) : (

        <div className="fleet-grid">

          {filteredAmbulances.map(
            (
              ambulance
            ) => (

              <div
                key={
                  ambulance.id
                }
                className="fleet-card"
              >

                <div className="fleet-card-top">

                  <div>

                    <h3>

                      {
                        ambulance.ambulanceNumber
                      }

                    </h3>

                    <p>
                      Ambulance
                      Unit
                    </p>

                  </div>

                  <span
                    className={`badge ${ambulance.status}`}
                  >

                    {
                      ambulance.status
                    }

                  </span>

                </div>

                <div className="fleet-details">

                  <div>

                    <span>
                      Driver
                    </span>

                    <strong>

                      {
                        ambulance.driverName
                      }

                    </strong>

                  </div>

                  <div>

                    <span>
                      Phone
                    </span>

                    <strong>

                      {
                        ambulance.driverPhone
                      }

                    </strong>

                  </div>

                  {ambulance.assignedVictimName && (

                    <div>

                      <span>
                        Victim
                      </span>

                      <strong>

                        {
                          ambulance.assignedVictimName
                        }

                      </strong>

                    </div>

                  )}

                  {ambulance.estimatedArrivalMinutes && (

                    <div>

                      <span>
                        ETA
                      </span>

                      <strong>

                        {
                          ambulance.estimatedArrivalMinutes
                        }
                        {" "}
                        mins

                      </strong>

                    </div>

                  )}

                </div>

                <div className="fleet-actions">

                  {ambulance.status ===
                  "available" ? (

                    <button
                      className="dispatch-btn"
                      onClick={() => {

                        setSelectedAmbulance(
                          ambulance
                        );

                        setOpenDispatchModal(
                          true
                        );

                      }}
                    >

                      Dispatch

                    </button>

                  ) : (

                    <button
                      className="route-btn"
                      onClick={() =>
                        markArrived(
                          ambulance
                        )
                      }
                    >

                      Arrived

                    </button>

                  )}

                  <button className="icon-btn">

                    <Pencil size={18} />

                  </button>

                  <button className="icon-btn">

                    <Phone size={18} />

                  </button>

                  <button className="icon-btn">

                    <LocateFixed size={18} />

                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {/* ADD MODAL */}

      {openAddModal && (

        <div className="modal-overlay">

          <div className="add-modal">

            <div className="modal-head">

              <div>

                <h2>
                  Add Ambulance
                </h2>

              </div>

              <button
                onClick={() =>
                  setOpenAddModal(
                    false
                  )
                }
              >

                <X size={20} />

              </button>

            </div>

            <div className="modal-grid">

              <input
                placeholder="Ambulance Number"
                value={
                  formData.ambulanceNumber
                }
                onChange={(
                  e
                ) =>
                  setFormData({
                    ...formData,

                    ambulanceNumber:
                      e.target
                        .value,
                  })
                }
              />

              <input
                placeholder="Driver Name"
                value={
                  formData.driverName
                }
                onChange={(
                  e
                ) =>
                  setFormData({
                    ...formData,

                    driverName:
                      e.target
                        .value,
                  })
                }
              />

              <input
                placeholder="Driver Phone"
                value={
                  formData.driverPhone
                }
                onChange={(
                  e
                ) =>
                  setFormData({
                    ...formData,

                    driverPhone:
                      e.target
                        .value,
                  })
                }
              />

            </div>

            <div className="modal-footer">

              <button
                className="cancel-btn"
                onClick={() =>
                  setOpenAddModal(
                    false
                  )
                }
              >

                Cancel

              </button>

              <button
                className="save-btn"
                onClick={
                  saveAmbulance
                }
              >

                Save

              </button>

            </div>

          </div>

        </div>

      )}

      {/* DISPATCH MODAL */}

      {openDispatchModal &&
        selectedAmbulance && (

          <div className="modal-overlay">

            <div className="dispatch-modal">

              <div className="dispatch-head">

                <h2>

                  Select SOS

                </h2>

                <button
                  onClick={() =>
                    setOpenDispatchModal(
                      false
                    )
                  }
                >

                  <X size={20} />

                </button>

              </div>

              <div className="dispatch-body">

                <div className="incident-list">

                  {sosList.map(
                    (
                      sos
                    ) => (

                      <div
                        key={
                          sos.id
                        }
                        className={`incident-card ${
                          selectedSOS?.id ===
                          sos.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedSOS(
                            sos
                          )
                        }
                      >

                        <div className="incident-top">

                          <div>

                            <h3>

                              {
                                sos.emergencyType ||
                                sos.victimName
                              }

                            </h3>

                            <p>

                              <MapPin size={14} />

                              {
                                sos.humanReadableLocation
                              }

                            </p>

                          </div>

                          <span className="critical">

                            {
                              sos.severity ||
                              "CRITICAL"
                            }

                          </span>

                        </div>

                        <div className="incident-bottom">

                          <span>
                            Active
                            Incident
                          </span>

                          {selectedSOS?.id ===
                            sos.id && (

                            <CheckCircle2 size={18} />

                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

              <div className="dispatch-footer">

                <button
                  className="cancel-btn"
                  onClick={() =>
                    setOpenDispatchModal(
                      false
                    )
                  }
                >

                  Cancel

                </button>

                <button
                  className="assign-btn"
                  onClick={
                    dispatchSOS
                  }
                >

                  <Send size={16} />

                  Dispatch Ambulance

                </button>

              </div>

            </div>

          </div>

        )}

    </div>

  );

}

export default AmbulanceLogistics;
