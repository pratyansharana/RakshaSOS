import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  ClipboardList,
  Shield,
  PlusCircle,
  Activity,
  LogOut,
  Bell,
  Settings,
  Radio,
  Search,
} from "lucide-react";

import {
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig.ts";

import {
  useEffect,
  useState,
} from "react";

import "../styles/PoliceFixedLayout.css";

interface PoliceStation {
  policeStationName?: string;
  stationName?: string;

  officerName?: string;

  precinct?: string;
}

export default function PoliceLayout() {

  const navigate =
    useNavigate();

  const [
    authReady,

    setAuthReady,
  ] = useState(false);

  const [
    stationData,

    setStationData,
  ] = useState<PoliceStation>({});

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,

        async (user) => {

          if (!user) {

            navigate(
              "/police-login"
            );

            return;
          }

          try {

            const policeRef =
              doc(
                db,

                "policeStations",

                user.uid
              );

            const policeSnap =
              await getDoc(
                policeRef
              );

            if (
              policeSnap.exists()
            ) {

              setStationData(
                policeSnap.data()
              );
            }

          } catch (
            error
          ) {

            console.log(
              error
            );
          }

          setAuthReady(
            true
          );
        }
      );

    return () =>
      unsubscribe();

  }, [navigate]);

  const handleLogout =
    async () => {

      await signOut(auth);

      navigate(
        "/police-login"
      );
    };

  if (!authReady) {

    return null;
  }

  return (

    <div className="police-layout">

      {/* SIDEBAR */}

      <aside className="police-sidebar">

        <div>

          {/* LOGO */}

          <div className="police-brand">

            <div className="police-brand-icon">

              <Shield
                size={28}
              />
            </div>

            <div>

              <h1>
                {
                  stationData
                    ?.policeStationName ||
                  stationData
                    ?.stationName ||
                  "Police HQ"
                }
              </h1>

              <p>
                Active Duty
                {" • "}
                {
                  stationData
                    ?.precinct ||
                  "Precinct"
                }
              </p>

            </div>

          </div>

          {/* NAVIGATION */}

          <nav className="police-nav">

            <NavLink
              to="/police-dashboard"
              end
              className={(
                {
                  isActive,
                }
              ) =>
                isActive
                  ? "police-link active"
                  : "police-link"
              }
            >

              <LayoutDashboard
                size={20}
              />

              <span>
                Command Center
              </span>

            </NavLink>

            <NavLink
              to="/police-dashboard/incident-logs"
              className={(
                {
                  isActive,
                }
              ) =>
                isActive
                  ? "police-link active"
                  : "police-link"
              }
            >

              <ClipboardList
                size={20}
              />

              <span>
                Incident Logs
              </span>

            </NavLink>

            <NavLink
              to="/police-dashboard/profile"
              className={(
                {
                  isActive,
                }
              ) =>
                isActive
                  ? "police-link active"
                  : "police-link"
              }
            >

              <Shield
                size={20}
              />

              <span>
                Police Profile
              </span>

            </NavLink>

          </nav>

        </div>

        {/* BOTTOM */}

        <div>

          <button className="dispatch-unit-btn">

            <PlusCircle
              size={20}
            />

            ADD UNIT

          </button>

          <div className="sidebar-bottom">

            <button className="bottom-link">

              <Activity
                size={18}
              />

              <span>
                System Health
              </span>

            </button>

            <button
              className="bottom-link logout-btn"
              onClick={
                handleLogout
              }
            >

              <LogOut
                size={18}
              />

              <span>
                Logout
              </span>

            </button>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <div className="police-main">

        {/* TOPBAR */}

        <header className="police-topbar">

          <div className="topbar-left">

            <h2>
              COMMAND CENTER
            </h2>

            <div className="live-badge">

              <span className="live-dot" />

              LIVE MONITORING

            </div>

          </div>

          <div className="topbar-right">

            {/* SEARCH */}

            <div className="search-box">

              <Search
                size={18}
              />

              <input
                type="text"
                placeholder="Search incidents, units..."
              />

            </div>

            {/* ICONS */}

            <button className="icon-btn">

              <Bell
                size={20}
              />

            </button>

            <button className="icon-btn">

              <Settings
                size={20}
              />

            </button>

            <button className="icon-btn">

              <Radio
                size={20}
              />

            </button>

            {/* PROFILE */}

            <div className="topbar-profile">

              <div>

                <h4>
                  {
                    stationData
                      ?.officerName ||
                    "Officer"
                  }
                </h4>

                <p>
                  Senior Dispatcher
                </p>

              </div>

              <div className="profile-avatar">

                <Shield
                  size={18}
                />

              </div>

            </div>

          </div>

        </header>

        {/* PAGE */}

        <div className="police-page">

          <Outlet />

        </div>

      </div>

    </div>
  );
}