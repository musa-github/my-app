const TechSection = ({ Style, onWhatsAppClick }) => (
  <section className={Style.videoSection} id="technology">
    <div className={Style.videoContent}>
      <span className={Style.sectionTagLight}>TECHNICAL CAPABILITY</span>
      <h2>Built around <span className={Style.gradientText}>safe, precise control.</span></h2>
      <p>From controller configuration to drive and encoder commissioning, our technical work is focused on stable operation, accurate leveling and practical troubleshooting.</p>
      <ul className={Style.techList}>
        <li><span className={Style.checkIcon}>✓</span> Nice & Arkel control-system support</li>
        <li><span className={Style.checkIcon}>✓</span> Drive, encoder & commissioning support</li>
        <li><span className={Style.checkIcon}>✓</span> ARD and emergency-system integration</li>
        <li><span className={Style.checkIcon}>✓</span> Fault diagnosis & parameter configuration</li>
      </ul>
      <button className={Style.primaryBtn} onClick={() => onWhatsAppClick("Technical Inquiry")}>Talk to a Technician <span>→</span></button>
    </div>
    <div className={Style.videoWrapper}>
      <iframe src="https://www.youtube.com/embed/IbC42JSJdHw" title="OSAN LIFT technical video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
    </div>
  </section>
);
export default TechSection;
