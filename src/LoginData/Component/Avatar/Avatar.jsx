import styles from "./Avatar.module.css";

export const Avatar = ({ profile }) => {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  return (
    <div className={styles.avatarWrapper}>
      <img
        src={profile?.avatar || defaultAvatar}
        alt={profile?.name || "User Avatar"}
        className={styles.avatarImg}
      />
      <div className={styles.userInfo}>
        <span className={styles.userName}>{profile?.name || "User"}</span>
        {profile?.designation && (
          <span className={styles.userRole}>{profile.designation}</span>
        )}
      </div>
    </div>
  );
};