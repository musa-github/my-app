const StatsSection = ({ Style }) => {
  return (
    <section className={Style.statsSection}>
      <div className={Style.statItem}>
        <strong className={Style.statNumber}>100+</strong>
        <span className={Style.statLabel}>Projects Completed</span>
      </div>

      <div className={Style.statItem}>
        <strong className={Style.statNumber}>10+</strong>
        <span className={Style.statLabel}>Years Experience</span>
      </div>

      <div className={Style.statItem}>
        <strong className={Style.statNumber}>24/7</strong>
        <span className={Style.statLabel}>Technical Support</span>
      </div>

      <div className={Style.statItem}>
        <strong className={Style.statNumber}>100%</strong>
        <span className={Style.statLabel}>Safety Record</span>
      </div>
    </section>
  );
};

export default StatsSection;