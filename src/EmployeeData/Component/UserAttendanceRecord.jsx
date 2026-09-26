import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import html2pdf from "html2pdf.js";
import { useEffect, useRef, useState } from "react";
import { db } from "../../Firebase/Firebase";
import styles from "./UserAttendanceRecord.module.css";

function UserAttendanceRecord({ employeeName, employeeEmail, isAdmin = true }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [activeKey, setActiveKey] = useState("");
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

  // Admin Modals State
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    designation: "",
    baseSalary: 0,
    advanceDeduction: 0,
  });

  const [editAttendanceModal, setEditAttendanceModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  // Helper Function: Decimal Hours-কে Hours & Minutes ফরম্যাটে রূপান্তর
  const formatHoursToHM = (decimalHours) => {
    const total = parseFloat(decimalHours);
    if (isNaN(total) || total <= 0) return "0h 0m";
    const h = Math.floor(total);
    const m = Math.round((total - h) * 60);
    return `${h}h ${m}m`;
  };

  const parseTimeToHours = (timeStr) => {
    if (!timeStr || timeStr === "--") return null;
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

      const cleanEmailKey = rawEmail ? rawEmail.replace(/[^a-zA-Z0-9]/g, "_") : "";

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

          setProfileFormData({
            designation,
            baseSalary,
            advanceDeduction,
          });
        }
      }

      const searchKeys = [];
      if (cleanEmailKey) searchKeys.push(cleanEmailKey);
      if (fetchedName) {
        searchKeys.push(fetchedName.replace(/\s+/g, "_") + "_");
        searchKeys.push(fetchedName.replace(/\s+/g, "_"));
        searchKeys.push(fetchedName.replace(/[^a-zA-Z0-9]/g, "_"));
      }

      let attSnap = null;
      let foundKey = "";

      for (const key of searchKeys) {
        if (!key) continue;
        const attRef = collection(db, "attendance", key, currentMonth);
        const snap = await getDocs(attRef);
        if (!snap.empty) {
          attSnap = snap;
          foundKey = key;
          break;
        }
      }

      setActiveKey(foundKey || searchKeys[0] || "");

      const records = [];
      let sumHours = 0;
      let sumOT = 0;
      let presentCount = 0;
      let leaveCount = 0;
      let workedFridays = 0;

      if (attSnap && !attSnap.empty) {
        attSnap.forEach((docSnap) => {
          const data = docSnap.data();

          const inHrs = parseTimeToHours(data.inTime);
          const outHrs = parseTimeToHours(data.outTime);

          let totalHrs = 0;
          let overtimeHrs = 0;

          const isApproved =
            data.statusIn === "Approved" || data.statusOut === "Approved";

          if (isApproved || (data.inTime && data.inTime !== "--")) {
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
          if (isFriday && (isApproved || (data.inTime && data.inTime !== "--"))) {
            workedFridays += 1;
          }

          sumHours += totalHrs;
          sumOT += overtimeHrs;

          records.push({
            id: docSnap.id,
            date: data.date,
            inTime: data.inTime || "--",
            outTime: data.outTime || "--",
            totalHours: totalHrs,
            overtimeHours: overtimeHrs,
            status: data.status || (isApproved ? "Present" : "Pending"),
            statusIn: data.statusIn || "Pending",
            statusOut: data.statusOut || "Pending",
            isFriday,
          });
        });
      }

      records.sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalMonthDays = 30;
      const dailyRate = baseSalary > 0 ? baseSalary / totalMonthDays : 0;
      const absentCount = Math.max(0, totalMonthDays - (presentCount + leaveCount));
      const grossPayable = Math.round(dailyRate * Math.min(presentCount + leaveCount, totalMonthDays));
      const fridayAllowance = Math.round(workedFridays * dailyRate);
      const netPayable = Math.max(0, grossPayable + fridayAllowance - advanceDeduction);

      setAttendanceRecords(records);
      setSummary({
        totalHours: sumHours,
        totalOvertime: sumOT,
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const rawEmail = (employeeEmail || "").trim().toLowerCase();
    const cleanEmailKey = rawEmail.replace(/[^a-zA-Z0-9]/g, "_");

    if (!cleanEmailKey) return alert("Employee email missing!");

    try {
      const empRef = doc(db, "employees", cleanEmailKey);
      await updateDoc(empRef, {
        designation: profileFormData.designation,
        baseSalary: Number(profileFormData.baseSalary),
        advanceDeduction: Number(profileFormData.advanceDeduction),
      });

      alert("Employee details updated successfully!");
      setEditProfileModal(false);
      fetchAttendanceAndPayroll();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile details.");
    }
  };

  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    if (!activeKey || !selectedRecord) return alert("Attendance path missing!");

    try {
      const attDocRef = doc(
        db,
        "attendance",
        activeKey,
        currentMonth,
        selectedRecord.id
      );

      await updateDoc(attDocRef, {
        inTime: selectedRecord.inTime,
        outTime: selectedRecord.outTime,
        status: selectedRecord.status,
        statusIn: selectedRecord.statusIn,
        statusOut: selectedRecord.statusOut,
      });

      alert("Attendance record updated successfully!");
      setEditAttendanceModal(false);
      fetchAttendanceAndPayroll();
    } catch (err) {
      console.error("Error updating attendance:", err);
      alert("Failed to update attendance record.");
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
      <div className={styles.topActions}>
        <button onClick={handleDownloadPDF} className={styles.downloadPdfBtn}>
          Download PDF Statement
        </button>
        {isAdmin && (
          <button
            onClick={() => setEditProfileModal(true)}
            className={styles.editProfileBtn}
          >
            ⚙️ Edit Employee Salary/Profile
          </button>
        )}
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
            <strong>{formatHoursToHM(summary.totalHours)}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>Overtime</span>
            <strong>{formatHoursToHM(summary.totalOvertime)}</strong>
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
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? "7" : "6"} className={styles.noData}>
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
                      <strong>{formatHoursToHM(item.totalHours)}</strong>
                    </td>
                    <td>
                      {item.overtimeHours > 0 ? (
                        <span className={styles.otBadge}>
                          +{formatHoursToHM(item.overtimeHours)}
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
                    {isAdmin && (
                      <td>
                        <button
                          className={styles.actionEditBtn}
                          onClick={() => {
                            setSelectedRecord(item);
                            setEditAttendanceModal(true);
                          }}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADMIN MODALS --- */}
      {editProfileModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h3>Edit Employee Profile</h3>
            <form onSubmit={handleUpdateProfile}>
              <label>Designation:</label>
              <input
                type="text"
                value={profileFormData.designation}
                onChange={(e) =>
                  setProfileFormData({ ...profileFormData, designation: e.target.value })
                }
              />

              <label>Base Salary (৳):</label>
              <input
                type="number"
                value={profileFormData.baseSalary}
                onChange={(e) =>
                  setProfileFormData({ ...profileFormData, baseSalary: e.target.value })
                }
              />

              <label>Advance Deduction (৳):</label>
              <input
                type="number"
                value={profileFormData.advanceDeduction}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    advanceDeduction: e.target.value,
                  })
                }
              />

              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditProfileModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editAttendanceModal && selectedRecord && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h3>Edit Attendance ({selectedRecord.date})</h3>
            <form onSubmit={handleUpdateAttendance}>
              <label>In Time:</label>
              <input
                type="text"
                value={selectedRecord.inTime}
                onChange={(e) =>
                  setSelectedRecord({ ...selectedRecord, inTime: e.target.value })
                }
                placeholder="e.g. 09:00 AM"
              />

              <label>Out Time:</label>
              <input
                type="text"
                value={selectedRecord.outTime}
                onChange={(e) =>
                  setSelectedRecord({ ...selectedRecord, outTime: e.target.value })
                }
                placeholder="e.g. 06:00 PM"
              />

              <label>Status:</label>
              <select
                value={selectedRecord.status}
                onChange={(e) =>
                  setSelectedRecord({ ...selectedRecord, status: e.target.value })
                }
              >
                <option value="Present">Present</option>
                <option value="Leave">Leave</option>
                <option value="Absent">Absent</option>
                <option value="Pending">Pending</option>
              </select>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveBtn}>
                  Update Record
                </button>
                <button
                  type="button"
                  onClick={() => setEditAttendanceModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
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