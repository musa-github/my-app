const CtaSection = ({ Style, phoneNumber, onWhatsAppClick, onCallClick }) => (
  <section className={Style.ctaSection} id="contact">
    <div className={Style.ctaCard}>
      <span className={Style.sectionTag}>START A PROJECT</span>
      <h2>Need an elevator <strong>solution?</strong></h2>
      <p>Tell us about your building, lift problem or modernization requirement. Our team can discuss the next technical step with you.</p>
      <div className={Style.ctaButtons}>
        <button className={Style.primaryBtn} onClick={() => onWhatsAppClick("Price Proposal Request")}>Request a Quote <span>→</span></button>
        <button className={Style.darkBtn} onClick={onCallClick}>📞 {phoneNumber}</button>
      </div>
    </div>
  </section>
);
export default CtaSection;
