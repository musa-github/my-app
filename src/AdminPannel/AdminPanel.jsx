
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { auth, db } from "../Firebase/Firebase";
import styles from "./AdminPanel.module.css";

const OWNER_EMAIL = "smabumusa98@gmail.com";

function AdminPanel() {
  const reduxUserEmail = useSelector((state) => state.auth?.user?.email);
  const currentUserEmail = (reduxUserEmail || auth.currentUser?.email || "").toLowerCase();

  const [activeTab, setActiveTab] = useState("permissions");
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [signupRequests, setSignupRequests] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [adminList, setAdminList] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const availableFeatures = [
    // Header & Navigation Page Access Control
    { key: "canAccessHome", label: "Home Page Access", category: "Pages" },
    { key: "canAccessClients", label: "Clients Page Access", category: "Pages" },
    { key: "canAccessProjects", label: "Projects Page Access", category: "Pages" },
    { key: "canAccessInventory", label: "Inventory & Billing Page Access", category: "Pages" },
    { key: "canAccessEmployees", label: "Employee List Page Access", category: "Pages" },
    { key: "canAccessProfile", label: "Your Profile Page Access", category: "Pages" },
    { key: "canGiveAttendance", label: "Attendance Page Access", category: "Pages" },
    { key: "canAccessPayroll", label: "Payroll & Salary Page Access", category: "Pages" },
    { key: "canViewReports", label: "Reports Page Access", category: "Pages" },

    // Options/Actions Control inside Pages
    { key: "canAddInventoryItem", label: "Inventory -> Add New Product", category: "Options" },
    { key: "canDeleteInventoryItem", label: "Inventory -> Delete Product", category: "Options" },
    { key: "canCreateInvoice", label: "Billing -> Create Voucher/Invoice", category: "Options" },
    { key: "canExportReports", label: "Reports -> Export PDF/Excel", category: "Options" },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      const empSnap = await getDocs(collection(db, "employees"));
      const empList = [];
      empSnap.forEach((docSnap) => {
        const item = docSnap.data().data || docSnap.data();
        empList.push({ id: docSnap.id, ...item });
      });
      setEmployees(empList);

      const permSnap = await getDocs(collection(db, "user_permissions"));
      const permMap = {};
      permSnap.forEach((docSnap) => {
        permMap[docSnap.id] = docSnap.data();
      });
      setPermissions(permMap);

      const reqSnap = await getDocs(collection(db, "attendance_requests"));
      const reqList = [];
      reqSnap.forEach((docSnap) => {
        reqList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRequests(reqList);

      const signupSnap = await getDocs(collection(db, "pendingRequests"));
      const signupList = [];
      signupSnap.forEach((docSnap) => {
        const data = docSnap.data().data || docSnap.data();
        signupList.push({ id: docSnap.id, ...data });
      });
      setSignupRequests(signupList);

      const adminSnap = await getDocs(collection(db, "app_admins"));
      const admins = [];
      adminSnap.forEach((docSnap) => {
        admins.push(docSnap.id.replace(/_/g, "."));
      });

      if (!admins.includes(OWNER_EMAIL)) {
        admins.push(OWNER_EMAIL);
      }
      setAdminList(admins);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const isAdmin = currentUserEmail === OWNER_EMAIL || adminList.includes(currentUserEmail);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    const cleanEmail = newAdminEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    try {
      await setDoc(doc(db, "app_admins", cleanEmail), {
        email: newAdminEmail.trim().toLowerCase(),
        addedBy: currentUserEmail,
        createdAt: serverTimestamp(),
      });

      setAdminList((prev) => [...prev, newAdminEmail.trim().toLowerCase()]);
      setNewAdminEmail("");
      alert("New Admin added successfully!");
    } catch (err) {
      console.error("Add Admin Error:", err);
      alert("Failed to add admin.");
    }
  };

  const handleRemoveAdmin = async (targetEmail) => {
    if (targetEmail === OWNER_EMAIL) {
      alert("Owner account cannot be removed from Admin list!");
      return;
    }

    const cleanEmail = targetEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    try {
      await deleteDoc(doc(db, "app_admins", cleanEmail));
      setAdminList((prev) => prev.filter((email) => email !== targetEmail));
      alert("Admin removed successfully!");
    } catch (err) {
      console.error("Remove Admin Error:", err);
      alert("Failed to remove admin.");
    }
  };

  const handlePermissionToggle = async (userEmail, featureKey) => {
    const cleanEmail = userEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    const currentPerms = permissions[cleanEmail] || {};
    const updatedValue = !currentPerms[featureKey];

    const updatedUserPerms = {
      ...currentPerms,
      [featureKey]: updatedValue,
      userEmail: userEmail.toLowerCase(),
      updatedAt: new Date().toISOString(),
    };

    setPermissions((prev) => ({
      ...prev,
      [cleanEmail]: updatedUserPerms,
    }));

    try {
      await setDoc(doc(db, "user_permissions", cleanEmail), updatedUserPerms, { merge: true });
    } catch (err) {
      console.error("Permission Save Error:", err);
      alert("Failed to update permission");
    }
  };

  // Dynamic Approval for Attendance, Leave & Advance
  const handleApproveRequest = async (request) => {
    try {
      const cleanEmpName = (request.employeeName || "Unknown").replace(/[^a-zA-Z0-9]/g, "_");
      const cleanEmail = (request.employeeEmail || "").replace(/[^a-zA-Z0-9]/g, "_");

      if (request.type === "IN" || request.type === "OUT") {
        const docRef = doc(
          db,
          "attendance",
          cleanEmpName,
          request.monthYear || "General",
          request.date
        );

        const updateField = request.type === "IN"
          ? { inTime: request.time, statusIn: "Approved" }
          : { outTime: request.time, statusOut: "Approved" };

        await setDoc(
          docRef,
          {
            employeeName: request.employeeName,
            employeeEmail: request.employeeEmail,
            date: request.date,
            monthYear: request.monthYear || "",
            ...updateField,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else if (request.type === "LEAVE") {
        // Save Leave under month collection
        const docRef = doc(
          db,
          "attendance",
          cleanEmpName,
          request.monthYear || "General",
          request.date
        );

        await setDoc(
          docRef,
          {
            employeeName: request.employeeName,
            employeeEmail: request.employeeEmail,
            date: request.date,
            status: "Leave",
            reason: request.reason || "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else if (request.type === "ADVANCE") {
        // Update Advance Deduction in employee doc
        const empRef = doc(db, "employees", cleanEmail);
        await setDoc(
          empRef,
          {
            data: {
              advanceDeduction: Number(request.amount || 0),
            },
          },
          { merge: true }
        );
      }

      await deleteDoc(doc(db, "attendance_requests", request.id));
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      alert(`${request.type} request approved for ${request.employeeName}`);
    } catch (err) {
      console.error("Approve Error:", err);
      alert("Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, "attendance_requests", requestId));
      setRequests((prev) => prev.filter((item) => item.id !== requestId));
    } catch (err) {
      console.error("Reject Error:", err);
      alert("Failed to reject request");
    }
  };

  const handleApproveSignup = async (req) => {
    try {
      const cleanEmail = req.email.trim().toLowerCase();

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, req.password);
      const uid = userCredential.user.uid;

      // eslint-disable-next-line no-unused-vars
      const { password, ...safeData } = req;
      const approvedPayload = {
        ...safeData,
        uid: uid,
        email: cleanEmail,
        approvedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "signUpData", cleanEmail), { data: approvedPayload });

      const empDocId = cleanEmail.replace(/[^a-zA-Z0-9]/g, "_");
      await setDoc(
        doc(db, "employees", empDocId),
        {
          data: {
            name: req.name || "",
            email: cleanEmail,
            uid: uid,
            createdAt: new Date().toISOString(),
          },
        },
        { merge: true }
      );

      await deleteDoc(doc(db, "pendingRequests", cleanEmail));

      setSignupRequests((prev) => prev.filter((item) => item.email !== req.email));
      alert(`Approved signup request for: ${req.email}`);
      fetchData();
    } catch (err) {
      console.error("Signup Approve Error:", err);
      alert("Failed to approve signup: " + err.message);
    }
  };

  const handleRejectSignup = async (email) => {
    try {
      const cleanEmail = email.toLowerCase();
      await deleteDoc(doc(db, "pendingRequests", cleanEmail));
      setSignupRequests((prev) => prev.filter((item) => item.email !== email));
      alert(`Rejected signup request for: ${email}`);
    } catch (err) {
      console.error("Signup Reject Error:", err);
      alert("Failed to reject signup request");
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading Admin Panel...</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.unauthorized}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view the Admin Panel.</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.heading}>Admin Control Panel</h2>

      <div className={styles.tabButtons}>
        <button
          className={`${styles.tabBtn} ${activeTab === "permissions" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("permissions")}
        >
          Access Control
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "signupRequests" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("signupRequests")}
        >
          Signup Requests ({signupRequests.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "requests" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Requests ({requests.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "admins" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          Manage Admins ({adminList.length})
        </button>
      </div>

      {/* Permissions Tab */}
      {activeTab === "permissions" && (
        <div className={styles.cardGrid}>
          {employees.map((emp) => {
            const cleanEmail = (emp.email || "").toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
            const userPerms = permissions[cleanEmail] || {};

            return (
              <div key={emp.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h4 className={styles.userName}>{emp.name || "N/A"}</h4>
                    <p className={styles.userEmail}>{emp.email}</p>
                  </div>
                </div>

                <div className={styles.toggleGroup}>
                  {availableFeatures.map((feat) => (
                    <div key={feat.key} className={styles.toggleItem}>
                      <span style={{ fontSize: "0.85rem" }}>{feat.label}</span>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={Boolean(userPerms[feat.key])}
                          onChange={() => handlePermissionToggle(emp.email, feat.key)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Requests Tab (Attendance, Leave & Advance) */}
      {activeTab === "requests" && (
        <div>
          {requests.length === 0 ? (
            <p className={styles.emptyText}>No pending requests found.</p>
          ) : (
            <div className={styles.cardGrid}>
              {requests.map((req) => (
                <div key={req.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h4 className={styles.userName}>{req.employeeName}</h4>
                      <p className={styles.userEmail}>{req.employeeEmail}</p>
                    </div>
                  </div>

                  <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                    <strong>Type:</strong> <span style={{ color: "#2563eb", fontWeight: "bold" }}>{req.type}</span>
                  </p>

                  {req.type === "ADVANCE" ? (
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                      <strong>Amount:</strong> ৳ {req.amount} ({req.reason})
                    </p>
                  ) : req.type === "LEAVE" ? (
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                      <strong>Reason:</strong> {req.reason} ({req.date})
                    </p>
                  ) : (
                    <>
                      <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                        <strong>Time:</strong> {req.time}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                        <strong>Date:</strong> {req.date}
                      </p>
                    </>
                  )}

                  <div className={styles.actionBtns}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleApproveRequest(req)}
                    >
                      Approve
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleRejectRequest(req.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Signup Requests */}
      {activeTab === "signupRequests" && (
        <div>
          {signupRequests.length === 0 ? (
            <p className={styles.emptyText}>No pending signup requests found.</p>
          ) : (
            <div className={styles.cardGrid}>
              {signupRequests.map((req) => (
                <div key={req.email} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h4 className={styles.userName}>{req.name || "N/A"}</h4>
                      <p className={styles.userEmail}>{req.email}</p>
                    </div>
                  </div>

                  <div className={styles.actionBtns}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleApproveSignup(req)}
                    >
                      Approve User
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleRejectSignup(req.email)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage Admins */}
      {activeTab === "admins" && (
        <div>
          <form onSubmit={handleAddAdmin} className={styles.adminForm}>
            <input
              type="email"
              placeholder="Enter email to make Admin"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.addBtn}>Add Admin</button>
          </form>

          <div className={styles.adminList}>
            {adminList.map((email) => (
              <div key={email} className={styles.adminItem}>
                <span>{email}</span>
                {email !== OWNER_EMAIL && (
                  <button onClick={() => handleRemoveAdmin(email)} className={styles.removeBtn}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;