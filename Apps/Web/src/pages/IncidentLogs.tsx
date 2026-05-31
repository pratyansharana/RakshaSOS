import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  query,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import {
  Search,
  Ambulance,
  AlertTriangle,
  MapPin,
  Clock3,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import "../styles/IncidentLogs.css";

export default function IncidentLogs() {

  const [
    currentUser,
    setCurrentUser,
  ] = useState<any>(null);

  const [
    incidents,
    setIncidents,
  ] = useState<any[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  /* AUTH */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {

          if (user) {

            setCurrentUser(
              user
            );

          }

        }
      );

    return () =>
      unsubscribe();

  }, []);

  /* INCIDENTS */

  useEffect(() => {

    if (!currentUser)
      return;

    const sosRef =
      collection(
        db,
        "sos_alerts"
      );

    const q =
      query(

        sosRef,

        where(
          "accepted_by_hospital",
          "==",
          currentUser.uid
        )

      );

    const unsubscribe =
      onSnapshot(
        q,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({

                id:
                  doc.id,

                ...doc.data(),

              })
            );

          setIncidents(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [currentUser]);

  /* FILTER */

  const filteredIncidents =
    useMemo(() => {

      return incidents.filter(
        (incident) => {

          const searchText =
`
${incident.id}
${incident.victimName}
${incident.address}
${incident.type}
`
            .toLowerCase();

          return searchText.includes(
            search.toLowerCase()
          );

        }
      );

    }, [
      incidents,
      search,
    ]);

  /* STATS */

  const totalToday =
    incidents.length;

  const criticalCount =
    incidents.filter(
      (incident) =>
        incident.severity ===
        "Critical"
    ).length;

  const activeAmbulances =
    incidents.filter(
      (incident) =>
        incident.ambulanceStatus ===
        "on_route"
    ).length;

  /* STATUS */

  const getStatus =
    (incident: any) => {

      if (
        incident.incidentStatus ===
        "completed"
      ) {

        return "resolved";

      }

      if (
        incident.ambulanceStatus ===
        "arrived"
      ) {

        return "on-site";

      }

      if (
        incident.ambulanceStatus ===
        "on_route"
      ) {

        return "dispatched";

      }

      if (
        incident.hospitalStatus ===
        "accepted"
      ) {

        return "active";

      }

      return "waiting";

    };

  /* VERIFICATION */

  const getVerification =
    (incident: any) => {

      const image =
        incident.imageUrl;

      const voice =
        incident.voiceNoteUrl;

      if (
        image &&
        voice
      ) {

        return {
          label:
            "AI VERIFIED",

          className:
            "verified",
        };

      }

      if (
        image ||
        voice
      ) {

        return {
          label:
            "PARTIAL",

          className:
            "partial",
        };

      }

      return {
        label:
          "UNVERIFIED",

        className:
          "unverified",
      };

    };

  /* COMPLETE */

  const markCompleted =
    async (
      incidentId: string
    ) => {

      try {

        await updateDoc(

          doc(
            db,
            "sos_alerts",
            incidentId
          ),

          {

            incidentStatus:
              "completed",

            completedAt:
              Date.now(),

          }

        );

      } catch (error) {

        console.error(
          error
        );

      }

    };

  return (

    <div className="incident-page">

      {/* SEARCH */}

      <div className="incident-topbar">

        <div className="incident-search">

          <Search
            size={20}
          />

          <input
            type="text"
            placeholder="Search by SOS ID, victim name, or location..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

      </div>

      {/* STATS */}

      <div className="incident-stats">

        <div className="stat-card">

          <div className="stat-icon red">

            <AlertTriangle
              size={24}
            />

          </div>

          <h4>
            Total Incidents
          </h4>

          <h1>
            {totalToday}
          </h1>

          <p>
            Live hospital logs
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-icon yellow">

            <AlertTriangle
              size={24}
            />

          </div>

          <h4>
            Critical Alerts
          </h4>

          <h1>
            {criticalCount}
          </h1>

          <p>
            Requires immediate response
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-icon green">

            <Ambulance
              size={24}
            />

          </div>

          <h4>
            Active Ambulances
          </h4>

          <h1>
            {activeAmbulances}
          </h1>

          <p>
            Units currently on route
          </p>

        </div>

      </div>

      {/* TABLE */}

      <div className="incident-table-wrapper">

        <table className="incident-table">

          <thead>

            <tr>

              <th>
                SOS ID
              </th>

              <th>
                Victim
              </th>

              <th>
                Medical Details
              </th>

              <th>
                Incident Type
              </th>

              <th>
                Severity
              </th>

              <th>
                Verification
              </th>

              <th>
                Status
              </th>

              <th>
                Location
              </th>

              <th>
                Ambulance Details
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredIncidents.map(
              (incident) => {

                const verification =
                  getVerification(
                    incident
                  );

                return (

                  <tr
                    key={
                      incident.id
                    }
                  >

                    {/* SOS ID */}

                    <td className="sos-id">

                      #
                      {
                        incident.id.slice(
                          0,
                          6
                        )
                      }

                    </td>

                    {/* VICTIM */}

                    <td>

                      <div className="victim-cell">

                        <div className="victim-avatar">

                          {
                            incident
                              .victimName?.[0] ||
                            "U"
                          }

                        </div>

                        <div>

                          <strong>

                            {
                              incident.victimName ||
                              "Unknown"
                            }

                          </strong>

                          <p>

                            {
                              incident.gender ||
                              "N/A"
                            }

                            {" • "}

                            {
                              incident.age ||
                              "N/A"
                            }

                          </p>

                        </div>

                      </div>

                    </td>

                    {/* MEDICAL */}

                    <td>

                      <div className="medical-details">

                        <span>

                          <strong>
                            Blood:
                          </strong>

                          {" "}

                          {
                            incident.bloodGroup ||
                            "N/A"
                          }

                        </span>

                        <span>

                          <strong>
                            Condition:
                          </strong>

                          {" "}

                          {
                            incident.condition ||
                            "N/A"
                          }

                        </span>

                        <span>

                          <strong>
                            Pulse:
                          </strong>

                          {" "}

                          {
                            incident.pulse ||
                            "N/A"
                          }

                        </span>

                      </div>

                    </td>

                    {/* INCIDENT */}

                    <td>

                      <div className="incident-type">

                        <AlertTriangle
                          size={16}
                        />

                        {
                          incident.type ||
                          "Emergency"
                        }

                      </div>

                    </td>

                    {/* SEVERITY */}

                    <td>

                      <span
                        className={`
severity-badge
${incident.severity?.toLowerCase()}
`}
                      >

                        {
                          incident.severity ||
                          "Low"
                        }

                      </span>

                    </td>

                    {/* VERIFICATION */}

                    <td>

                      <div className="verification-stack">

                        <span
                          className={`
verification-badge
${verification.className}
`}
                        >

                          <ShieldCheck
                            size={13}
                          />

                          {" "}

                          {
                            verification.label
                          }

                        </span>

                        <div className="verification-meta">

                          <span>

                            {
                              incident.imageUrl
                                ? "Image Uploaded"
                                : "No Image"
                            }

                          </span>

                          <span>

                            {
                              incident.voiceNoteUrl
                                ? "Voice Note Added"
                                : "No Voice Note"
                            }

                          </span>

                        </div>

                      </div>

                    </td>

                    {/* STATUS */}

                    <td>

                      <span
                        className={`
status-badge
${getStatus(
  incident
)}
`}
                      >

                        {
                          getStatus(
                            incident
                          )
                        }

                      </span>

                    </td>

                    {/* LOCATION */}

                    <td>

                      <div className="location-cell">

                        <MapPin
                          size={15}
                        />

                        {
                          incident.address ||
                          "N/A"
                        }

                      </div>

                    </td>

                    {/* AMBULANCE */}

                    <td>

                      {incident
                        .ambulanceDetails ? (

                        <div className="ambulance-cell">

                          <strong>

                            {
                              incident
                                .ambulanceDetails
                                ?.ambulanceNumber
                            }

                          </strong>

                          <p>

                            {
                              incident
                                .ambulanceDetails
                                ?.driverName
                            }

                          </p>

                          <span>

                            {
                              incident
                                .ambulanceDetails
                                ?.driverPhone
                            }

                          </span>

                        </div>

                      ) : (

                        <span className="na-text">

                          Not Assigned

                        </span>

                      )}

                    </td>

                    {/* ACTION */}

                    <td>

                      {getStatus(
                        incident
                      ) !==
                        "resolved" && (

                        <select
                          className="incident-select"
                          onChange={(
                            e
                          ) => {

                            if (
                              e.target
                                .value ===
                              "completed"
                            ) {

                              markCompleted(
                                incident.id
                              );

                            }

                          }}
                        >

                          <option>

                            Actions

                          </option>

                          <option value="completed">

                            Mark Completed

                          </option>

                        </select>

                      )}

                      {getStatus(
                        incident
                      ) ===
                        "resolved" && (

                        <div className="resolved-tag">

                          <CheckCircle2
                            size={16}
                          />

                          Completed

                        </div>

                      )}

                    </td>

                  </tr>

                );

              }
            )}

          </tbody>

        </table>

        {filteredIncidents.length ===
          0 && (

          <div className="incident-empty">

            <Clock3
              size={44}
            />

            <h2>
              No Incident Logs
            </h2>

            <p>
              Accepted SOS logs
              will appear here.
            </p>

          </div>

        )}

      </div>

    </div>

  );

}