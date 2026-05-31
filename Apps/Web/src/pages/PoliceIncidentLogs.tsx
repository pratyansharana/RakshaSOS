import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  db,
  auth
} from "../firebase/firebaseConfig";

import {
  FaAmbulance,
  FaFire,
  FaSearch,
} from "react-icons/fa";

import {
  MdKeyboardArrowDown,
} from "react-icons/md";

import "../styles/PoliceIncidentLogs.css";

export default function PoliceIncidentLogs() {
  const [incidents, setIncidents] =
    useState<any[]>([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const policeStationId = auth.currentUser?.uid;

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [severityFilter, setSeverityFilter] =
    useState("All");

  /* REALTIME SOS HISTORY */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        query(
          collection(db, "sos_alerts"),
          where("police_station_id", "==", policeStationId)
        ),
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                victimName: doc.data().victim_name || doc.data().victimName || "Unknown",
                type: doc.data().sos_type || doc.data().type || "Emergency",
                severity: doc.data().severity || "Critical",
                ...doc.data(),
              })
            );

          setIncidents(data);
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* STATUS LOGIC */

  const getStatus = (
    incident: any
  ) => {
    if (
      incident.incidentStatus ===
      "completed"
    ) {
      return "Resolved";
    }

    if (
      incident.ambulanceStatus ===
      "arrived"
    ) {
      return "On Site";
    }

    if (
      incident.ambulanceStatus ===
      "on-route"
    ) {
      return "En Route";
    }

    if (
      incident.hospitalStatus ===
      "accepted"
    ) {
      return "Accepted";
    }

    if (
      incident.hospitalStatus ===
      "rejected"
    ) {
      return "Rejected";
    }

    return "Pending";
  };

  /* FILTERED DATA */

  const filteredIncidents =
    useMemo(() => {
      return incidents.filter(
        (incident) => {
          const searchMatch =
            incident.id
              ?.toLowerCase()
              .includes(
                searchTerm.toLowerCase()
              ) ||
            incident.victimName
              ?.toLowerCase()
              .includes(
                searchTerm.toLowerCase()
              ) ||
            incident.address
              ?.toLowerCase()
              .includes(
                searchTerm.toLowerCase()
              );

          const statusMatch =
            statusFilter ===
              "All" ||
            getStatus(
              incident
            ) === statusFilter;

          const severityMatch =
            severityFilter ===
              "All" ||
            incident.severity ===
              severityFilter;

          return (
            searchMatch &&
            statusMatch &&
            severityMatch
          );
        }
      );
    }, [
      incidents,
      searchTerm,
      statusFilter,
      severityFilter,
    ]);

  /* STATS */

  const totalIncidents =
    incidents.length;

  const activeIncidents =
    incidents.filter(
      (incident) =>
        incident.incidentStatus !==
        "completed"
    ).length;

  const resolvedIncidents =
    incidents.filter(
      (incident) =>
        incident.incidentStatus ===
        "completed"
    ).length;

  const rejectedIncidents =
    incidents.filter(
      (incident) =>
        incident.hospitalStatus ===
        "rejected"
    ).length;

  return (
    <div className="police-logs-page">

      {/* HEADER */}

      <div className="logs-header">

        <div>

          <h1>
            Incident Logs &
            History
          </h1>

          <p>
            Comprehensive
            registry of all
            RakshaSOS emergency
            responses.
          </p>

        </div>

      </div>

      {/* FILTER BAR */}

      <div className="logs-filter-bar">

        <div className="logs-filters">

          <div className="search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Search SOS ID, victim or location..."
              value={
                searchTerm
              }
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

          </div>

          <div className="filter-select">

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >

              <option>
                All
              </option>

              <option>
                Pending
              </option>

              <option>
                Accepted
              </option>

              <option>
                Rejected
              </option>

              <option>
                En Route
              </option>

              <option>
                On Site
              </option>

              <option>
                Resolved
              </option>

            </select>

            <MdKeyboardArrowDown />

          </div>

          <div className="filter-select">

            <select
              value={
                severityFilter
              }
              onChange={(e) =>
                setSeverityFilter(
                  e.target.value
                )
              }
            >

              <option>
                All
              </option>

              <option>
                Critical
              </option>

              <option>
                High
              </option>

              <option>
                Medium
              </option>

              <option>
                Low
              </option>

            </select>

            <MdKeyboardArrowDown />

          </div>

        </div>

        <div className="active-counter">

          ●{" "}
          {
            activeIncidents
          }{" "}
          Active Incidents

        </div>

      </div>

      {/* STATS */}

      <div className="logs-stats">

        <div className="stat-card">
          <h4>
            Total
            Incidents
          </h4>

          <h2>
            {
              totalIncidents
            }
          </h2>
        </div>

        <div className="stat-card">
          <h4>
            Active
          </h4>

          <h2>
            {
              activeIncidents
            }
          </h2>
        </div>

        <div className="stat-card">
          <h4>
            Resolved
          </h4>

          <h2>
            {
              resolvedIncidents
            }
          </h2>
        </div>

        <div className="stat-card">
          <h4>
            Rejected
          </h4>

          <h2>
            {
              rejectedIncidents
            }
          </h2>
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
                Victim Name
              </th>

              <th>
                Type
              </th>

              <th>
                Police Unit
              </th>

              <th>
                Hospital Status
              </th>

              <th>
                Support
              </th>

              <th>
                Time
              </th>

              <th>
                Status
              </th>

              <th>
                Ambulance
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredIncidents.length ===
            0 ? (

              <tr>

                <td
                  colSpan={9}
                  className="empty-cell"
                >

                  No Incident Records Found

                </td>

              </tr>

            ) : (

              filteredIncidents.map(
                (
                  incident
                ) => {

                  const displayStatus =
                    getStatus(
                      incident
                    );

                  return (

                    <tr
                      key={
                        incident.id
                      }
                    >

                      {/* SOS */}

                      <td>

                        <span className="sos-id">

                          #SOS-
                          {
                            incident.id.slice(
                              0,
                              5
                            )
                          }

                        </span>

                      </td>

                      {/* VICTIM */}

                      <td>

                        <div className="victim-cell">

                          <div className="victim-avatar">

                            {incident
                              .victimName?.charAt(
                                0
                              ) ||
                              "U"}

                          </div>

                          <div>

                            <strong>

                              {incident.victimName ||
                                "Unknown"}

                            </strong>

                            <p>

                              {incident.age ||
                                "N/A"}

                              {" • "}

                              {incident.gender ||
                                "N/A"}

                            </p>

                          </div>

                        </div>

                      </td>

                      {/* TYPE */}

                      <td>

                        <span
                          className={`type-badge ${
                            (
                              incident.type ||
                              ""
                            )
                              .toLowerCase()
                              .includes(
                                "accident"
                              )
                              ? "accident"

                              : (
                                  incident.type ||
                                  ""
                                )
                                  .toLowerCase()
                                  .includes(
                                    "fire"
                                  )
                              ? "fire"

                              : "default"
                          }`}
                        >

                          {incident.type ||
                            "Emergency"}

                        </span>

                      </td>

                      {/* UNIT */}

                      <td>

                        <div className="unit-cell">

                          {incident.acceptedFireStationName ||
                            "Unassigned"}

                        </div>

                      </td>

                      {/* HOSPITAL */}

                      <td>

                        <div className="hospital-cell">

                          <strong>

                            {incident.hospitalStatus ||
                              "Pending"}

                          </strong>

                          <p>

                            {incident.acceptedHospitalId
                              ? "Hospital Assigned"
                              : "Awaiting Response"}

                          </p>

                        </div>

                      </td>

                      {/* SUPPORT */}

                      <td>

                        <div className="support-icons">

                          {incident.ambulanceAssigned && (

                            <FaAmbulance />

                          )}

                          {incident
                            .assignedFireVehicles
                            ?.fireTenders >
                            0 && (
                            <FaFire />
                          )}

                        </div>

                      </td>

                      {/* TIME */}

                      <td>

                        {incident.completedAt
                          ? new Date(
                              incident.completedAt
                            ).toLocaleDateString()

                          : incident.arrivedAt
                          ? new Date(
                              incident.arrivedAt
                            ).toLocaleDateString()

                          : "N/A"}

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`status-badge ${displayStatus
                            .toLowerCase()
                            .replaceAll(
                              " ",
                              "-"
                            )}`}
                        >

                          {
                            displayStatus
                          }

                        </span>

                      </td>

                      {/* AMBULANCE */}

                      <td>

                        <div className="ambulance-cell">

                          <strong>

                            Unit #
                            {incident.assignedAmbulanceNumber ||
                              "N/A"}

                          </strong>

                          <p>

                            {incident.assignedDriverName ||
                              "No Driver"}

                          </p>

                          <span>

                            {incident.assignedDriverPhone ||
                              ""}

                          </span>

                        </div>

                      </td>

                    </tr>

                  );
                }
              )

            )}

          </tbody>

        </table>

        {/* FOOTER */}

        <div className="table-footer">

          <p>

            Showing{" "}
            {
              filteredIncidents.length
            }{" "}
            incident records

          </p>

          <div className="pagination">

            <button>
              1
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}