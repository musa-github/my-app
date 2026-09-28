import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { auth, db } from "../../Firebase/Firebase";
import UserAttendanceRecord from "../Component/UserAttendanceRecord";
import styles from "./EmployeeList.module.css";

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

const OWNER_EMAIL = "osanlift@gmail.com";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Edit Profile Modal State
  const [editingEmp, setEditingEmp] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    designation: "",
    phone: "",
    address: "",
    baseSalary: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const reduxUserEmail = useSelector((state) => state.auth?.user?.email);
  const currentUserEmail = (reduxUserEmail || auth.currentUser?.email || "").toLowerCase().trim();

  useEffect(() => {
    const fetchEmployeesAndAdminStatus = async () => {
      try {
        setLoading(true);

        const adminSnap = await getDocs(collection(db, "app_admins"));
        const adminList = [];
        adminSnap.forEach((docSnap) => {
          const adminData = docSnap.data();
          if (adminData && adminData.email) {
            adminList.push(adminData.email.toLowerCase().trim());
          }
        });

        const checkIsAdmin =
          currentUserEmail === OWNER_EMAIL || adminList.includes(currentUserEmail);
        setIsAdmin(checkIsAdmin);

        const querySnapshot = await getDocs(collection(db, "employees"));
        const employeeList = [];
        querySnapshot.forEach((docSnap) => {
          const docData = docSnap.data();
          const item = docData.data || docData;
          employeeList.push({ id: docSnap.id, ...item });
        });

        setEmployees(employeeList);
      } catch (err) {
        console.error("Error fetching data:", err);
        setErrorMsg("Failed to load employee list.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesAndAdminStatus();
  }, [currentUserEmail]);

  const handleDeleteEmployee = async (e, emp) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${emp.name || emp.email}?`
    );
    if (!confirmDelete) return;

    try {
      const cleanEmail = (emp.email || "").toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");

      if (emp.id) {
        await deleteDoc(doc(db, "employees", emp.id));
      }
      if (cleanEmail) {
        await deleteDoc(doc(db, "signUpData", cleanEmail));
        await deleteDoc(doc(db, "user_permissions", cleanEmail));
      }

      setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
      alert("Employee deleted successfully!");
    } catch (err) {
      console.error("Delete Employee Error:", err);
      alert("Failed to delete employee. Please try again.");
    }
  };

  const handleOpenEdit = (e, emp) => {
    e.stopPropagation();
    setEditingEmp(emp);
    setEditForm({
      name: emp.name || "",
      designation: emp.designation || "",
      phone: emp.phone || "",
      address: emp.address || "",
      baseSalary: emp.baseSalary || 0,
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;

    setIsSaving(true);
    try {
      const docId = editingEmp.id || editingEmp.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
      
      const updatedData = {
        ...editingEmp,
        name: editForm.name,
        designation: editForm.designation,
        phone: editForm.phone,
        address: editForm.address,
        baseSalary: Number(editForm.baseSalary),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "employees", docId), { data: updatedData }, { merge: true });

      setEmployees((prev) =>
        prev.map((item) => (item.id === docId ? updatedData : item))
      );

      if (selectedEmployee?.id === docId) {
        setSelectedEmployee(updatedData);
      }

      alert("Employee profile updated successfully!");
      setEditingEmp(null);
    } catch (err) {
      console.error("Update Profile Error:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
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
              style={{ cursor: "pointer" }}
            >
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

              {isAdmin && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                  className={styles.deleteBtn}
                    onClick={(e) => handleOpenEdit(e, emp)}
                    style={{
                      flex: 1,
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteEmployee(e, emp)}
                    style={{ flex: 1 }}
                  >
                    Delete
                  </button>
                </div>
              )}
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

            <UserAttendanceRecord
              employeeName={selectedEmployee.name}
              employeeEmail={selectedEmployee.email}
              userRole={isAdmin ? "admin" : "employee"}
            />
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {editingEmp && (
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
            zIndex: 10000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <h3>Edit Employee Profile</h3>
            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px" }}>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px" }}>Designation</label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px" }}>Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px" }}>Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px" }}>Base Salary</label>
                <input
                  type="number"
                  value={editForm.baseSalary}
                  onChange={(e) => setEditForm({ ...editForm, baseSalary: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  style={{ padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeList;