import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router"; // useNavigate ইমপোর্ট করা হয়েছে
import { clearAuthMessages, loginUser, registerUser } from "../../Fetures/Inventory/authSlice";
import styles from "./AuthForm.module.css";

const AuthForm = ({ initialMode = "signup" }) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Hook ইনিশিয়ালাইজ করা হয়েছে
  const { loading, error, successMessage, user } = useSelector((state) => state.auth);

  const initialFormState = {
    name: "",
    email: "",
    password: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // সাবমিট হ্যান্ডলার
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthMessages());

    if (isSignUp) {
      if (!formData.name || !formData.email || !formData.password) {
        alert("Please fill in all fields!");
        return;
      }
      dispatch(registerUser(formData)).then((res) => {
        if (!res.error) {
          alert("Registration request submitted! Please wait for Admin approval.");
          setIsSignUp(false);
          setFormData({ name: "", email: formData.email, password: "" });
        }
      });
    } else {
      if (!formData.email || !formData.password) {
        alert("Please enter email and password!");
        return;
      }
      dispatch(
        loginUser({ email: formData.email, password: formData.password })
      ).then((res) => {
        if (!res.error) {
          setFormData(initialFormState);
          navigate("/"); // সফল লগইনের পর Home Page-এ রিডাইরেক্ট করবে
        }
      });
    }
  };

  // মোড সুইচিং (Signup ↔ Login)
  const toggleMode = (mode) => {
    dispatch(clearAuthMessages());
    setIsSignUp(mode === "signup");
    setFormData(initialFormState);
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* হেডারের টগল বাটন */}
        <div className={styles.tabHeader}>
          <button
            type="button"
            className={`${styles.tabBtn} ${isSignUp ? styles.activeTab : ""}`}
            onClick={() => toggleMode("signup")}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${!isSignUp ? styles.activeTab : ""}`}
            onClick={() => toggleMode("login")}
          >
            Log In
          </button>
        </div>

        <h2>{isSignUp ? "Create New Account" : "Welcome Back"}</h2>

        {/* এলার্ট মেসেজ */}
        {error && <div className={styles.errorAlert}>{error}</div>}
        {successMessage && (
          <div className={styles.successAlert}>{successMessage}</div>
        )}

        {user && !isSignUp && (
          <div className={styles.loggedInInfo}>
            Logged in as: <strong>{user.name || user.email}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formGroup}>
          {isSignUp && (
            <div className={styles.inputField}>
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. S.M. Abu Musa"
                value={formData.name}
                onChange={handleChange}
                required={isSignUp}
              />
            </div>
          )}

          <div className={styles.inputField}>
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="e.g. name@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputField}>
            <label>Password *</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.actionRow}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isSignUp
                ? "Sign Up"
                : "Log In"}
            </button>

            <button
              type="button"
              className={styles.switchBtn}
              onClick={() => toggleMode(isSignUp ? "login" : "signup")}
            >
              {isSignUp ? "Already have account? Login" : "Need account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;