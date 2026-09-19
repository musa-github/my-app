import styles from '../Serviced_and_Schedule.module.css';

const SummaryCards = ({ targetMonthForSummary, statusSummary, collectorDetailedSummary, approverDetailedSummary }) => {
  return (
    <div className={styles.summaryCardsContainer}>
      {/* Project Overview Card */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.statusIcon}>🏢</div>
          <div>
            <h3>Project Overview</h3>
            <p className={styles.cardSubtitle}>{targetMonthForSummary} মাসের সার্ভিসিং স্ট্যাটাস</p>
          </div>
        </div>

        <div className={styles.statusGrid}>
          <div className={styles.statusBoxTotal}>
            <span className={styles.statusLabel}>Database Total Projects</span>
            <span className={styles.statusValue}>{statusSummary.total}</span>
          </div>
          <div className={styles.statusBoxCompleted}>
            <span className={styles.statusLabel}>Completed ({targetMonthForSummary})</span>
            <span className={styles.statusValue}>{statusSummary.completed}</span>
          </div>
          <div className={styles.statusBoxPending}>
            <span className={styles.statusLabel}>Pending / Incomplete ({targetMonthForSummary})</span>
            <span className={styles.statusValue}>{statusSummary.incomplete}</span>
          </div>
        </div>
      </div>

      {/* Collector Summary Card */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.collectorIcon}>📊</div>
          <div>
            <h3>Collector Summary</h3>
            <p className={styles.cardSubtitle}>সংগ্রহ ও অনুমোদনের হিসাব</p>
          </div>
        </div>

        <div className={styles.collectorTableWrapper}>
          <table className={styles.summaryTable}>
            <thead>
              <tr>
                <th>Collector Name</th>
                <th className={styles.textCenter}>Collected</th>
                <th className={styles.textCenter}>Approved</th>
                <th className={styles.textCenter}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(collectorDetailedSummary).length === 0 ? (
                <tr><td colSpan="4" className={styles.emptyText}>No data available</td></tr>
              ) : (
                Object.entries(collectorDetailedSummary).map(([collector, data]) => {
                  const difference = data.collected - data.approved;
                  return (
                    <tr key={collector}>
                      <td>
                        <span className={styles.collectorBadge}>{collector}</span>
                      </td>
                      <td className={`${styles.textCenter} ${styles.fontMedium}`}>{data.collected.toLocaleString()} Tk</td>
                      <td className={`${styles.textCenter} ${styles.fontMedium} ${styles.textSuccess}`}>{data.approved.toLocaleString()} Tk</td>
                      <td className={styles.textCenter}>
                        <span className={difference > 0 ? styles.pillDanger : styles.pillSuccess}>
                          {Math.abs(difference).toLocaleString()} Tk
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approver Summary Card */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.approverIcon}>✅</div>
          <div>
            <h3>Approver Summary</h3>
            <p className={styles.cardSubtitle}>অনুমোদিত মোট টাকার পরিমাণ</p>
          </div>
        </div>

        <div className={styles.collectorTableWrapper}>
          <table className={styles.summaryTable}>
            <thead>
              <tr>
                <th>Approver Name</th>
                <th className={styles.textCenter}>Total Approved Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(approverDetailedSummary).length === 0 ? (
                <tr><td colSpan="2" className={styles.emptyText}>No approved collections found</td></tr>
              ) : (
                Object.entries(approverDetailedSummary).map(([approver, amount]) => (
                  <tr key={approver}>
                    <td>
                      <span className={styles.approverBadge}>{approver}</span>
                    </td>
                    <td className={styles.textCenter}>
                      <span className={styles.amountHighlight}>{amount.toLocaleString()} Tk</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;