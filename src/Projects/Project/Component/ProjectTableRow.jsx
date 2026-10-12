import { NavLink } from 'react-router-dom';
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
      <td style={{ width: '4%' }} className={styles.textCenter}>{idx + 1}</td>
      <td style={{ width: '16%' }}>
        <NavLink className={styles.projectLink} to={`/Projects/project-details/${proj.id}`}>
          {proj.projectName}
        </NavLink>
      </td>
      <td style={{ width: '7%' }} className={styles.textCenter}>{proj.whoseProjects || '-'}</td>
      <td style={{ width: '5%' }} className={styles.textCenter}>{proj.liftQty}</td>
      <td style={{ width: '9%' }} className={styles.textCenter}>{servicingDateDisplay}</td>
      <td style={{ width: '8%' }} className={styles.textCenter}>
        <span className={currentStatus.toLowerCase() === 'complete' ? styles.badgeComplete : styles.badgePending}>
          {currentStatus}
        </span>
      </td>
      <td style={{ width: '7%' }} className={styles.textCenter}>{servicingBill.toLocaleString()}</td>
      <td style={{ width: '7%' }} className={styles.textCenter}>{sparePartsBill.toLocaleString()}</td>
      <td style={{ width: '7%' }} className={styles.textCenter}>{lastMonthDue.toLocaleString()}</td>
      <td style={{ width: '7%' }} className={`${styles.textCenter} ${styles.bold}`}>{totalBill.toLocaleString()}</td>
      <td style={{ width: '7%' }} className={styles.textCenter}>{collectedBill.toLocaleString()}</td>
      <td style={{ width: '7%' }} className={`${styles.textCenter} ${styles.bold} ${styles.textDanger}`}>{totalDue.toLocaleString()}</td>
      <td style={{ width: '6%' }} className={styles.textCenter}>{bill.collectedBy || '-'}</td>
      <td style={{ width: '6%' }} className={styles.textCenter}>{bill.approvedBy || '-'}</td>
      <td style={{ width: '7%' }} className={`${styles.textCenter} ${styles.actionButtons}`} data-pdf-hide="true">
        <button 
          className={styles.btnEdit} 
          onClick={() => handleEdit(proj)}
          style={{ whiteSpace: 'nowrap', padding: '4px 8px', fontSize: '12px' }}
        >
          Edit Info
        </button>
      </td>
    </tr>
  );
};

export default ProjectTableRow;