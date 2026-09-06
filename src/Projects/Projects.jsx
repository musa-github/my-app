// 





import { NavLink, Outlet } from 'react-router'
import Style from "./Projects.module.css"

function Projects() {
  return (
    <div className={Style.container}>
      <div className={Style.aside}>
        <NavLink to="Summery" className={({isActive})=>(isActive?Style.active:Style.asidLink)}> Summery</NavLink>
        <NavLink to="Serviced_and_Schedule" className={({isActive})=>(isActive?Style.active:Style.asidLink)}> Serviced and Schedule</NavLink>

      </div>
      <div className={Style.content}>
        <Outlet/>

      </div>
      
    </div>
  )
}

export default Projects