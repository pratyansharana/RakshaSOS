import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import {
  FaBuilding,
  FaUserShield,
  FaPhoneAlt,
  FaUserPlus,
} from "react-icons/fa";

import "../styles/PoliceProfile.css";

export default function PoliceProfile() {
  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  /* STATION */

  const [stationData, setStationData] =
    useState({
      stationName: "",
      policeStationName: "",
      address: "",
      emergencyHotline: "",
      officerName: "",
      precinct: "",

      womenSafetyEnabled: true,
      nightPatrolEnabled: false,
      emergencyAvailabilityEnabled: true,
      latitude: "",
      longitude: "",
    });

  /* INSPECTORS */

  const [inspectors, setInspectors] =
    useState<any[]>([]);

  /* NEW INSPECTOR */

  const [newInspector, setNewInspector] =
    useState({
      inspectorName: "",
      policeId: "",
      rank: "",
      specialization: "",
      phone: "",
    });

  /* AUTH */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            setCurrentUser(user);
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* LOAD STATION */

  useEffect(() => {
    if (!currentUser) return;

    const loadStation =
      async () => {
        try {
          const stationRef =
            doc(
              db,
              "policeStations",
              currentUser.uid
            );

          const stationSnap =
            await getDoc(
              stationRef
            );

          if (
            stationSnap.exists()
          ) {
            const data = stationSnap.data();
            setStationData({
              ...stationData,
              ...data,
              stationName: data.stationName || data.policeStationName || "",
              policeStationName: data.policeStationName || data.stationName || "",
              officerName: data.officerName || "",
              precinct: data.precinct || "",
            });
          } else {
            await setDoc(
              stationRef,
              {
                stationName:
                  "New Police Station",
                policeStationName:
                  "New Police Station",
                officerName: "",
                precinct: "",

                address: "",

                emergencyHotline:
                  "",

                womenSafetyEnabled:
                  true,

                nightPatrolEnabled:
                  false,

                emergencyAvailabilityEnabled:
                  true,
                latitude: "",
                longitude: "",
              }
            );
          }

          setLoading(false);
        } catch (error) {
          console.error(
            error
          );

          setLoading(false);
        }
      };

    loadStation();
  }, [currentUser]);

  /* LOAD INSPECTORS */

  useEffect(() => {
    if (!currentUser)
      return;

    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "inspectors"
        ),
        (snapshot) => {
          const data =
            snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter(
                (item: any) =>
                  item.stationId ===
                  currentUser.uid
              );

          setInspectors(
            data
          );
        }
      );

    return () =>
      unsubscribe();
  }, [currentUser]);

  /* SAVE STATION */

  const saveStation =
    async () => {
      if (!currentUser)
        return;

      try {
        await updateDoc(
          doc(
            db,
            "policeStations",
            currentUser.uid
          ),
          {
            ...stationData,
            policeStationName: stationData.stationName,
          }
        );

        alert(
          "Station Updated"
        );
      } catch (error) {
        console.error(
          error
        );
      }
    };

  /* REGISTER INSPECTOR */

  const registerInspector =
    async () => {
      if (
        !newInspector.inspectorName
      )
        return;

      try {
        await addDoc(
          collection(
            db,
            "inspectors"
          ),
          {
            stationId:
              currentUser.uid,

            inspectorName:
              newInspector.inspectorName,

            policeId:
              newInspector.policeId,

            rank:
              newInspector.rank,

            specialization:
              newInspector.specialization,

            phone:
              newInspector.phone,

            available:
              true,

            createdAt:
              Date.now(),
          }
        );

        setNewInspector({
          inspectorName:
            "",

          policeId:
            "",

          rank:
            "",

          specialization:
            "",

          phone:
            "",
        });
      } catch (error) {
        console.error(
          error
        );
      }
    };

  /* TOGGLE STATUS */

  const toggleInspector =
    async (
      inspectorId: string,
      currentStatus: boolean
    ) => {
      try {
        await updateDoc(
          doc(
            db,
            "inspectors",
            inspectorId
          ),
          {
            available:
              !currentStatus,
          }
        );
      } catch (error) {
        console.error(
          error
        );
      }
    };

  /* TOGGLE SETTINGS */

  const toggleSetting =
    async (
      field: string,
      value: boolean
    ) => {
      const updated = {
        ...stationData,

        [field]: !value,
      };

      setStationData(
        updated
      );

      try {
        await updateDoc(
          doc(
            db,
            "policeStations",
            currentUser.uid
          ),
          {
            [field]:
              !value,
          }
        );
      } catch (error) {
        console.error(
          error
        );
      }
    };

  if (loading) {
    return (
      <div className="profile-loading">
        Loading Station...
      </div>
    );
  }

  return (
    <div className="police-profile-page">

      {/* PAGE HEADER */}

      <div className="profile-header">

        <div>

          <h1>
            Station Profile &
            Unit Management
          </h1>

          <p>
            Configure
            administrative
            parameters and
            active patrol
            units.
          </p>

        </div>

      </div>

      <div className="profile-grid">

        {/* LEFT COLUMN */}

        <div className="profile-left">

          {/* STATION DETAILS */}

          <div className="profile-card">

            <div className="card-title">

              <FaBuilding />

              <h2>
                Station Details
              </h2>

            </div>

            <div className="form-group">

              <label>
                Station Name
              </label>

              <input
                value={
                  stationData.stationName
                }
                onChange={(
                  e
                ) =>
                  setStationData({
                    ...stationData,
                    stationName:
                      e.target
                        .value,
                  })
                }
              />

            </div>

            <div className="form-group">
              <label>Officer Name</label>
              <input
                value={stationData.officerName}
                onChange={(e) =>
                  setStationData({
                    ...stationData,
                    officerName: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Precinct</label>
              <input
                value={stationData.precinct}
                onChange={(e) =>
                  setStationData({
                    ...stationData,
                    precinct: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">

              <label>
                Address
              </label>

              <textarea
                rows={4}
                value={
                  stationData.address
                }
                onChange={(
                  e
                ) =>
                  setStationData({
                    ...stationData,
                    address:
                      e.target
                        .value,
                  })
                }
              />

            </div>

            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                value={stationData.latitude}
                onChange={(e) =>
                  setStationData({
                    ...stationData,
                    latitude: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                value={stationData.longitude}
                onChange={(e) =>
                  setStationData({
                    ...stationData,
                    longitude: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">

              <label>
                Emergency
                Hotline
              </label>

              <div className="input-icon">

                <FaPhoneAlt />

                <input
                  value={
                    stationData.emergencyHotline
                  }
                  onChange={(
                    e
                  ) =>
                    setStationData({
                      ...stationData,
                      emergencyHotline:
                        e.target
                          .value,
                    })
                  }
                />

              </div>

            </div>

            <button
              className="save-btn"
              onClick={
                saveStation
              }
            >
              Save Changes
            </button>

          </div>
                    {/* OPERATIONAL TOGGLES */}

          <div className="profile-card">

            <div className="card-title">

              <FaUserShield />

              <h2>
                Operational
                Toggles
              </h2>

            </div>

            <div className="toggle-row">

              <div>

                <h4>
                  Women Safety
                  Response
                </h4>

                <p>
                  Prioritize
                  dedicated
                  response units
                  for women
                  safety SOS.
                </p>

              </div>

              <label className="switch">

                <input
                  type="checkbox"
                  checked={
                    stationData.womenSafetyEnabled
                  }
                  onChange={() =>
                    toggleSetting(
                      "womenSafetyEnabled",
                      stationData.womenSafetyEnabled
                    )
                  }
                />

                <span className="slider"></span>

              </label>

            </div>

            <div className="toggle-row">

              <div>

                <h4>
                  Night Patrol
                </h4>

                <p>
                  Enable night
                  shift routing
                  automation.
                </p>

              </div>

              <label className="switch">

                <input
                  type="checkbox"
                  checked={
                    stationData.nightPatrolEnabled
                  }
                  onChange={() =>
                    toggleSetting(
                      "nightPatrolEnabled",
                      stationData.nightPatrolEnabled
                    )
                  }
                />

                <span className="slider"></span>

              </label>

            </div>

            <div className="toggle-row">

              <div>

                <h4>
                  Emergency
                  Availability
                </h4>

                <p>
                  Allow direct
                  citizen
                  dispatch
                  requests.
                </p>

              </div>

              <label className="switch">

                <input
                  type="checkbox"
                  checked={
                    stationData.emergencyAvailabilityEnabled
                  }
                  onChange={() =>
                    toggleSetting(
                      "emergencyAvailabilityEnabled",
                      stationData.emergencyAvailabilityEnabled
                    )
                  }
                />

                <span className="slider"></span>

              </label>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN */}

        <div className="profile-right">

          <div className="profile-card inspectors-card">

            <div className="inspectors-header">

              <div className="card-title">

                <FaUserShield />

                <h2>
                  Inspectors on
                  Duty
                </h2>

              </div>

              <button className="add-inspector-btn">

                <FaUserPlus />

                Add Inspector

              </button>

            </div>

            {/* QUICK REGISTRATION */}

            <div className="registration-box">

              <h3>
                Quick
                Registration
              </h3>

              <div className="registration-grid">

                <input
                  placeholder="Inspector Name"
                  value={
                    newInspector.inspectorName
                  }
                  onChange={(e) =>
                    setNewInspector({
                      ...newInspector,
                      inspectorName:
                        e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Police ID"
                  value={
                    newInspector.policeId
                  }
                  onChange={(e) =>
                    setNewInspector({
                      ...newInspector,
                      policeId:
                        e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Rank"
                  value={
                    newInspector.rank
                  }
                  onChange={(e) =>
                    setNewInspector({
                      ...newInspector,
                      rank:
                        e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Specialization"
                  value={
                    newInspector.specialization
                  }
                  onChange={(e) =>
                    setNewInspector({
                      ...newInspector,
                      specialization:
                        e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Contact Number"
                  value={
                    newInspector.phone
                  }
                  onChange={(e) =>
                    setNewInspector({
                      ...newInspector,
                      phone:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="registration-actions">

                <button
                  onClick={
                    registerInspector
                  }
                  className="register-btn"
                >
                  Register
                  Inspector
                </button>

              </div>

            </div>

            {/* INSPECTORS TABLE */}

            <div className="inspectors-table-wrapper">

              <table className="inspectors-table">

                <thead>

                  <tr>

                    <th>
                      Inspector
                    </th>

                    <th>
                      Police ID
                    </th>

                    <th>
                      Rank
                    </th>

                    <th>
                      Specialization
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {inspectors.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={6}
                        className="empty-row"
                      >

                        No Inspectors
                        Registered Yet

                      </td>

                    </tr>

                  ) : (

                    inspectors.map(
                      (
                        inspector
                      ) => (

                        <tr
                          key={
                            inspector.id
                          }
                        >

                          <td>

                            <div className="inspector-info">

                              <div className="inspector-avatar">

                                {inspector.inspectorName?.charAt(
                                  0
                                ) ||
                                  "I"}

                              </div>

                              <div>

                                <strong>

                                  {inspector.inspectorName}

                                </strong>

                              </div>

                            </div>

                          </td>

                          <td>

                            {inspector.policeId ||
                              "N/A"}

                          </td>

                          <td>

                            {inspector.rank ||
                              "N/A"}

                          </td>

                          <td>

                            {inspector.specialization ||
                              "N/A"}

                          </td>

                          <td>

                            {inspector.phone ||
                              "N/A"}

                          </td>

                          <td>

                            <button
                              className={
                                inspector.available
                                  ? "status-active"
                                  : "status-standby"
                              }
                              onClick={() =>
                                toggleInspector(
                                  inspector.id,
                                  inspector.available
                                )
                              }
                            >

                              {inspector.available
                                ? "Active"
                                : "Standby"}

                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

            <div className="table-footer">

              Showing{" "}

              {
                inspectors.length
              }

              {" "}
              Registered
              Inspectors

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}