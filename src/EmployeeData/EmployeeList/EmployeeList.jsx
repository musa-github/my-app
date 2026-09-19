import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../Firebase/Firebase";
import styles from "./EmployeeList.module.css"; // Module Import

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "employees"));
        
        const employeeList = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          const item = docData.data || docData;
          employeeList.push({ id: doc.id, ...item });
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
            <div key={emp.id} className={styles.card}>
              <img
                src={emp.avatar || DEFAULT_AVATAR}
                alt={emp.name || "Employee"}
                className={styles.avatar}
              />
              <h3 className={styles.name}>{emp.name || "N/A"}</h3>
              <span className={styles.designation}>{emp.designation || "N/A"}</span>
              
              <div className={styles.detailsGroup}>
                <p className={styles.detailItem}><strong>Email:</strong> {emp.email || "N/A"}</p>
                <p className={styles.detailItem}><strong>Phone:</strong> {emp.phone || "N/A"}</p>
                <p className={styles.detailItem}><strong>Address:</strong> {emp.address || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmployeeList;