import html2pdf from "html2pdf.js";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPayrollData,
  setSelectedMonth,
  updateEmployeeSalaryDetails,
} from "../../Fetures/Inventory/payrollSlice";
import styles from "./Payroll_Salary.module.css";

const OWNER_EMAIL = "osanlift@gmail.com";

const Payroll_Salary = () => {
  const dispatch = useDispatch();
  const printRef = useRef();

  const currentUserEmail = useSelector(
    (state) => state.auth?.user?.email || ""
  ).toLowerCase();

  const { selectedMonth, payrollData, loading } = useSelector(
    (state) => state.payroll
  );

  const isAdmin = currentUserEmail === OWNER_EMAIL;

  const [editingId, setEditingId] = useState(null);
  const [editBaseSalary, setEditBaseSalary] = useState(0);
  const [editAdvance, setEditAdvance] = useState(0);
  const [editDate, setEditDate] = useState(new Date().toISOString().split("T")[0]); // New State for Date
  const [editEmail, setEditEmail] = useState(""); // New State for Email
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    dispatch(fetchPayrollData(selectedMonth));
  }, [dispatch, selectedMonth]);

  const handleEditClick = (emp) => {
    setEditingId(emp.id);
    setEditBaseSalary(emp.baseSalary);
    setEditAdvance(emp.advanceDeduction);
    setEditEmail(emp.email || emp.id); // Employee email dynamic load
    setEditDate(new Date().toISOString().split("T")[0]); // Default today's date
  };

  const handleSaveSalary = (empId) => {
    dispatch(
      updateEmployeeSalaryDetails({
        empId,
        email: editEmail,            // Dynamic email passed
        baseSalary: editBaseSalary,
        advanceDeduction: editAdvance,
        date: editDate,              // Specific date passed for attendance collection
      })
    );
    setEditingId(null);
  };

  // PDF Download Function
  const handleDownloadPDF = async () => {
    const element = printRef.current;
    setIsGeneratingPdf(true);

    element.classList.add("is-pdf-exporting");

    const opt = {
      margin: [5, 2, 5, 2],
      filename: `Salary_Sheet_${selectedMonth.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200 
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      opt.jsPDF.format = "letter";
      await html2pdf().set(opt).from(element).save();
    } finally {
      element.classList.remove("is-pdf-exporting");
      setIsGeneratingPdf(false);
    }
  };

  // মাসভিত্তিক সব কর্মচারীর সর্বমোট টাকার হিসাব
  const totals = payrollData.reduce(
    (acc, emp) => {
      acc.baseSalary += Number(emp.baseSalary || 0);
      acc.fridayAllowance += Number(emp.fridayAllowance || 0);
      acc.grossPayable += Number(emp.grossPayable || 0);
      acc.advanceDeduction += Number(emp.advanceDeduction || 0);
      acc.netPayable += Number(emp.netPayable || 0);
      return acc;
    },
    {
      baseSalary: 0,
      fridayAllowance: 0,
      grossPayable: 0,
      advanceDeduction: 0,
      netPayable: 0,
    }
  );

  return (
    <div className={styles.container}>
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="monthSelect">Select Month: </label>
          <select
            id="monthSelect"
            value={selectedMonth}
            onChange={(e) => dispatch(setSelectedMonth(e.target.value))}
            className={styles.selectInput}
          >
            <option value="January 2026">January 2026</option>
            <option value="February 2026">February 2026</option>
            <option value="March 2026">March 2026</option>
            <option value="April 2026">April 2026</option>
            <option value="May 2026">May 2026</option>
            <option value="June 2026">June 2026</option>
            <option value="July 2026">July 2026</option>
            <option value="August 2026">August 2026</option>
            <option value="September 2026">September 2026</option>
            <option value="October 2026">October 2026</option>
            <option value="November 2026">November 2026</option>
            <option value="December 2026">December 2026</option>
          </select>
        </div>

        <div className={styles.btnGroup}>
          <button
            onClick={handleDownloadPDF}
            className={styles.downloadBtn}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div ref={printRef} className={styles.pdfArea}>
        <div className={styles.header}>
          <h2>OSAN LIFT</h2>
          <h3>Monthly Salary Sheet ({selectedMonth})</h3>
        </div>

        {loading ? (
          <div className={styles.loading}>Calculating Payroll Data...</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.salaryTable}>
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Base Salary</th>
                  <th>Present</th>
                  <th>Leave</th>
                  <th>Friday Duty</th>
                  <th>Friday Allowance (+)</th>
                  <th>Absent</th>
                  <th>Payable Days</th>
                  <th>Gross Salary</th>
                  <th>Advance (-)</th>
                  <th>Net Payable</th>
                  <th className={styles.actionCol}>Action</th>
                  <th className={styles.signatureCol}>Signature</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.length > 0 ? (
                  payrollData.map((emp, index) => (
                    <tr key={emp.id}>
                      <td>{index + 1}</td>
                      <td className={styles.empName}>{emp.name}</td>
                      <td className={styles.designation}>{emp.designation}</td>

                      <td>
                        {editingId === emp.id ? (
                          <input
                            type="number"
                            value={editBaseSalary}
                            onChange={(e) => setEditBaseSalary(e.target.value)}
                            className={styles.inlineInput}
                          />
                        ) : (
                          `৳ ${emp.baseSalary.toLocaleString()}`
                        )}
                      </td>

                      <td>{emp.presentDays}</td>
                      <td>{emp.leaveDays}</td>

                      <td>
                        <strong>{emp.workedFridays} Days</strong>
                      </td>

                      <td style={{ color: "#16a34a", fontWeight: "600" }}>
                        +৳ {emp.fridayAllowance.toLocaleString()}
                      </td>

                      <td className={styles.absentText}>{emp.absentDays}</td>

                      <td>
                        <strong>{emp.totalPayableDays} Days</strong>
                      </td>

                      <td>৳ {emp.grossPayable.toLocaleString()}</td>

                      <td>
                        {editingId === emp.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <input
                              type="number"
                              value={editAdvance}
                              onChange={(e) => setEditAdvance(e.target.value)}
                              className={styles.inlineInput}
                              placeholder="Amount"
                            />
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className={styles.inlineInput}
                              title="Advance Entry Date"
                            />
                          </div>
                        ) : (
                          `৳ ${emp.advanceDeduction.toLocaleString()}`
                        )}
                      </td>

                      <td className={styles.totalSalary}>
                        ৳ {emp.netPayable.toLocaleString()}
                      </td>

                      <td className={styles.actionCol}>
                        {isAdmin &&
                          (editingId === emp.id ? (
                            <button
                              onClick={() => handleSaveSalary(emp.id)}
                              className={styles.saveBtn}
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditClick(emp)}
                              className={styles.editBtn}
                            >
                              Edit
                            </button>
                          ))}
                      </td>

                      <td className={styles.signatureCol}>
                        <div className={styles.signatureBox}></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="15" className={styles.noData}>
                      No payroll data found.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* সর্বমোট হিসাবের TFOOT অংশ */}
              {payrollData.length > 0 && (
                <tfoot className={styles.tableFooter}>
                  <tr style={{ fontWeight: "bold", backgroundColor: "#f8fafc" }}>
                    <td colSpan="3" style={{ textAlign: "right", paddingRight: "10px" }}>
                      <strong>Total:</strong>
                    </td>
                    <td>৳ {totals.baseSalary.toLocaleString()}</td>
                    <td colSpan="3"></td>
                    <td style={{ color: "#16a34a" }}>
                      +৳ {totals.fridayAllowance.toLocaleString()}
                    </td>
                    <td colSpan="2"></td>
                    <td>৳ {totals.grossPayable.toLocaleString()}</td>
                    <td style={{ color: "#dc2626" }}>
                      -৳ {totals.advanceDeduction.toLocaleString()}
                    </td>
                    <td style={{ color: "#2563eb", fontSize: "1.05em" }}>
                      <strong>৳ {totals.netPayable.toLocaleString()}</strong>
                    </td>
                    <td className={styles.actionCol}></td>
                    <td className={styles.signatureCol}></td>
                  </tr>
                </tfoot>
              )}
            </table>

            <div className={styles.printFooter}>
              <div className={styles.signBlock}>
                <div className={styles.line}></div>
                <p style={{color:"black"}}>Prepared By</p>
              </div>
              <div className={styles.signBlock}>
                <div className={styles.line}></div>
                <p style={{color:"black"}}>Checked By</p>
              </div>
              <div className={styles.signBlock}>
                <div className={styles.line}></div>
                <p style={{color:"black"}}>Managing Director / Owner</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payroll_Salary;