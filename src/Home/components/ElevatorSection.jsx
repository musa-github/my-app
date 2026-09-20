const ElevatorSection = ({ Style, portfolioData, onSelectPortfolio }) => {
  return (
    <section className={Style.elevatorSection}>
      <div className={Style.sectionHeadingCenter}>
        <span className={Style.sectionTag}>OUR PORTFOLIO</span>
        <h2>
          Tailored <span>Elevator Systems</span>
        </h2>
      </div>

      <div className={Style.elevatorGrid}>
        {portfolioData.map((item) => (
          <div key={item.id} className={Style.elevatorCard}>
            <div className={Style.elevatorImage}>
              <span className={Style.imageTag}>{item.tag}</span>
            </div>
            <div className={Style.elevatorInfo}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button 
                className={Style.cardLinkBtn} 
                onClick={() => onSelectPortfolio(item)}
              >
                View Details <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ElevatorSection;