import { createUserWithEmailAndPassword } from "firebase/auth";
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

  // Screen-based Hierarchical Access Control Features
  const availableFeatures = [
    // 1. Header Navigation Control
    { key: "nav_home", label: "Header -> Home Navigation", category: "Header Menu" },
    { key: "nav_clients", label: "Header -> Clients Navigation", category: "Header Menu" },
    { key: "nav_projects", label: "Header -> Projects Navigation", category: "Header Menu" },
    { key: "nav_inventory", label: "Header -> Inventory & Billing Navigation", category: "Header Menu" },
    { key: "nav_employee", label: "Header -> Employee's Data Navigation", category: "Header Menu" },
    { key: "nav_admin", label: "Header -> Admin Panel Navigation", category: "Header Menu" },

    // 2. Clients Portal (Sidebar & Actions)
    { key: "clients_tab_list", label: "Clients -> Sidebar: Client List Page", category: "Clients Portal" },
    { key: "clients_tab_offer", label: "Clients -> Sidebar: Offer Page", category: "Clients Portal" },
    { key: "clients_tab_challan", label: "Clients -> Sidebar: Challan Page", category: "Clients Portal" },
    { key: "clients_tab_invoice", label: "Clients -> Sidebar: Invoice Page", category: "Clients Portal" },
    { key: "clients_action_save", label: "Clients -> Action: Save Offer/Challan", category: "Clients Actions" },
    { key: "clients_action_update", label: "Clients -> Action: Update Offer/Challan", category: "Clients Actions" },
    { key: "clients_action_delete", label: "Clients -> Action: Delete Offer/Challan", category: "Clients Actions" },
    { key: "clients_action_pdf", label: "Clients -> Action: Download PDF", category: "Clients Actions" },

    // 3. Projects Portal (Sidebar & Actions)
    { key: "projects_tab_summary", label: "Projects -> Sidebar: Summary Page", category: "Projects Portal" },
    { key: "projects_tab_serviced", label: "Projects -> Sidebar: Serviced & Schedule Page", category: "Projects Portal" },
    { key: "projects_action_add", label: "Projects -> Action: Add New Project", category: "Projects Actions" },
    { key: "projects_action_save", label: "Projects -> Action: Save to Firebase", category: "Projects Actions" },
    { key: "projects_action_edit", label: "Projects -> Action: Edit Project Info", category: "Projects Actions" },
    { key: "projects_action_update", label: "Projects -> Action: Update Servicing Schedule", category: "Projects Actions" },
    { key: "projects_action_delete", label: "Projects -> Action: Delete Project", category: "Projects Actions" },

    // 4. Employee & Attendance Portal Access Control
    { key: "emp_tab_profile", label: "Employee -> Sidebar: Your Profile Page", category: "Employee Portal" },
    { key: "emp_tab_attendance", label: "Employee -> Sidebar: Attendance Page", category: "Employee Portal" },
    { key: "emp_tab_list", label: "Employee -> Sidebar: Employee List Page", category: "Employee Portal" },
    { key: "emp_tab_payroll", label: "Employee -> Sidebar: Payroll & Salary Page", category: "Employee Portal" },
    { key: "emp_action_edit_profile", label: "Attendance -> Edit Employee Profile Modal", category: "Employee Actions" },
    { key: "emp_action_add_attendance", label: "Attendance -> Add Manual/Backdate Attendance Modal", category: "Employee Actions" },
    { key: "emp_action_edit_attendance", label: "Attendance -> Table Action: Edit Daily Attendance Log", category: "Employee Actions" },
    { key: "emp_action_download_pdf", label: "Attendance -> Action: Download PDF Statement", category: "Employee Actions" },
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
        const data = docSnap.data();
        if (data?.email) {
          admins.push(data.email.toLowerCase());
        }
      });

      if (!admins.includes(OWNER_EMAIL.toLowerCase())) {
        admins.push(OWNER_EMAIL.toLowerCase());
      }
      setAdminList(admins);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAdmin = currentUserEmail === OWNER_EMAIL.toLowerCase() || adminList.includes(currentUserEmail);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    const targetEmail = newAdminEmail.trim().toLowerCase();
    const cleanEmail = targetEmail.replace(/[^a-zA-Z0-9]/g, "_");

    try {
      await setDoc(doc(db, "app_admins", cleanEmail), {
        email: targetEmail,
        addedBy: currentUserEmail,
        createdAt: serverTimestamp(),
      });

      const fullPermissions = availableFeatures.reduce((acc, feat) => {
        acc[feat.key] = true;
        return acc;
      }, {});

      const adminPermsPayload = {
        ...fullPermissions,
        userEmail: targetEmail,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "user_permissions", cleanEmail), adminPermsPayload, { merge: true });

      setAdminList((prev) => [...prev, targetEmail]);
      setPermissions((prev) => ({
        ...prev,
        [cleanEmail]: adminPermsPayload,
      }));

      setNewAdminEmail("");
      alert("New Admin added with full permissions successfully!");
    } catch (err) {
      console.error("Add Admin Error:", err);
      alert("Failed to add admin.");
    }
  };

  const handleRemoveAdmin = async (targetEmail) => {
    if (targetEmail === OWNER_EMAIL.toLowerCase()) {
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

  const groupedFeatures = availableFeatures.reduce((acc, feat) => {
    acc[feat.category] = acc[feat.category] || [];
    acc[feat.category].push(feat);
    return acc;
  }, {});

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.heading}>Admin Control Panel</h2>

      <div className={styles.tabWrapper}>
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
      </div>

      {activeTab === "permissions" && (
        <div className={styles.cardGrid}>
          {employees.map((emp) => {
            const cleanEmail = (emp.email || "").toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
            const userPerms = permissions[cleanEmail] || {};

            return (
              <div key={emp.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.userName}>{emp.name || "N/A"}</h4>
                  <p className={styles.userEmail}>{emp.email}</p>
                </div>

                <div className={styles.toggleGroup}>
                  {Object.entries(groupedFeatures).map(([category, items]) => (
                    <div key={category} className={styles.categorySection}>
                      <span className={styles.categoryTitle}>{category}</span>
                      {items.map((feat) => (
                        <div key={feat.key} className={styles.toggleItem}>
                          <span className={styles.featureLabel}>{feat.label}</span>
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "signupRequests" && (
        <div>
          {signupRequests.length === 0 ? (
            <p className={styles.emptyText}>No pending signup requests found.</p>
          ) : (
            <div className={styles.cardGrid}>
              {signupRequests.map((req) => (
                <div key={req.email} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h4 className={styles.userName}>{req.name || "N/A"}</h4>
                    <p className={styles.userEmail}>{req.email}</p>
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

      {activeTab === "requests" && (
        <div>
          {requests.length === 0 ? (
            <p className={styles.emptyText}>No pending requests found.</p>
          ) : (
            <div className={styles.cardGrid}>
              {requests.map((req) => (
                <div key={req.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h4 className={styles.userName}>{req.employeeName}</h4>
                    <p className={styles.userEmail}>{req.employeeEmail}</p>
                  </div>

                  <p className={styles.requestDetail}>
                    <strong>Type:</strong> <span className={styles.typeBadge}>{req.type}</span>
                  </p>

                  {req.type === "ADVANCE" ? (
                    <p className={styles.requestDetail}>
                      <strong>Amount:</strong> ৳ {req.amount} ({req.reason})
                    </p>
                  ) : req.type === "LEAVE" ? (
                    <p className={styles.requestDetail}>
                      <strong>Reason:</strong> {req.reason} ({req.date})
                    </p>
                  ) : (
                    <>
                      <p className={styles.requestDetail}>
                        <strong>Time:</strong> {req.time}
                      </p>
                      <p className={styles.requestDetail}>
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
                <span className={styles.adminEmail}>{email}</span>
                {email !== OWNER_EMAIL.toLowerCase() && (
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