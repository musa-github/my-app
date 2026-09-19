import styles from '../Serviced_and_Schedule.module.css';

const HeaderBar = ({
  selectedMonth,
  setSelectedMonth,
  selectedWhoseProject,
  setSelectedWhoseProject,
  dueFilter,
  setDueFilter,
  monthsList,
  availableWhoseProjects,
  handleSaveToFirebase,
  loading,
  dispatch
}) => {
  return (
    <div className={styles.headerBar}>
      <h2>Serviced & Schedule</h2>

      <div className={styles.actionGroup}>
        <div className={styles.filterBox}>
          <label>Filter Month: </label>
          <select value={selectedMonth} onChange={(e) => dispatch(setSelectedMonth(e.target.value))}>
            {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className={styles.filterBox}>
          <label>Whose Project: </label>
          <select value={selectedWhoseProject} onChange={(e) => dispatch(setSelectedWhoseProject(e.target.value))}>
            {availableWhoseProjects.map(wp => <option key={wp} value={wp}>{wp}</option>)}
          </select>
        </div>

        <div className={styles.filterBox}>
          <label>Due Status: </label>
          <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
            <option value="All">All Projects</option>
            <option value="WithDue">With Due Only</option>
            <option value="NoDue">Paid / No Due</option>
          </select>
        </div>

        <button className={styles.btnSave} onClick={handleSaveToFirebase} disabled={loading}>
          {loading ? 'Saving...' : '💾 Save'}
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;