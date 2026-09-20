const CtaSection = ({ Style, phoneNumber, onWhatsAppClick, onCallClick }) => {
  return (
    <section className={Style.ctaSection} id="contact">
      <div className={Style.ctaCard}>
        <span className={Style.sectionTag}>GET IN TOUCH</span>
        <h2>
          Need a High-Performance
          <br />
          <strong>Elevator Solution?</strong>
        </h2>
        <p>
          Connect with our engineering experts today for technical guidance, site visits, or tailored price proposals.
        </p>

        <div className={Style.ctaButtons}>
          <button className={Style.primaryBtn} onClick={() => onWhatsAppClick("Price Proposal Request")}>
            Request a Quote
          </button>
          <button className={Style.darkBtn} onClick={onCallClick}>
            📞 Call Direct ({phoneNumber})
          </button>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;