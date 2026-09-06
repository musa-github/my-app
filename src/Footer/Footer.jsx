import gmail from "../assets/gmail.png";
import home from "../assets/home.png";
import whatsapp from '../assets/whatsapp.png';
import "./Footer.css";
export const Footer = () => {
  return (
    <div className="footer">
     <div>
      <img src={whatsapp} alt="Loading.."></img>
      
      <span>01711131536</span>
      </div>
      <div>
        <img src={gmail} alt="Loading.." />
        <a href="#">hrengineersbd@gmail.com</a>
      </div>
      <div>
        <img src={home} alt="Loading" />
        <span>202/1,South Borua,Hazibari,Khilkhet,Dhaka-1229</span>
      </div>
    </div>
  )
}
