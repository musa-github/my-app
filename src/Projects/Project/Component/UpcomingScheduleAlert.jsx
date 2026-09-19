import { NavLink } from 'react-router';
import styles from '../Serviced_and_Schedule.module.css';

const UpcomingScheduleAlert = ({ upcomingSchedules, handleEdit, hasEditPermission = true }) => {
  return (
    <div className={styles.alertCard}>
      <h4 className={styles.alertTitle}>
        🔔 Upcoming Servicing Schedule (আগামী 5 দিনের সার্ভিসিং তালিকা)
      </h4>
      <div className={styles.tableWrapper}>
        <table className={styles.projectTable}>
          <thead>
            <tr>
              <th className={styles.textCenter}>Sl</th>
              <th>Project Name</th>
              <th className={styles.textCenter}>Lift Qty</th>
              <th className={styles.textCenter}>Phone No</th>
              <th className={styles.textCenter}>Last Servicing Date</th>
              <th className={styles.textCenter}>Next Servicing Date</th>
              <th className={styles.textCenter}>Status / Remaining</th>
              <th className={styles.textCenter}>Action</th>
            </tr>
          </thead>
          <tbody>
            {upcomingSchedules.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.textCenter} style={{ color: '#64748b' }}>
                  আগামী 5 দিনের মধ্যে কোনো সার্ভিসিং শিডিউল নেই।
                </td>
              </tr>
            ) : (
              upcomingSchedules.map((item, index) => (
                <tr key={item.id || index}>
                  <td className={styles.textCenter}>{index + 1}</td>
                  <td> 
                    <NavLink className={styles.projectLink} to={`/Projects/project-details/${item.id}`}>
                      {item.projectName}  
                    </NavLink> 
                  </td>
                  <td className={styles.textCenter}>{item.liftQty || 1}</td>
                  <td className={styles.textCenter}>{item.phoneNo || '-'}</td>
                  <td className={styles.textCenter}>{item.lastServiceDayDate}</td>
                  <td className={styles.textCenter}><strong>{item.nextServicingDate}</strong></td>
                  <td className={styles.textCenter}>
                    {item.daysRemaining === 0 ? (
                      <span className={styles.textToday}>আজকেই সার্ভিসের দিন!</span>
                    ) : item.daysRemaining > 0 ? (
                      <span className={styles.textRemaining}>{item.daysRemaining} দিন বাকি</span>
                    ) : (
                      <span className={styles.textOverdue}>{Math.abs(item.daysRemaining)} দিন পার হয়ে গেছে</span>
                    )}
                  </td>
                  <td className={styles.textCenter}>
                    {/* Access Control Check for Edit Permission */}
                    {hasEditPermission ? (
                      <button className={styles.btnEdit} onClick={() => handleEdit(item)}>
                        Update
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                        Read Only
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingScheduleAlert;