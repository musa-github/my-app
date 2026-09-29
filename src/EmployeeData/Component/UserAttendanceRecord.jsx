/* eslint-disable react-hooks/set-state-in-effect */
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import html2pdf from "html2pdf.js";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { auth, db } from "../../Firebase/Firebase";
import MonthFilter from "./MonthFilter";
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

  const [showBackdateModal, setShowBackdateModal] = useState(false);
  const [backdateForm, setBackdateForm] = useState({
    date: new Date().toISOString().split("T")[0],
    inTime: "09:00 AM",
    outTime: "06:00 PM",
    status: "Present",
    advanceDeduction: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Redux Selectors
  const reduxUserEmail = useSelector((state) => state.auth?.user?.email);
  const currentMonth = useSelector((state) => state.attendance?.selectedMonthYear) || "September 2026";

  const currentUserEmail = (
    reduxUserEmail ||
    auth.currentUser?.email ||
    ""
  ).toLowerCase().trim();

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

  const normalizedRole = String(userRole || "").toLowerCase().trim();
  const isAdminOrOwner =
    currentUserEmail === OWNER_EMAIL ||
    adminList.includes(currentUserEmail) ||
    normalizedRole === "admin" ||
    normalizedRole === "owner";

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

      const cleanEmailKey = rawEmail.replace(/[^a-zA-Z0-9]/g, "_");

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
      let fridayAbsents = 0;
      let monthlyAdvanceSum = 0;

      if (attSnap && !attSnap.empty) {
        attSnap.forEach((docSnap) => {
          const data = docSnap.data();

          if (data.advanceDeduction) {
            monthlyAdvanceSum += Number(data.advanceDeduction || 0);
          }

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
            data.statusIn === "Approved" || data.statusOut === "Approved";

          const dayOfWeek = new Date(data.date).getDay();
          const isFriday = dayOfWeek === 5;
          const currentStatus = data.status || (isApproved ? "Present" : "Pending");

          if (currentStatus === "Absent") {
            if (isFriday) {
              fridayAbsents += 1;
            }
          } else if (currentStatus === "Leave") {
            leaveCount += 1;
          } else if (isApproved || (data.inTime && data.inTime !== "--") || currentStatus === "Present") {
            presentCount += 1;
            if (isFriday) {
              workedFridays += 1;
            }
          }

          if (inHrs !== null && outHrs !== null && outHrs > inHrs && currentStatus !== "Leave" && currentStatus !== "Absent") {
            totalHrs = outHrs - inHrs;
            if (totalHrs > 9) {
              overtimeHrs = totalHrs - 9;
            }
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
            status: currentStatus,
            advanceDeduction: Number(data.advanceDeduction || 0),
            isFriday,
          });
        });
      }

      records.sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalMonthDays = 30;
      const totalGeneralWorkingDays = 26;
      const dailyRate = baseSalary > 0 ? baseSalary / totalMonthDays : 0;

      const generalWorkedDays = presentCount - workedFridays;
      const generalAbsentDays = Math.max(0, totalGeneralWorkingDays - (generalWorkedDays + leaveCount));
      const absentCount = generalAbsentDays + fridayAbsents;

      const grossPayable = Math.max(0, Math.round(baseSalary - (absentCount * dailyRate)));
      const fridayAllowance = Math.round(workedFridays * dailyRate);

      const finalAdvanceDeduction = monthlyAdvanceSum > 0 ? monthlyAdvanceSum : advanceDeduction;
      const netPayable = Math.max(0, grossPayable + fridayAllowance - finalAdvanceDeduction);

      setAttendanceRecords(records);
      setSummary({
        totalHours: sumHours.toFixed(2),
        totalOvertime: sumOT.toFixed(2),
        fridayCount: workedFridays,
        presentDays: presentCount,
        leaveDays: leaveCount,
        absentDays: absentCount,
        totalPayableDays: generalWorkedDays + leaveCount + workedFridays,
        baseSalary,
        dailyRate: Math.round(dailyRate),
        grossPayable,
        fridayAllowance,
        advanceDeduction: finalAdvanceDeduction,
        netPayable,
      });
    } catch (err) {
      console.error("Firestore Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceAndPayroll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeName, employeeEmail, currentMonth]);

  const handleEditRow = (record) => {
    setBackdateForm({
      date: record.date,
      inTime: record.inTime !== "--" ? record.inTime : "09:00 AM",
      outTime: record.outTime !== "--" ? record.outTime : "06:00 PM",
      status: record.status || "Present",
      advanceDeduction: record.advanceDeduction || 0,
    });
    setShowBackdateModal(true);
  };

  const handleDeleteAttendanceRow = async (docId, date) => {
    if (!isAdminOrOwner) {
      alert("Access Denied: Only Admin or Owner can delete attendance records!");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete attendance record for date: ${date}?`);
    if (!confirmDelete) return;

    try {
      const rawEmail = (employeeEmail || "").trim().toLowerCase();
      const cleanEmailKey = rawEmail.replace(/[^a-zA-Z0-9]/g, "_");

      const dateDocRef = doc(db, "attendance", cleanEmailKey, currentMonth, docId);
      await deleteDoc(dateDocRef);

      alert(`Attendance record for ${date} has been deleted successfully!`);
      fetchAttendanceAndPayroll();
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      alert("Failed to delete record. Please try again.");
    }
  };

  const handleBackdateSubmit = async (e) => {
    e.preventDefault();

    if (!isAdminOrOwner) {
      alert("Access Denied: Only Admin or Owner can update attendance!");
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

      const dateDocId = backdateForm.date;
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
          advanceDeduction: Number(backdateForm.advanceDeduction || 0),
          statusIn: "Approved",
          statusOut: "Approved",
          monthYear: targetMonthYear,
          updatedByAdmin: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      alert(`Attendance saved/updated successfully for ${backdateForm.date}`);
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

  return (
    <div className={styles.attendanceWrapper}>
      <MonthFilter />

      <div className={styles.topActions}>
        {isAdminOrOwner && (
          <button
            onClick={() => {
              setBackdateForm({
                date: new Date().toISOString().split("T")[0],
                inTime: "09:00 AM",
                outTime: "06:00 PM",
                status: "Present",
                advanceDeduction: 0,
              });
              setShowBackdateModal(true);
            }}
            className={styles.addBackdateBtn}
          >
            + Add / Update Backdate
          </button>
        )}

        <button onClick={handleDownloadPDF} className={styles.downloadPdfBtn}>
          Download PDF Statement
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading Data...</p>
      ) : (
        <div ref={reportRef} className={styles.pdfArea}>
          <div className={styles.companyHeader}>
            <h2>OSAN LIFT</h2>
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

          {/* Summary Grid */}
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

          {/* Salary Grid */}
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

          {/* Attendance Table */}
          <div className={styles.tableResponsive}>
            <table className={styles.attTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>In Time</th>
                  <th>Out Time</th>
                  <th>Duty Hours</th>
                  <th>Overtime</th>
                  <th>Advance</th>
                  <th>Status</th>
                  {isAdminOrOwner && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminOrOwner ? "8" : "7"} className={styles.noData}>
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
                        {item.advanceDeduction > 0 ? (
                          <strong className={styles.dangerText}>
                            ৳ {item.advanceDeduction}
                          </strong>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td>
                        {item.isFriday && item.status === "Present" ? (
                          <span className={styles.fridayBadge}>Friday (Payable)</span>
                        ) : (
                          item.status
                        )}
                      </td>
                      {isAdminOrOwner && (
                        <td>
                          <div className={styles.actionGroup}>
                            <button
                              onClick={() => handleEditRow(item)}
                              className={styles.editBtn}
                            >
                              ✏ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAttendanceRow(item.id, item.date)}
                              className={styles.deleteBtn}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Backdate Modal */}
      {showBackdateModal && isAdminOrOwner && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              Add / Edit Attendance & Advance Record
            </h3>

            <form onSubmit={handleBackdateSubmit}>
              <div className={styles.formGroup}>
                <label>Select Date:</label>
                <input
                  type="date"
                  value={backdateForm.date}
                  onChange={(e) =>
                    setBackdateForm({ ...backdateForm, date: e.target.value })
                  }
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>In Time:</label>
                <input
                  type="text"
                  placeholder="09:00 AM"
                  value={backdateForm.inTime}
                  onChange={(e) =>
                    setBackdateForm({ ...backdateForm, inTime: e.target.value })
                  }
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Out Time:</label>
                <input
                  type="text"
                  placeholder="06:00 PM"
                  value={backdateForm.outTime}
                  onChange={(e) =>
                    setBackdateForm({ ...backdateForm, outTime: e.target.value })
                  }
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Advance Deduction (Tk):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={backdateForm.advanceDeduction}
                  onChange={(e) =>
                    setBackdateForm({
                      ...backdateForm,
                      advanceDeduction: e.target.value,
                    })
                  }
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Status:</label>
                <select
                  value={backdateForm.status}
                  onChange={(e) =>
                    setBackdateForm({ ...backdateForm, status: e.target.value })
                  }
                  className={styles.formSelect}
                >
                  <option value="Present">Present</option>
                  <option value="Leave">Leave</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowBackdateModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={styles.saveBtn}
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