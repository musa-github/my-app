/* eslint-disable react-hooks/set-state-in-effect */
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
import { useDispatch, useSelector } from "react-redux";
import { auth, db } from "../Firebase/Firebase";
import styles from "./AdminPanel.module.css";

// Redux Actions
import { fetchSupportRequests } from "../Fetures/Inventory/technicalSupportSlice";
import SupportResponseModal from "../Services/SupportResponseModal";

const OWNER_EMAIL = "osanlift@gmail.com";

function AdminPanel() {
  const dispatch = useDispatch();

  const reduxUserEmail = useSelector((state) => state.auth?.user?.email);
  const currentUserEmail = (reduxUserEmail || auth.currentUser?.email || "").toLowerCase().trim();

  // Technical Support Requests from Redux
  const supportRequests = useSelector((state) => state.technicalSupport?.requests || []);

  // Filter ONLY Pending / Active requests
  const pendingTechRequests = supportRequests.filter(
    (req) => req.status !== "Completed" && req.status !== "Processed"
  );

  const [activeTab, setActiveTab] = useState("permissions");
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [signupRequests, setSignupRequests] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [adminList, setAdminList] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Tech Support Modal State
  const [selectedTechRequest, setSelectedTechRequest] = useState(null);

  const availableFeatures = [
    { key: "nav_home", label: "Header -> Home Navigation", category: "Header Menu" },
    { key: "nav_clients", label: "Header -> Clients Navigation", category: "Header Menu" },
    { key: "nav_projects", label: "Header -> Projects Navigation", category: "Header Menu" },
    { key: "nav_inventory", label: "Header -> Inventory & Billing Navigation", category: "Header Menu" },
    { key: "nav_employee", label: "Header -> Employee's Data Navigation", category: "Header Menu" },
    { key: "nav_admin", label: "Header -> Admin Panel Navigation", category: "Header Menu" },

    { key: "clients_tab_list", label: "Clients -> Sidebar: Client List Page", category: "Clients Portal" },
    { key: "clients_tab_offer", label: "Clients -> Sidebar: Offer Page", category: "Clients Portal" },
    { key: "clients_tab_challan", label: "Clients -> Sidebar: Challan Page", category: "Clients Portal" },
    { key: "clients_tab_invoice", label: "Clients -> Sidebar: Invoice Page", category: "Clients Portal" },
    { key: "clients_action_save", label: "Clients -> Action: Save Offer/Challan", category: "Clients Actions" },
    { key: "clients_action_update", label: "Clients -> Action: Update Offer/Challan", category: "Clients Actions" },
    { key: "clients_action_delete", label: "Clients -> Action: Delete Offer/Challan", category: "Clients Actions" },
    { key: "clients_action_pdf", label: "Clients -> Action: Download PDF", category: "Clients Actions" },

    { key: "projects_tab_summary", label: "Projects -> Sidebar: Summary Page", category: "Projects Portal" },
    { key: "projects_tab_serviced", label: "Projects -> Sidebar: Serviced & Schedule Page", category: "Projects Portal" },
    { key: "projects_action_add", label: "Projects -> Action: Add New Project", category: "Projects Actions" },
    { key: "projects_action_save", label: "Projects -> Action: Save to Firebase", category: "Projects Actions" },
    { key: "projects_action_edit", label: "Projects -> Action: Edit Project Info", category: "Projects Actions" },
    { key: "projects_action_update", label: "Projects -> Action: Update Servicing Schedule", category: "Projects Actions" },
    { key: "projects_action_delete", label: "Projects -> Action: Delete Project", category: "Projects Actions" },

    { key: "emp_tab_profile", label: "Employee -> Sidebar: Your Profile Page", category: "Employee Portal" },
    { key: "emp_tab_attendance", label: "Employee -> Sidebar: Attendance Page", category: "Employee Portal" },
    { key: "emp_tab_list", label: "Employee -> Sidebar: Employee List Page", category: "Employee Portal" },
    { key: "emp_tab_payroll", label: "Employee -> Sidebar: Payroll & Salary Page", category: "Employee Portal" },
    { key: "emp_action_edit_profile", label: "Employee -> Action: Edit Profile Info", category: "Employee Actions" },
    { key: "emp_action_download_pdf", label: "Employee -> Action: Download PDF Statement", category: "Employee Actions" },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      dispatch(fetchSupportRequests());

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
        const adminData = docSnap.data();
        if (adminData && adminData.email) {
          admins.push(adminData.email.toLowerCase().trim());
        }
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
    fetchData();
  }, []);

  const isAdmin = currentUserEmail === OWNER_EMAIL || adminList.includes(currentUserEmail);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    const rawEmail = newAdminEmail.trim().toLowerCase();
    const cleanEmail = rawEmail.replace(/[^a-zA-Z0-9]/g, "_");

    try {
      await setDoc(doc(db, "app_admins", cleanEmail), {
        email: rawEmail,
        addedBy: currentUserEmail,
        createdAt: serverTimestamp(),
      });

      const fullPermissions = availableFeatures.reduce((acc, feat) => {
        acc[feat.key] = true;
        return acc;
      }, {});

      const updatedUserPerms = {
        ...fullPermissions,
        userEmail: rawEmail,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "user_permissions", cleanEmail), updatedUserPerms, { merge: true });

      setPermissions((prev) => ({
        ...prev,
        [cleanEmail]: updatedUserPerms,
      }));

      setAdminList((prev) => [...prev, rawEmail]);
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

      {/* Tab Navigation Section */}
      <div className={styles.tabWrapper}>
        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabBtn} ${activeTab === "permissions" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("permissions")}
          >
            Access Control
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "techSupport" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("techSupport")}
          >
            Technical Support ({pendingTechRequests.length})
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

      {/* Technical Support Tab */}
      {activeTab === "techSupport" && (
        <div className={styles.cardGrid}>
          {pendingTechRequests.length === 0 ? (
            <p className={styles.emptyText}>No pending Technical Support requests found.</p>
          ) : (
            pendingTechRequests.map((req) => (
              <div key={req.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.userName}>{req.userName || "N/A"}</h4>
                  <p className={styles.userEmail}>{req.email}</p>
                  <p className={styles.userEmail}>Phone: {req.phone}</p>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <p className={styles.requestDetail}>
                    <strong>Category:</strong> {req.serviceCategory}
                  </p>
                  <p className={styles.requestDetail}>
                    <strong>Title:</strong> {req.serviceTitle}
                  </p>
                  <p className={styles.requestDetail}>
                    <strong>Problem:</strong> {req.problemDescription}
                  </p>
                  <p className={styles.requestDetail}>
                    <strong>Status:</strong> <span className={styles.typeBadge}>{req.status || "Pending"}</span>
                  </p>
                </div>

                <div className={styles.actionBtns}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => setSelectedTechRequest(req)}
                  >
                    Process Request
                  </button>
                  {req.adminResponse && (
                    <button
                      className={styles.addBtn}
                      onClick={() => setSelectedTechRequest(req)}
                    >
                      View Modal
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Access Control / Permissions Tab */}
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

      {/* Signup Requests Tab */}
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

      {/* Attendance & Other Requests Tab */}
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

      {/* Manage Admins Tab */}
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

      {/* Single Unified Support Response Modal */}
      {selectedTechRequest && (
        <SupportResponseModal
          request={selectedTechRequest}
          onClose={() => setSelectedTechRequest(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}

export default AdminPanel;