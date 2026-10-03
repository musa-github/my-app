import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router-dom";
import { auth, db } from "../Firebase/Firebase";
import Style from "./Projects.module.css";

const OWNER_EMAIL = "osanlift@gmail.com";

function Projects() {
  const { user } = useSelector((state) => state.auth || {});

  // Sidebar Open/Collapsed state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Permission & Admin States
  const [permissions, setPermissions] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUserEmail = (user?.email || auth.currentUser?.email || "").toLowerCase();

  // Fetch Permissions from Firebase
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!currentUserEmail) {
        setPermissions({});
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const cleanEmail = currentUserEmail.replace(/[^a-zA-Z0-9]/g, "_");

        // Admin status check
        const adminDoc = await getDoc(doc(db, "app_admins", cleanEmail));
        const adminAccess = currentUserEmail === OWNER_EMAIL || adminDoc.exists();
        setIsAdmin(adminAccess);

        // User permissions check
        const permDoc = await getDoc(doc(db, "user_permissions", cleanEmail));
        if (permDoc.exists()) {
          setPermissions(permDoc.data());
        } else {
          setPermissions({});
        }
      } catch (error) {
        console.error("Error fetching permissions in Projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [currentUserEmail]);

  // Permission Checker
  const hasPermission = (primaryKey, ...fallbackKeys) => {
    if (isAdmin) return true;
    if (permissions[primaryKey]) return true;
    return fallbackKeys.some((key) => permissions[key]);
  };

  return (
    <div className={Style.projectsContainer}>
      {/* Sidebar Section */}
      <aside className={`${Style.aside} ${!isSidebarOpen ? Style.asideCollapsed : ""}`}>
        <div className={Style.asideHeader}>
          {isSidebarOpen && <span className={Style.titleText}>Projects Portal</span>}
          <button
            type="button"
            className={Style.toggleBtn}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {!loading && (
          <nav className={Style.asideNav}>
            {hasPermission("projects_tab_summary", "projects_summary", "canAccessSummary") && (
              <NavLink
                to="Summery"
                title="Summary"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                <span className={Style.navIcon}>📊</span>
                {isSidebarOpen && <span className={Style.linkText}>Summary</span>}
              </NavLink>
            )}

            {hasPermission("projects_tab_serviced", "projects_schedule", "canAccessSchedule") && (
              <NavLink
                to="Serviced_and_Schedule"
                title="Serviced and Schedule"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                <span className={Style.navIcon}>📅</span>
                {isSidebarOpen && <span className={Style.linkText}>Serviced and Schedule</span>}
              </NavLink>
            )}
          </nav>
        )}
      </aside>

      {/* Main Content Area */}
      <main className={Style.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default Projects;