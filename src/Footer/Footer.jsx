import gmail from "../assets/gmail.png";
import home from "../assets/home.png";
import whatsapp from "../assets/whatsapp.png";
import "./Footer.css";

export const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-container">
        {/* WhatsApp Section */}
        <div className="footer-item">
          <div className="icon-wrapper">
            <img src={whatsapp} alt="WhatsApp" />
          </div>
          <div className="info-text">
            <span className="label">WhatsApp & Call</span>
            <a href="https://wa.me/8801711131536" className="value" target="_blank" rel="noreferrer">
              +880 1711-131536
            </a>
          </div>
        </div>

        {/* Email Section */}
        <div className="footer-item">
          <div className="icon-wrapper">
            <img src={gmail} alt="Email" />
          </div>
          <div className="info-text">
            <span className="label">Official Mail</span>
            <a href="mailto:hrengineersbd@gmail.com" className="value">
              hrengineersbd@gmail.com
            </a>
          </div>
        </div>

        {/* Address Section */}
        <div className="footer-item">
          <div className="icon-wrapper">
            <img src={home} alt="Location" />
          </div>
          <div className="info-text">
            <span className="label">Head Office</span>
            <span className="value address-text">
              202/1, South Borua, Hazibari, Khilkhet, Dhaka-1229
            </span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} All Rights Reserved.</p>
      </div>
    </footer>
  );
};