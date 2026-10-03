import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  clearAuthMessages,
  loginUser,
  loginWithGoogle,
  registerUser,
  resetPassword,
} from "../../Fetures/Inventory/authSlice";
import styles from "./AuthForm.module.css";

const AuthForm = ({ initialMode = "signup" }) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [isForgot, setIsForgot] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, successMessage, user } = useSelector((state) => state.auth);

  const initialFormState = {
    name: "",
    email: "",
    password: "",
    role: "Client",
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthMessages());

    if (isForgot) {
      if (!formData.email) {
        alert("Please enter your registered email!");
        return;
      }
      dispatch(resetPassword(formData.email));
      return;
    }

    if (isSignUp) {
      if (!formData.name || !formData.email || !formData.password || !formData.role) {
        alert("Please fill in all fields!");
        return;
      }
      dispatch(registerUser(formData)).then((res) => {
        if (!res.error) {
          if (formData.email.trim().toLowerCase() === "osanlift@gmail.com") {
            navigate("/");
          } else {
            alert("Registration request submitted! Please wait for Admin approval.");
            setIsSignUp(false);
            setFormData({ name: "", email: formData.email, password: "", role: "Client" });
          }
        }
      });
    } else {
      if (!formData.email || !formData.password) {
        alert("Please enter email and password!");
        return;
      }
      dispatch(loginUser({ email: formData.email, password: formData.password })).then(
        (res) => {
          if (!res.error) {
            setFormData(initialFormState);
            navigate("/");
          }
        }
      );
    }
  };

  const handleGoogleLogin = () => {
    dispatch(clearAuthMessages());
    dispatch(loginWithGoogle()).then((res) => {
      if (!res.error) {
        navigate("/");
      }
    });
  };

  const toggleMode = (mode) => {
    dispatch(clearAuthMessages());
    setIsForgot(false);
    setIsSignUp(mode === "signup");
    setFormData(initialFormState);
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.tabHeader}>
          <button
            type="button"
            className={`${styles.tabBtn} ${isSignUp && !isForgot ? styles.activeTab : ""}`}
            onClick={() => toggleMode("signup")}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${!isSignUp && !isForgot ? styles.activeTab : ""}`}
            onClick={() => toggleMode("login")}
          >
            Log In
          </button>
        </div>

        <h2>
          {isForgot
            ? "Reset Password"
            : isSignUp
            ? "Create New Account"
            : "Welcome Back"}
        </h2>

        {error && <div className={styles.errorAlert}>{error}</div>}
        {successMessage && <div className={styles.successAlert}>{successMessage}</div>}

        {user && !isSignUp && !isForgot && (
          <div className={styles.loggedInInfo}>
            Logged in as: <strong>{user.name || user.email}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formGroup}>
          {isSignUp && !isForgot && (
            <>
              <div className={styles.inputField}>
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required={isSignUp}
                />
              </div>

              <div className={styles.inputField}>
                <label>Signup As *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required={isSignUp}
                  className={styles.selectField}
                >
                  <option value="Client">Client</option>
                  <option value="Seller">Seller</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </>
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

          {!isForgot && (
            <div className={styles.inputField}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label>Password *</label>
                {!isSignUp && (
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={() => {
                      dispatch(clearAuthMessages());
                      setIsForgot(true);
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required={!isForgot}
              />
            </div>
          )}

          <div className={styles.actionRow}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? "Processing..."
                : isForgot
                ? "Send Reset Email"
                : isSignUp
                ? "Sign Up"
                : "Log In"}
            </button>

            {isForgot ? (
              <button
                type="button"
                className={styles.switchBtn}
                onClick={() => setIsForgot(false)}
              >
                Back to Login
              </button>
            ) : (
              <>
                <div className={styles.divider}>
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Sign in with Google
                </button>

                <button
                  type="button"
                  className={styles.switchBtn}
                  onClick={() => toggleMode(isSignUp ? "login" : "signup")}
                >
                  {isSignUp ? "Already have account? Login" : "Need account? Sign Up"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;