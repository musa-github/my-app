import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router";
import { auth, db } from "../Firebase/Firebase";
import Style from "./EmployeeData.module.css";

const OWNER_EMAIL = "osanlift@gmail.com";

function EmployeeData() {
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
      <aside className={Style.aside}>
        <div className={Style.asideHeader}>
          <span>Employee Portal</span>
        </div>

        {!loading && (
          <nav className={Style.asideNav}>
            {/* Your Profile Link */}
            <NavLink
              to="YourProfile"
              className={({ isActive }) =>
                isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
              }
            >
              Your Profile
            </NavLink>

            {/* Attendance Link */}
            {(hasPermission("emp_tab_attendance") || hasPermission("canGiveAttendance")) && (
              <NavLink
                to="Attendance"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                Attendance
              </NavLink>
            )}

            {/* Employee List Link */}
            {hasPermission("emp_tab_list") && (
              <NavLink
                to="EmployeeList"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                Employee List
              </NavLink>
            )}

            {/* Payroll Link */}
            {hasPermission("emp_tab_payroll") && (
              <NavLink
                to="Payroll"
                className={({ isActive }) =>
                  isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
                }
              >
                Payroll & Salary
              </NavLink>
            )}
          </nav>
        )}
      </aside>

      <main className={Style.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default EmployeeData;