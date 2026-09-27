import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import html2pdf from "html2pdf.js";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { auth, db } from "../../Firebase/Firebase";
import styles from "./UserAttendanceRecord.module.css";

const OWNER_EMAIL = "osanlift@gmail.com";

function UserAttendanceRecord({ employeeName, employeeEmail, userRole }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [adminList, setAdminList] = useState([]);
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

  // --- Backdate Modal State ---
  const [showBackdateModal, setShowBackdateModal] = useState(false);
  const [backdateForm, setBackdateForm] = useState({
    date: new Date().toISOString().split("T")[0],
    inTime: "09:00 AM",
    outTime: "06:00 PM",
    status: "Present",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Get Current Logged-in User Email
  const reduxUserEmail = useSelector((state) => state.auth?.user?.email);
  const currentUserEmail = (
    reduxUserEmail ||
    auth.currentUser?.email ||
    ""
  ).toLowerCase().trim();

  // Fetch Admin List from Firebase
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const adminSnap = await getDocs(collection(db, "app_admins"));
        const admins = [OWNER_EMAIL];
        adminSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.email) {
            admins.push(data.email.toLowerCase().trim());
          }
        });
        setAdminList(admins);
      } catch (err) {
        console.error("Error fetching admin list:", err);
      }
    };
    fetchAdmins();
  }, []);

  // Strict Check: Current User Must Be Owner or Listed Admin
  const normalizedRole = String(userRole || "").toLowerCase().trim();
  const isAdminOrOwner =
    currentUserEmail === OWNER_EMAIL ||
    adminList.includes(currentUserEmail) ||
    normalizedRole === "admin" ||
    normalizedRole === "owner";

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

  const fetchAttendanceAndPayroll = async () => {
    setLoading(true);

    try {
      let baseSalary = 0;
      let advanceDeduction = 0;
      let designation = "N/A";
      let fetchedName = (employeeName || "").trim();
      const rawEmail = (employeeEmail || "").trim().toLowerCase();

      if (!rawEmail && !fetchedName) {
        setLoading(false);
        return;
      }

      const cleanEmailKey = rawEmail.replace(/[^a-zA-Z0-9]/g, "_");

      // 1. Fetch Employee Details
      if (cleanEmailKey) {
        const empRef = doc(db, "employees", cleanEmailKey);
        const empSnap = await getDoc(empRef);

        if (empSnap.exists()) {
          const rawData = empSnap.data();
          const empData = rawData.data || rawData;

          baseSalary = Number(empData.baseSalary || 0);
          advanceDeduction = Number(empData.advanceDeduction || 0);
          designation = empData.designation || "N/A";
          fetchedName = (empData.name || employeeName || "").trim();

          setEmployeeDetails({
            name: fetchedName,
            designation,
            baseSalary,
            advanceDeduction,
          });
        }
      }

      // 2. Fetch Attendance Records
      let attSnap = null;

      if (cleanEmailKey) {
        const emailAttRef = collection(db, "attendance", cleanEmailKey, currentMonth);
        const snap = await getDocs(emailAttRef);
        if (!snap.empty) attSnap = snap;
      }

      if ((!attSnap || attSnap.empty) && fetchedName) {
        const cleanNameKey = fetchedName.replace(/[^a-zA-Z0-9]/g, "_");
        const nameAttRef = collection(db, "attendance", cleanNameKey, currentMonth);
        const snap = await getDocs(nameAttRef);
        if (!snap.empty) attSnap = snap;
      }

      const records = [];
      let sumHours = 0;
      let sumOT = 0;
      let presentCount = 0;
      let leaveCount = 0;
      let workedFridays = 0;

      if (attSnap && !attSnap.empty) {
        attSnap.forEach((docSnap) => {
          const data = docSnap.data();

          const docEmail = (data.employeeEmail || "").trim().toLowerCase();
          const docName = (data.employeeName || "").trim().toLowerCase();

          const isEmailMatch = rawEmail && docEmail && docEmail === rawEmail;
          const isNameMatch = fetchedName && docName && docName === fetchedName.toLowerCase();

          if (rawEmail && docEmail && !isEmailMatch && !isNameMatch) {
            return;
          }

          const inHrs = parseTimeToHours(data.inTime);
          const outHrs = parseTimeToHours(data.outTime);

          let totalHrs = 0;
          let overtimeHrs = 0;

          const isApproved =
            data.statusIn === "Approved" ||
            data.statusOut === "Approved" ||
            data.status === "Present";

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
      }

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAttendanceAndPayroll();
  }, [employeeName, employeeEmail, currentMonth]);

  // --- Handle Backdate Attendance Submit ---
  const handleBackdateSubmit = async (e) => {
    e.preventDefault();

    if (!isAdminOrOwner) {
      alert("Access Denied: Only Admin or Owner can update backdate attendance!");
      return;
    }

    if (!employeeEmail) {
      alert("Employee email is missing.");
      return;
    }

    setIsUpdating(true);
    try {
      const cleanEmailKey = employeeEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
      
      const targetDate = new Date(backdateForm.date);
      const targetMonthYear = targetDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });

      const dateDocId = backdateForm.date; // Format: YYYY-MM-DD
      const attDocRef = doc(db, "attendance", cleanEmailKey, targetMonthYear, dateDocId);

      await setDoc(
        attDocRef,
        {
          date: backdateForm.date,
          employeeEmail: employeeEmail.trim().toLowerCase(),
          employeeName: employeeDetails.name || employeeName,
          inTime: backdateForm.inTime,
          outTime: backdateForm.outTime,
          status: backdateForm.status,
          statusIn: "Approved",
          statusOut: "Approved",
          monthYear: targetMonthYear,
          updatedByAdmin: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      alert(`Attendance updated successfully for ${backdateForm.date}`);
      setShowBackdateModal(false);
      fetchAttendanceAndPayroll();
    } catch (error) {
      console.error("Error updating backdate attendance:", error);
      alert("Failed to update attendance. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

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
      <div className={styles.topActions} style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        {/* Strictly Only Admin or Owner Can See This Button */}
        {isAdminOrOwner && (
          <button
            onClick={() => setShowBackdateModal(true)}
            className={styles.downloadPdfBtn}
            style={{ backgroundColor: "#28a745" }}
          >
            + Add / Update Backdate
          </button>
        )}

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

      {/* --- BACKDATE MODAL FORM (ADMIN/OWNER ONLY) --- */}
      {showBackdateModal && isAdminOrOwner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
              Update Backdate Attendance
            </h3>

            <form onSubmit={handleBackdateSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Select Date:</label>
                <input
                  type="date"
                  value={backdateForm.date}
                  onChange={(e) =>
                    setBackdateForm({ ...backdateForm, date: e.target.value })
                  }
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>In Time:</label>
                <input
                  type="text"
                  placeholder="09:00 AM"
                  value={backdateForm.inTime}
                  onChange={(e) =>
                    setBackdateForm({ ...backdateForm, inTime: e.target.value })
                  }
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Out Time:</label>
                <input
                  type="text"
                  placeholder="06:00 PM"
                  value={backdateForm.outTime}
                  onChange={(e) =>
                    setBackdateForm({ ...backdateForm, outTime: e.target.value })
                  }
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Status:</label>
                <select
                  value={backdateForm.status}
                  onChange={(e) =>
                    setBackdateForm({ ...backdateForm, status: e.target.value })
                  }
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                  <option value="Present">Present</option>
                  <option value="Leave">Leave</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowBackdateModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {isUpdating ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserAttendanceRecord;