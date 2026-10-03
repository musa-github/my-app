import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSelectedRequest, setSupportRequests } from "../Fetures/Inventory/supportSlice";
import { auth, db } from "../Firebase/Firebase";
import styles from "./AdminPanel.module.css";

const OWNER_EMAIL = "osanlift@gmail.com";

function AdminPanel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const reduxUserEmail = useSelector((state) => state.auth?.user?.email);
  const currentUserEmail = (reduxUserEmail || auth.currentUser?.email || "").toLowerCase().trim();

  // Redux Toolkit state for support requests
  const supportRequests = useSelector((state) => state.support?.supportRequests || []);

  const [activeTab, setActiveTab] = useState("permissions");
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [signupRequests, setSignupRequests] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [adminList, setAdminList] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);

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

    // Listen to Real-time Technical Support Requests and Dispatch to Redux
    const unsubSupport = onSnapshot(
      collection(db, "technicalSupportRequests"),
      (snapshot) => {
        const activeSupport = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((item) => item.status !== "complete");

        // Save requests to Redux Store
        dispatch(setSupportRequests(activeSupport));
      },
      (error) => {
        console.error("Support listener error:", error);
      }
    );

    return () => unsubSupport();
  }, [dispatch]);

  const isAdmin = currentUserEmail === OWNER_EMAIL || adminList.includes(currentUserEmail);

  // Handle Redirect to Response Page
  const handleOpenResponsePage = (req) => {
    dispatch(setSelectedRequest(req));
    navigate("/technical-support-response");
  };

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
            className={`${styles.tabBtn} ${activeTab === "signupRequests" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("signupRequests")}
          >
            Signup Requests ({signupRequests.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "requests" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Attendance Requests ({requests.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "supportRequests" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("supportRequests")}
          >
            Technical Support ({supportRequests.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "admins" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("admins")}
          >
            Manage Admins ({adminList.length})
          </button>
        </div>
      </div>

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

      {/* Technical Support Requests Tab */}
      {activeTab === "supportRequests" && (
        <div>
          {supportRequests.length === 0 ? (
            <p className={styles.emptyText}>No pending technical support requests.</p>
          ) : (
            <div className={styles.cardGrid}>
              {supportRequests.map((req) => (
                <div key={req.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h4 className={styles.userName}>{req.userName || "Unknown User"}</h4>
                    <p className={styles.userEmail}>{req.email}</p>
                  </div>
                  <p className={styles.requestDetail}>
                    <strong>Service:</strong> {req.serviceTitle}
                  </p>
                  <p className={styles.requestDetail}>
                    <strong>WhatsApp:</strong> {req.whatsapp}
                  </p>
                  <p className={styles.requestDetail}>
                    <strong>Status:</strong>{" "}
                    <span className={styles.typeBadge}>{req.status || "Pending"}</span>
                  </p>

                  <div className={styles.actionBtns}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleOpenResponsePage(req)}
                    >
                      Respond Request
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
            <button type="submit" className={styles.addBtn}>
              Add Admin
            </button>
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
    </div>
  );
}

export default AdminPanel;