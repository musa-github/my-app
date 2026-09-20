import { Link } from "react-router";

const HeroSection = ({ Style, onWhatsAppClick }) => {
  return (
    <section className={Style.heroSection}>
      <div className={Style.heroOverlay}></div>

      <div className={Style.heroContent}>
        <span className={Style.heroBadge}>
          <span className={Style.badgeDot}></span>
          ELEVATOR & LIFT SOLUTIONS
        </span>

        <h1 className={Style.heroTitle}>
          Moving People.
          <br />
          <span className={Style.gradientText}>Elevating Possibilities.</span>
        </h1>

        <p className={Style.heroSubtitle}>
          Engineered for safety, reliability, and precision. Delivering modern 
          vertical transportation solutions for high-end residential, commercial, 
          and industrial architecture.
        </p>

        <div className={Style.heroButtons}>
          <button className={Style.primaryBtn} onClick={() => onWhatsAppClick("Free Quote Request")}>
            Get a Free Quote
            <span className={Style.btnArrow}>→</span>
          </button>

          <Link className={Style.secondaryBtn} to="/Services">
            Explore Services
          </Link>
        </div>
      </div>

      <div className={Style.scrollIndicator}>
        <span>Scroll to explore</span>
        <div className={Style.scrollLine}></div>
      </div>
    </section>
  );
};

export default HeroSection;