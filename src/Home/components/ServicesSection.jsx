const ServicesSection = ({ Style, servicesData, onSelectService }) => {
  return (
    <section className={Style.servicesSection}>
      <div className={Style.sectionHeadingCenter}>
        <span className={Style.sectionTag}>WHAT WE DO</span>
        <h2>
          Engineering <span>Solutions</span>
        </h2>
        <p>Comprehensive lifecycle support for vertical transit infrastructure.</p>
      </div>

      <div className={Style.servicesGrid}>
        {servicesData.map((service) => (
          <div key={service.id} className={Style.serviceCard}>
            <div className={Style.serviceNumber}>{service.number}</div>
            <div className={Style.serviceIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l5 5 5-5M7 7l5-5 5 5"/>
              </svg>
            </div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <button 
              className={Style.cardLinkBtn} 
              onClick={() => onSelectService(service)}
            >
              Learn More <span>→</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesSection;