import { Link } from "react-router";

const HeroSection = ({ Style, onWhatsAppClick }) => (
  <section className={Style.heroSection}>
    <div className={Style.heroOverlay} />
    <div className={Style.heroGlow} />

    <div className={Style.heroContent}>
      <span className={Style.heroBadge}><span className={Style.badgeDot} /> PROFESSIONAL ELEVATOR SOLUTIONS</span>
      <p className={Style.heroKicker}>OSAN LIFT</p>
      <h1 className={Style.heroTitle}>
        Reliable Lifts.<br />
        <span className={Style.gradientText}>Better Vertical Mobility.</span>
      </h1>
      <p className={Style.heroSubtitle}>
        Elevator installation, maintenance, modernization and control-system solutions for residential, commercial and industrial buildings.
      </p>
      <div className={Style.heroButtons}>
        <button className={Style.primaryBtn} onClick={() => onWhatsAppClick("Free Consultation")}>
          Get a Free Consultation <span>→</span>
        </button>
        <Link className={Style.secondaryBtn} to="/Services">Explore Services</Link>
      </div>
      <div className={Style.heroTrustRow}>
        <span>✓ Safety-focused service</span>
        <span>✓ Technical support</span>
        <span>✓ Nice & Arkel solutions</span>
      </div>
    </div>

    <div className={Style.scrollIndicator}><span>Scroll to explore</span><div className={Style.scrollLine} /></div>
  </section>
);

export default HeroSection;
