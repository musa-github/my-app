import styles from "./Avatar.module.css";

export const Avatar = ({ profile }) => {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  // Firestore-e nested data thakle profile.data thakbe, nohoy direct profile object
  const userData = profile?.data || profile;

  // Image Fallback Logic:
  // 1. Employee DB Avatar (base64 or URL) -> profile.data.avatar or profile.avatar
  // 2. Google Auth photoURL -> profile.photoURL
  // 3. Default Avatar
  const avatarSrc = userData?.avatar || profile?.photoURL || defaultAvatar;

  // Name Fallback Logic:
  // 1. Employee DB Name -> profile.data.name or profile.name
  // 2. Google Auth displayName -> profile.displayName
  // 3. Email/User Fallback
  const userName = userData?.name || profile?.displayName || profile?.name || "User";

  // Designation Fallback Logic
  const userRole = userData?.designation || profile?.designation || profile?.role;

  return (
    <div className={styles.avatarWrapper}>
      <img
        src={avatarSrc}
        alt={userName}
        className={styles.avatarImg}
      />
      <div className={styles.userInfo}>
        <span className={styles.userName}>{userName}</span>
        {userRole && (
          <span className={styles.userRole}>{userRole}</span>
        )}
      </div>
    </div>
  );
};