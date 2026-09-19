import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router";
import { auth, db } from "../Firebase/Firebase";
import Style from "./Projects.module.css";

const OWNER_EMAIL = "smabumusa98@gmail.com";

function Projects() {
  const { user } = useSelector((state) => state.auth || {});

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

  // Updated Flexible Permission Checker Helper Function
  const hasPermission = (primaryKey, ...fallbackKeys) => {
    if (isAdmin) return true; // Admins have full access
    if (permissions[primaryKey]) return true;
    return fallbackKeys.some((key) => permissions[key]);
  };

  return (
    <div className={Style.projectsContainer}>
      <aside className={Style.aside}>
        <div className={Style.asideHeader}>
          <span>Projects Portal</span>
        </div>

        {!loading && (
          <nav className={Style.asideNav}>
            {/* Summary Tab Check (projects_tab_summary) */}
            {hasPermission("projects_tab_summary", "projects_summary", "canAccessSummary") && (
              <NavLink
                to="Summery"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                Summary
              </NavLink>
            )}

            {/* Serviced & Schedule Tab Check (projects_tab_serviced) */}
            {hasPermission("projects_tab_serviced", "projects_schedule", "canAccessSchedule") && (
              <NavLink
                to="Serviced_and_Schedule"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                Serviced and Schedule
              </NavLink>
            )}
          </nav>
        )}
      </aside>

      <main className={Style.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default Projects;