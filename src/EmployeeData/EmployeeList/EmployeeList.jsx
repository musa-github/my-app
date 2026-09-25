import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../Firebase/Firebase";
import UserAttendanceRecord from "../Component/UserAttendanceRecord";
import styles from "./EmployeeList.module.css";

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "employees"));

        const employeeList = [];
        querySnapshot.forEach((docSnap) => {
          const docData = docSnap.data();
          const item = docData.data || docData;
          employeeList.push({ id: docSnap.id, ...item });
        });

        setEmployees(employeeList);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setErrorMsg("Failed to load employee list.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Employee Delete Handler
  const handleDeleteEmployee = async (e, empId, empName) => {
    // Card Click Event যেন ট্রিগার না হয় (Modal open বন্ধ করতে)
    e.stopPropagation();

    const isConfirmed = window.confirm(
      `Are you sure you want to delete employee "${empName || "N/A"}"?`
    );

    if (!isConfirmed) return;

    try {
      // 1. Firestore database থেকে Delete
      await deleteDoc(doc(db, "employees", empId));

      // 2. UI/State থেকে Remove
      setEmployees((prev) => prev.filter((emp) => emp.id !== empId));

      // 3. যদি ওপেন থাকা মডালের এমপ্লয়ি ডিলেট করা হয়, তবে মডাল বন্ধ হবে
      if (selectedEmployee?.id === empId) {
        setSelectedEmployee(null);
      }

      alert("Employee deleted successfully!");
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("Failed to delete employee.");
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading Employees...</div>;
  }

  if (errorMsg) {
    return <div className={styles.error}>{errorMsg}</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>All Employees</h2>

      {employees.length === 0 ? (
        <p className={styles.empty}>No employees found.</p>
      ) : (
        <div className={styles.grid}>
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={styles.card}
              onClick={() => setSelectedEmployee(emp)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              {/* Delete Button */}
              <button
                type="button"
                className={styles.deleteBtn || "delete-btn"}
                title="Delete Employee"
                onClick={(e) => handleDeleteEmployee(e, emp.id, emp.name)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "#ff4d4f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  zIndex: 2,
                }}
              >
                🗑️
              </button>

              <img
                src={emp.avatar || DEFAULT_AVATAR}
                alt={emp.name || "Employee"}
                className={styles.avatar}
              />
              <h3 className={styles.name}>{emp.name || "N/A"}</h3>
              <span className={styles.designation}>
                {emp.designation || "N/A"}
              </span>

              <div className={styles.detailsGroup}>
                <p className={styles.detailItem}>
                  <strong>Email:</strong> {emp.email || "N/A"}
                </p>
                <p className={styles.detailItem}>
                  <strong>Phone:</strong> {emp.phone || "N/A"}
                </p>
                <p className={styles.detailItem}>
                  <strong>Address:</strong> {emp.address || "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Employee Profile Modal */}
      {selectedEmployee && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedEmployee(null)}
            >
              ✖
            </button>

            {/* Selected User Compact Header */}
            <div className={styles.modalUserHeader}>
              <img
                src={selectedEmployee.avatar || DEFAULT_AVATAR}
                alt={selectedEmployee.name}
                className={styles.modalAvatar}
              />
              <div>
                <h3 className={styles.modalUserName}>
                  {selectedEmployee.name}
                </h3>
                {selectedEmployee.designation && (
                  <span className={styles.badge}>
                    {selectedEmployee.designation}
                  </span>
                )}
                <p className={styles.modalUserEmail}>
                  📧 {selectedEmployee.email}
                </p>
              </div>
            </div>

            {/* UserAttendanceRecord Fetch Component */}
            <UserAttendanceRecord
              employeeName={selectedEmployee.name}
              employeeEmail={selectedEmployee.email}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeList;