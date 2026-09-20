const TechSection = ({ Style, onWhatsAppClick }) => {
  return (
    <section className={Style.videoSection}>
      <div className={Style.videoContent}>
        <span className={Style.sectionTagLight}>ADVANCED ENGINEERING</span>
        <h2>
          Built on Safety.
          <br />
          <span className={Style.gradientText}>Driven by Technology.</span>
        </h2>

        <p>
          Our control configurations combine intelligence and durability to ensure peak transit performance and maximum energy savings.
        </p>

        <ul className={Style.techList}>
          <li><span className={Style.checkIcon}>✓</span> Microprocessor-driven control cards</li>
          <li><span className={Style.checkIcon}>✓</span> Precision encoder & drive tuning</li>
          <li><span className={Style.checkIcon}>✓</span> Automatic Rescue Device (ARD) safety integration</li>
          <li><span className={Style.checkIcon}>✓</span> Real-time monitoring and diagnostic software</li>
        </ul>

        <button className={Style.primaryBtn} onClick={() => onWhatsAppClick("Technical Inquiry")}>
          Talk to an Expert
        </button>
      </div>

      <div className={Style.videoWrapper}>
        <iframe
          src="https://www.youtube.com/embed/wE8AsupuJAI"
          title="Elevator Technology"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
};

export default TechSection;