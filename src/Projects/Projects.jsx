import { NavLink, Outlet } from "react-router";
import Style from "./Projects.module.css";

function Projects() {
  return (
    <div className={Style.projectsContainer}>
      <aside className={Style.aside}>
        <div className={Style.asideHeader}>
          <span>Projects Portal</span>
        </div>
        <nav className={Style.asideNav}>
          <NavLink
            to="Summery"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Summary
          </NavLink>
          <NavLink
            to="Serviced_and_Schedule"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Serviced and Schedule
          </NavLink>
        </nav>
      </aside>

      <main className={Style.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default Projects;