import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router";
import { auth, db } from "../Firebase/Firebase";
import Style from "./EmployeeData.module.css";

const OWNER_EMAIL = "osanlift@gmail.com";

function EmployeeData() {
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
        console.error("Error fetching permissions in EmployeeData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [currentUserEmail]);

  // Permission Checker Helper Function
  const hasPermission = (featureKey) => {
    if (isAdmin) return true; // Admins have full access
    return Boolean(permissions[featureKey]);
  };

  return (
    <div className={Style.employeeContainer}>
      {/* Sidebar Section */}
      <aside className={`${Style.aside} ${!isSidebarOpen ? Style.asideCollapsed : ""}`}>
        <div className={Style.asideHeader}>
          {isSidebarOpen && <span className={Style.titleText}>Employee Portal</span>}
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
            {/* Your Profile Link */}
            <NavLink
              to="YourProfile"
              title="Your Profile"
              className={({ isActive }) =>
                isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
              }
            >
              <span className={Style.navIcon}>👤</span>
              {isSidebarOpen && <span className={Style.linkText}>Your Profile</span>}
            </NavLink>

            {/* Attendance Link */}
            {(hasPermission("emp_tab_attendance") || hasPermission("canGiveAttendance")) && (
              <NavLink
                to="Attendance"
                title="Attendance"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                <span className={Style.navIcon}>📋</span>
                {isSidebarOpen && <span className={Style.linkText}>Attendance</span>}
              </NavLink>
            )}

            {/* Employee List Link */}
            {hasPermission("emp_tab_list") && (
              <NavLink
                to="EmployeeList"
                title="Employee List"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                <span className={Style.navIcon}>👥</span>
                {isSidebarOpen && <span className={Style.linkText}>Employee List</span>}
              </NavLink>
            )}

            {/* Payroll Link */}
            {hasPermission("emp_tab_payroll") && (
              <NavLink
                to="Payroll"
                title="Payroll & Salary"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                <span className={Style.navIcon}>💳</span>
                {isSidebarOpen && <span className={Style.linkText}>Payroll & Salary</span>}
              </NavLink>
            )}
          </nav>
        )}
      </aside>

      {/* Main Content Area */}
      <main className={Style.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default EmployeeData;