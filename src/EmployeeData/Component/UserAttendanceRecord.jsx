import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import html2pdf from "html2pdf.js";
import { useEffect, useRef, useState } from "react";
import { db } from "../../Firebase/Firebase";
import styles from "./UserAttendanceRecord.module.css";

function UserAttendanceRecord({ employeeName, employeeEmail }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState({
    name: employeeName || "Employee",
    designation: "N/A",
    baseSalary: 0,
    advanceDeduction: 0,
  });

  const [summary, setSummary] = useState({
    totalHours: 0,
    totalOvertime: 0,
    fridayCount: 0,
    presentDays: 0,
    leaveDays: 0,
    absentDays: 0,
    totalPayableDays: 0,
    baseSalary: 0,
    dailyRate: 0,
    grossPayable: 0,
    fridayAllowance: 0,
    advanceDeduction: 0,
    netPayable: 0,
  });

  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  const currentMonth = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const parseTimeToHours = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours + minutes / 60;
  };

  useEffect(() => {
    const fetchAttendanceAndPayroll = async () => {
      setLoading(true);

      try {
        let baseSalary = 0;
        let advanceDeduction = 0;
        let designation = "N/A";
        let fetchedName = employeeName || "";

        if (!employeeEmail) {
          setLoading(false);
          return;
        }

        const cleanEmailKey = employeeEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");

        // 1. Fetch from 'employees' collection using Email Document ID
        const empRef = doc(db, "employees", cleanEmailKey);
        const empSnap = await getDoc(empRef);

        if (empSnap.exists()) {
          const rawData = empSnap.data();
          const empData = rawData.data || rawData;

          baseSalary = Number(empData.baseSalary || 0);
          advanceDeduction = Number(empData.advanceDeduction || 0);
          designation = empData.designation || "N/A";
          fetchedName = empData.name || employeeName;

          setEmployeeDetails({
            name: fetchedName,
            designation,
            baseSalary,
            advanceDeduction,
          });
        }

        // 2. Fetch Attendance Records using Email Key (NOT Name)
        // Primary path: attendance/{cleanEmailKey}/{currentMonth}
        let monthAttRef = collection(db, "attendance", cleanEmailKey, currentMonth);
        let attSnap = await getDocs(monthAttRef);

        // Fallback for backward compatibility (If data is stored using clean name)
        if (attSnap.empty && fetchedName) {
          const cleanNameKey = fetchedName.trim().replace(/[^a-zA-Z0-9]/g, "_");
          monthAttRef = collection(db, "attendance", cleanNameKey, currentMonth);
          attSnap = await getDocs(monthAttRef);
        }

        const records = [];
        let sumHours = 0;
        let sumOT = 0;
        let presentCount = 0;
        let leaveCount = 0;
        let workedFridays = 0;

        attSnap.forEach((docSnap) => {
          const data = docSnap.data();

          // Extra safety check: Email match validation[cite: 2, 3]
          if (
            data.employeeEmail &&
            data.employeeEmail.toLowerCase() !== employeeEmail.toLowerCase()
          ) {
            return;
          }

          const inHrs = parseTimeToHours(data.inTime);
          const outHrs = parseTimeToHours(data.outTime);

          let totalHrs = 0;
          let overtimeHrs = 0;

          const isApproved =
            data.statusIn === "Approved" || data.statusOut === "Approved";

          if (isApproved || data.inTime) {
            presentCount += 1;
          } else if (data.status === "Leave") {
            leaveCount += 1;
          }

          if (inHrs !== null && outHrs !== null && outHrs > inHrs) {
            totalHrs = outHrs - inHrs;
            if (totalHrs > 9) {
              overtimeHrs = totalHrs - 9;
            }
          }

          const dayOfWeek = new Date(data.date).getDay();
          const isFriday = dayOfWeek === 5;
          if (isFriday && (isApproved || data.inTime)) {
            workedFridays += 1;
          }

          sumHours += totalHrs;
          sumOT += overtimeHrs;

          records.push({
            id: docSnap.id,
            date: data.date,
            inTime: data.inTime || "--",
            outTime: data.outTime || "--",
            totalHours: totalHrs.toFixed(2),
            overtimeHours: overtimeHrs.toFixed(2),
            status: data.status || (isApproved ? "Present" : "Pending"),
            isFriday,
          });
        });

        records.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 3. Calculation Logic
        const totalMonthDays = 30;
        const dailyRate = baseSalary > 0 ? baseSalary / totalMonthDays : 0;
        const absentCount = Math.max(0, totalMonthDays - (presentCount + leaveCount));
        const grossPayable = Math.round(dailyRate * Math.min(presentCount + leaveCount, totalMonthDays));
        const fridayAllowance = Math.round(workedFridays * dailyRate);
        const netPayable = Math.max(0, grossPayable + fridayAllowance - advanceDeduction);

        setAttendanceRecords(records);
        setSummary({
          totalHours: sumHours.toFixed(2),
          totalOvertime: sumOT.toFixed(2),
          fridayCount: workedFridays,
          presentDays: presentCount,
          leaveDays: leaveCount,
          absentDays: absentCount,
          totalPayableDays: presentCount + leaveCount + workedFridays,
          baseSalary,
          dailyRate: Math.round(dailyRate),
          grossPayable,
          fridayAllowance,
          advanceDeduction,
          netPayable,
        });
      } catch (err) {
        console.error("Firestore Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceAndPayroll();
  }, [employeeName, employeeEmail, currentMonth]);

  const handleDownloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 8,
      filename: `${employeeDetails.name}_${currentMonth}_Payslip.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) return <p className={styles.loading}>Loading Data...</p>;

  return (
    <div className={styles.attendanceWrapper}>
      <div className={styles.topActions}>
        <button onClick={handleDownloadPDF} className={styles.downloadPdfBtn}>
          Download PDF Statement
        </button>
      </div>

      <div ref={reportRef} className={styles.pdfArea}>
        <div className={styles.companyHeader}>
          <h2>H.R.ENGINEERS</h2>
          <p>Monthly Employee Statement & Salary Payslip</p>
        </div>

        <div className={styles.headerFlex}>
          <div>
            <h3 className={styles.sectionTitle}>Month: {currentMonth}</h3>
            <p className={styles.subTitle}>
              Employee: <strong>{employeeDetails.name}</strong> (
              <span className={styles.designationBadge}>
                {employeeDetails.designation}
              </span>
              )
            </p>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span>Present Days</span>
            <strong>{summary.presentDays} Days</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>Leave Days</span>
            <strong>{summary.leaveDays} Days</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>Absent Days</span>
            <strong className={styles.dangerText}>{summary.absentDays} Days</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>Friday Duty</span>
            <strong>{summary.fridayCount} Days</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>Total Duty</span>
            <strong>{summary.totalHours} hrs</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>Overtime</span>
            <strong>{summary.totalOvertime} hrs</strong>
          </div>
        </div>

        {/* Payroll Breakdown */}
        <div className={styles.salaryGrid}>
          <div className={styles.salaryCard}>
            <span>Base Salary</span>
            <strong>৳ {summary.baseSalary.toLocaleString()}</strong>
          </div>
          <div className={styles.salaryCard}>
            <span>Daily Rate</span>
            <strong>৳ {summary.dailyRate.toLocaleString()}</strong>
          </div>
          <div className={styles.salaryCard}>
            <span>Friday Bonus (+)</span>
            <strong className={styles.successText}>
              +৳ {summary.fridayAllowance.toLocaleString()}
            </strong>
          </div>
          <div className={styles.salaryCard}>
            <span>Advance (-)</span>
            <strong className={styles.dangerText}>
              -৳ {summary.advanceDeduction.toLocaleString()}
            </strong>
          </div>
          <div className={`${styles.salaryCard} ${styles.highlightCard}`}>
            <span>Net Payable Salary</span>
            <strong>৳ {summary.netPayable.toLocaleString()}</strong>
          </div>
        </div>

        {/* Daily Logs Table */}
        <div className={styles.tableResponsive}>
          <table className={styles.attTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Duty Hours</th>
                <th>Overtime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.noData}>
                    No records found for this month.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((item) => (
                  <tr
                    key={item.id}
                    className={item.isFriday ? styles.fridayRow : ""}
                  >
                    <td>{item.date}</td>
                    <td>{item.inTime}</td>
                    <td>{item.outTime}</td>
                    <td>
                      <strong>{item.totalHours} hrs</strong>
                    </td>
                    <td>
                      {parseFloat(item.overtimeHours) > 0 ? (
                        <span className={styles.otBadge}>
                          +{item.overtimeHours} hrs
                        </span>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td>
                      {item.isFriday ? (
                        <span className={styles.fridayBadge}>Friday (Payable)</span>
                      ) : (
                        item.status
                      )}
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
}

export default UserAttendanceRecord;