import styles from '../Serviced_and_Schedule.module.css';
import ProjectTableRow from './ProjectTableRow';

const MainProjectTable = ({
  filteredProjects,
  selectedMonth,
  monthsList,
  getLastServicingDateFromProj,
  handleEdit,
  totals
}) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.projectTable}>
        <thead>
          <tr>
            <th className={styles.textCenter}>Sl</th>
            <th>Project Name</th>
            <th className={styles.textCenter}>Whose</th>
            <th className={styles.textCenter}>Lift Qty</th>
            <th>Address</th>
            <th className={styles.textCenter}>Phone No</th>
            <th className={styles.textCenter}>Last Servicing Date</th>
            <th className={styles.textCenter}>Servicing Status</th>
            <th className={styles.textRight}>Servicing Bill</th>
            <th className={styles.textRight}>Spare Parts</th>
            <th className={styles.textRight}>Last Due</th>
            <th className={styles.textRight}>Total Bill</th>
            <th className={styles.textRight}>Collected</th>
            <th className={styles.textRight}>Customer Due</th>
            <th className={styles.textCenter}>Collected By</th>
            <th className={styles.textCenter}>Approved By</th>
            <th className={styles.textCenter}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.length === 0 ? (
            <tr><td colSpan="17" className={styles.textCenter}>No projects found.</td></tr>
          ) : (
            filteredProjects.map((proj, idx) => (
              <ProjectTableRow
                key={proj.id || idx}
                proj={proj}
                idx={idx}
                selectedMonth={selectedMonth}
                monthsList={monthsList}
                getLastServicingDateFromProj={getLastServicingDateFromProj}
                handleEdit={handleEdit}
              />
            ))
          )}
        </tbody>

        {filteredProjects.length > 0 && (
          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan="8" className={styles.textRight}>Total:</td>
              <td className={styles.textRight}>{totals.servicingBill.toLocaleString()}</td>
              <td className={styles.textRight}>{totals.sparePartsBill.toLocaleString()}</td>
              <td className={styles.textRight}>{totals.lastMonthDue.toLocaleString()}</td>
              <td className={styles.textRight}>{totals.totalBill.toLocaleString()}</td>
              <td className={styles.textRight}>{totals.collectedBill.toLocaleString()}</td>
              <td className={`${styles.textRight} ${styles.textDanger}`}>{totals.totalDue.toLocaleString()}</td>
              <td colSpan="3"></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default MainProjectTable;