import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { db } from "../../Firebase/Firebase";
import UserAttendanceRecord from "../Component/UserAttendanceRecord";
import styles from "./YourProfile.module.css";

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

function YourProfile() {
  const { user } = useSelector((state) => state.auth || {});
  const currentUserEmail = user?.email || "";

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchProfileAndPermissions = async () => {
      if (!currentUserEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const cleanEmail = currentUserEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");

        const permSnap = await getDoc(doc(db, "user_permissions", cleanEmail));
        if (permSnap.exists()) {
          const permData = permSnap.data();
          if (permData.canAccessProfile === false) {
            setHasAccess(false);
            setLoading(false);
            return;
          }
        }

        const employeesRef = collection(db, "employees");
        const querySnapshot = await getDocs(employeesRef);

        let existingData = null;
        querySnapshot.forEach((docSnap) => {
          const item = docSnap.data().data || docSnap.data();
          if (docSnap.exists() && item?.email === currentUserEmail.toLowerCase()) {
            existingData = item;
          }
        });

        if (existingData) {
          setProfileData(existingData);
        }
      } catch (err) {
        console.error("Profile Fetch Error:", err);
        setErrorMsg("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPermissions();
  }, [currentUserEmail]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const scaleFactor = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleFactor;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setImagePreview(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !designation || !phone) {
      setErrorMsg("Please fill in required fields.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg("");

      const updatedPayload = {
        ...profileData,
        name,
        designation,
        phone,
        address,
        email: currentUserEmail.toLowerCase(),
        avatar: imagePreview || profileData?.avatar || "",
        updatedAt: new Date().toISOString(),
      };

      const employeePayload = {
        data: updatedPayload,
      };

      const docId = currentUserEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
      await setDoc(doc(db, "employees", docId), employeePayload, { merge: true });

      setProfileData(updatedPayload);
      setIsEditing(false);
    } catch (err) {
      console.error("Save Error:", err);
      setErrorMsg("Failed to save profile.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className={styles.profileContainer}><p className={styles.loader}>Loading Profile...</p></div>;

  if (!hasAccess) {
    return (
      <div className={styles.pageLayout} style={{ textAlign: "center", padding: "40px", color: "red" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access the Profile page. Contact your Administrator.</p>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <div className={styles.compactCard}>
        {profileData && !isEditing ? (
          <div className={styles.profileRow}>
            <img src={profileData.avatar || DEFAULT_AVATAR} alt="Avatar" className={styles.smallAvatar} />
            
            <div className={styles.profileMeta}>
              <h3>{profileData.name}</h3>
              <p className={styles.badge}>{profileData.designation}</p>
              <div className={styles.metaInfo}>
                <span>📧 {profileData.email}</span>
                <span>📞 {profileData.phone || "N/A"}</span>
                {profileData.address && <span>📍 {profileData.address}</span>}
              </div>
            </div>

            <button
              className={styles.compactEditBtn}
              onClick={() => {
                setName(profileData.name || "");
                setDesignation(profileData.designation || "");
                setPhone(profileData.phone || "");
                setAddress(profileData.address || "");
                setImagePreview(profileData.avatar || "");
                setIsEditing(true);
              }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h3>{profileData ? "Edit Profile" : "Create Profile"}</h3>
            {errorMsg && <p className={styles.errorMessage}>{errorMsg}</p>}
            
            <div className={styles.formGrid}>
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="text" placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
              <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className={styles.formActions}>
              <button type="submit" disabled={isUploading}>{isUploading ? "Saving..." : "Save"}</button>
              {profileData && <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>}
            </div>
          </form>
        )}
      </div>

      {profileData?.name && (
        <UserAttendanceRecord 
          employeeName={profileData.name} 
          employeeEmail={currentUserEmail} 
        />
      )}
    </div>
  );
}

export default YourProfile;