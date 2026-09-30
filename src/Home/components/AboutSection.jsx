import Carousel from "../Carousel";

const AboutSection = ({ Style, onWhatsAppClick }) => (
  <section className={Style.aboutSection} id="about">
    <div className={Style.aboutGrid}>
      <div>
        <span className={Style.sectionTag}>WHO WE ARE</span>
        <h2 className={Style.sectionTitle}>Engineering dependable <span>vertical transportation.</span></h2>
        <div className={Style.aboutText}>
          <p className={Style.introText}>OSAN LIFT focuses on practical elevator solutions—from installation and maintenance to modernization and control-system support.</p>
          <p>Our approach combines field experience, careful commissioning and responsive technical service. We work around the building, lift equipment and control requirements instead of forcing a one-size-fits-all solution.</p>
        </div>
        <button className={Style.outlineBtn} onClick={() => onWhatsAppClick("Company Consultation")}>Talk to OSAN LIFT <span>→</span></button>
      </div>
      <div className={Style.aboutMedia}>
        <div className={Style.mediaFrame}><Carousel /></div>
      </div>
    </div>
  </section>
);
export default AboutSection;
