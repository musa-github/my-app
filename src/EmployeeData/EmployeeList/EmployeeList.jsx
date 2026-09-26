import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../../Firebase/Firebase";
import UserAttendanceRecord from "../Component/UserAttendanceRecord";
import styles from "./EmployeeList.module.css";

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    designation: "",
    phone: "",
    address: "",
    email: ""
  });
  const [saving, setSaving] = useState(false);

  const currentUser = auth.currentUser;

  // Primary Owner Emails
  const OWNER_EMAILS = ["smabumusa98@gmail.com"];

  useEffect(() => {
    const checkAuthorizationAndFetch = async () => {
      try {
        setLoading(true);

        // 1. Check Owner / Admin Authorization
        let hasAccess = false;
        if (currentUser?.email) {
          const userEmail = currentUser.email.toLowerCase();

          if (OWNER_EMAILS.map((e) => e.toLowerCase()).includes(userEmail)) {
            hasAccess = true;
          } else {
            const adminSnap = await getDocs(collection(db, "app_admins"));
            const adminList = adminSnap.docs.map(
              (d) => d.data().email?.toLowerCase()
            );
            if (adminList.includes(userEmail)) {
              hasAccess = true;
            }
          }
        }
        setIsAuthorized(hasAccess);

        // 2. Fetch Employees
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

    checkAuthorizationAndFetch();
  }, [currentUser]);

  // Open Edit Mode with existing profile details
  const handleStartEdit = () => {
    setEditFormData({
      name: selectedEmployee?.name || "",
      designation: selectedEmployee?.designation || "",
      phone: selectedEmployee?.phone || "",
      address: selectedEmployee?.address || "",
      email: selectedEmployee?.email || ""
    });
    setIsEditing(true);
  };

  // Save Updated Profile to Firestore
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!selectedEmployee?.id) return;

    try {
      setSaving(true);
      const empRef = doc(db, "employees", selectedEmployee.id);

      const updatedFields = {
        name: editFormData.name,
        designation: editFormData.designation,
        phone: editFormData.phone,
        address: editFormData.address,
        email: editFormData.email
      };

      await updateDoc(empRef, updatedFields);

      // Local State Update
      const updatedEmp = { ...selectedEmployee, ...updatedFields };
      setSelectedEmployee(updatedEmp);
      setEmployees((prev) =>
        prev.map((item) => (item.id === selectedEmployee.id ? updatedEmp : item))
      );

      setIsEditing(false);
      alert("Employee profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Employee Delete Handler
  const handleDeleteEmployee = async (e, empId, empName) => {
    e.stopPropagation();

    if (!isAuthorized) {
      alert("Access Denied! Only Owner and Admins can delete employee data.");
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to delete employee "${empName || "N/A"}"?`
    );

    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "employees", empId));
      setEmployees((prev) => prev.filter((emp) => emp.id !== empId));

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
              onClick={() => {
                setSelectedEmployee(emp);
                setIsEditing(false);
              }}
            >
              {/* Delete Button */}
              {isAuthorized && (
                <button
                  type="button"
                  className={styles.cardDeleteBtn}
                  title="Delete Employee"
                  onClick={(e) => handleDeleteEmployee(e, emp.id, emp.name)}
                >
                  🗑️
                </button>
              )}

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
          onClick={() => {
            setSelectedEmployee(null);
            setIsEditing(false);
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => {
                setSelectedEmployee(null);
                setIsEditing(false);
              }}
            >
              ✖
            </button>

            {/* Profile Header */}
            <div className={styles.modalUserHeader}>
              <img
                src={selectedEmployee.avatar || DEFAULT_AVATAR}
                alt={selectedEmployee.name}
                className={styles.modalAvatar}
              />
              <div className={styles.modalUserInfo}>
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

            {/* Edit Action Toolbar */}
            {isAuthorized && !isEditing && (
              <div className={styles.actionToolbar}>
                <button
                  type="button"
                  className={styles.editProfileBtn}
                  onClick={handleStartEdit}
                >
                  ✏️ Edit Profile Info
                </button>
              </div>
            )}

            {/* Edit Profile Form */}
            {isEditing && (
              <form onSubmit={handleSaveProfile} className={styles.editForm}>
                <h4 className={styles.formHeading}>Edit Employee Details</h4>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Name:</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Designation:</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editFormData.designation}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        designation: e.target.value
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone:</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phone: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address:</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editFormData.address}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email:</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    disabled={saving}
                    className={styles.saveBtn}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Attendance & Salary Details */}
            <UserAttendanceRecord
              employeeName={selectedEmployee.name}
              employeeEmail={selectedEmployee.email}
              isAdmin={isAuthorized}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeList;