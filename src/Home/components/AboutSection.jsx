import Carousel from "../Carousel";

const AboutSection = ({ Style, onWhatsAppClick }) => {
  return (
    <section className={Style.aboutSection}>
      <div className={Style.sectionHeading}>
        <span className={Style.sectionTag}>WHO WE ARE</span>
        <h2>
          Engineering the Future of
          <br />
          <span className={Style.accentText}>Vertical Transportation</span>
        </h2>
      </div>

      <div className={Style.aboutGrid}>
        <div className={Style.aboutText}>
          <p className={Style.introText}>
            We provide end-to-end elevator engineering—from modern installations 
            and control modernization to preventive maintenance and rapid emergency care.
          </p>

          <p>
            Our engineering standards leverage cutting-edge control architectures, 
            precision drives, and redundant safety systems to guarantee smooth, 
            quiet, and uninterrupted vertical movement.
          </p>

          <button className={Style.outlineBtn} onClick={() => onWhatsAppClick("Company Consultation")}>
            Discover More
            <span>→</span>
          </button>
        </div>

        <div className={Style.aboutMedia}>
          <div className={Style.mediaFrame}>
            <Carousel />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;