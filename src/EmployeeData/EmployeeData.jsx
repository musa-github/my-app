import { NavLink, Outlet } from "react-router";
import Style from "./EmployeeData.module.css";

function EmployeeData() {
  return (
    <div className={Style.employeeContainer}>
      <aside className={Style.aside}>
        <div className={Style.asideHeader}>
          <span>Employee Portal</span>
        </div>
        <nav className={Style.asideNav}>
          <NavLink
            to="YourProfile"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Your Profile
          </NavLink>
            <NavLink
            to="Attendance"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Attendance
          </NavLink>
          
          <NavLink
            to="EmployeeList"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Employee List
          </NavLink>
         
          <NavLink
            to="Payroll"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Payroll & Salary
          </NavLink>
        </nav>
      </aside>

      <main className={Style.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default EmployeeData;