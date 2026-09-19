import { NavLink } from 'react-router';
import styles from '../Serviced_and_Schedule.module.css';

const ProjectTableRow = ({ proj, idx, selectedMonth, monthsList, getLastServicingDateFromProj, handleEdit }) => {
  const targetMonth = selectedMonth === 'All' ? monthsList[new Date().getMonth() + 1] : selectedMonth;
  const bill = (proj.billList || []).find(b => b.month === targetMonth) || {};

  const servicingBill = Number(bill.servicingBill) || 0;
  const sparePartsBill = Number(bill.sparePartsBill) || 0;
  const lastMonthDue = Number(bill.lastMonthDue) || 0;
  const totalBill = servicingBill + sparePartsBill + lastMonthDue;
  const collectedBill = Number(bill.collectedBill) || 0;
  const totalDue = totalBill - collectedBill;

  const servicingDateDisplay = getLastServicingDateFromProj(proj, targetMonth) || '-';
  const currentStatus = bill.servicingStatus || 'Pending';

  return (
    <tr>
      <td className={styles.textCenter}>{idx + 1}</td>
      <td>
        <NavLink className={styles.projectLink} to={`/Projects/project-details/${proj.id}`}>
          {proj.projectName}
        </NavLink>
      </td>
      <td className={styles.textCenter}>{proj.whoseProjects || '-'}</td>
      <td className={styles.textCenter}>{proj.liftQty}</td>
      <td>{proj.address || '-'}</td>
      <td className={styles.textCenter}>{proj.phoneNo || '-'}</td>
      <td className={styles.textCenter}>{servicingDateDisplay}</td>
      <td className={styles.textCenter}>
        <span className={currentStatus.toLowerCase() === 'complete' ? styles.badgeComplete : styles.badgePending}>
          {currentStatus}
        </span>
      </td>
      <td className={styles.textRight}>{servicingBill.toLocaleString()}</td>
      <td className={styles.textRight}>{sparePartsBill.toLocaleString()}</td>
      <td className={styles.textRight}>{lastMonthDue.toLocaleString()}</td>
      <td className={`${styles.textRight} ${styles.bold}`}>{totalBill.toLocaleString()}</td>
      <td className={styles.textRight}>{collectedBill.toLocaleString()}</td>
      <td className={`${styles.textRight} ${styles.bold} ${styles.textDanger}`}>{totalDue.toLocaleString()}</td>
      <td className={styles.textCenter}>{bill.collectedBy || '-'}</td>
      <td className={styles.textCenter}>{bill.approvedBy || '-'}</td>
      <td className={`${styles.textCenter} ${styles.actionButtons}`}>
        <button className={styles.btnEdit} onClick={() => handleEdit(proj)}>Edit Info</button>
      </td>
    </tr>
  );
};

export default ProjectTableRow;