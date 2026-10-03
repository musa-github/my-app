import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "../../Firebase/Firebase";

const savedUser = JSON.parse(localStorage.getItem("authUser")) || null;

// Owner ba admin er email
const OWNER_EMAIL = "osanlift@gmail.com";

// 1. Async Thunk: Sign Up Request Handler
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (signUpData, { rejectWithValue }) => {
    try {
      const cleanEmail = signUpData.email.trim().toLowerCase();

      // Owner ba Admin account create korle
      if (cleanEmail === OWNER_EMAIL) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          signUpData.password
        );
        const user = userCredential.user;

        const userPayload = {
          name: signUpData.name,
          email: cleanEmail,
          role: "Admin",
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "signUpData", cleanEmail), { data: userPayload });

        const finalPayload = {
          ...userPayload,
          uid: user.uid,
        };

        localStorage.setItem("authUser", JSON.stringify(finalPayload));
        return { isOwner: true, user: finalPayload, message: "Admin account created & logged in successfully!" };
      }

      // Sadharon user-der jonno (Approval Process)
      const pendingRef = doc(db, "pendingRequests", cleanEmail);
      const pendingSnap = await getDoc(pendingRef);

      if (pendingSnap.exists()) {
        return rejectWithValue("An approval request is already pending for this email!");
      }

      const pendingPayload = {
        name: signUpData.name,
        email: cleanEmail,
        password: signUpData.password,
        role: signUpData.role || "Client",
        status: "Pending",
        requestedAt: new Date().toISOString(),
      };

      await setDoc(pendingRef, { data: pendingPayload });

      return { isOwner: false, message: "Signup request sent successfully! Waiting for admin approval." };
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        return rejectWithValue("This email is already registered. Please login!");
      }
      return rejectWithValue(error.message);
    }
  }
);

// 2. Async Thunk: Firebase Email/Password Login Handler
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      const loginRef = doc(db, "loginData", cleanEmail);
      const loginPayload = {
        email: cleanEmail,
        uid: user.uid,
        loggedInAt: new Date().toISOString(),
        status: "Active",
      };
      await setDoc(loginRef, { data: loginPayload });

      const userSnap = await getDoc(doc(db, "signUpData", cleanEmail));
      const registeredData = userSnap.exists() ? userSnap.data().data : {};

      let employeeProfile = null;
      const employeesRef = collection(db, "employees");
      const q = query(employeesRef, where("data.email", "==", cleanEmail));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          employeeProfile = docSnap.data().data;
        }
      });

      const userPayload = {
        ...registeredData,
        email: cleanEmail,
        uid: user.uid,
        employeeProfile: employeeProfile,
      };

      localStorage.setItem("authUser", JSON.stringify(userPayload));
      return userPayload;
    } catch (error) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        return rejectWithValue("Invalid email or password or account not approved yet!");
      }
      return rejectWithValue(error.message);
    }
  }
);

// 3. Async Thunk: Google Login Handler (Updated with Automatic Role Matching)
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const cleanEmail = user.email.toLowerCase();

      // Step A: Default Role selection based on Email
      let detectedRole = cleanEmail === OWNER_EMAIL ? "Admin" : "Client";

      // Step B: employees collection-e email match kore ki na check kora
      let employeeProfile = null;
      const employeesRef = collection(db, "employees");
      const q = query(employeesRef, where("data.email", "==", cleanEmail));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          employeeProfile = docSnap.data().data;
          detectedRole = "Employee"; // Employee email hole auto Employee role set hobe
        }
      });

      // Step C: Check if profile exists in signUpData
      const userSnap = await getDoc(doc(db, "signUpData", cleanEmail));
      let registeredData = userSnap.exists() ? userSnap.data().data : null;

      // If new Google user, save profile with detected role
      if (!registeredData) {
        registeredData = {
          name: user.displayName || "Google User",
          email: cleanEmail,
          role: detectedRole,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "signUpData", cleanEmail), { data: registeredData });
      } else {
        // If already registered, use saved role or update if employee profile found
        if (employeeProfile && registeredData.role !== "Employee" && registeredData.role !== "Admin") {
          registeredData.role = "Employee";
          await setDoc(doc(db, "signUpData", cleanEmail), { data: registeredData });
        }
        detectedRole = registeredData.role;
      }

      // Step D: Record Login activity
      const loginRef = doc(db, "loginData", cleanEmail);
      const loginPayload = {
        email: cleanEmail,
        uid: user.uid,
        loggedInAt: new Date().toISOString(),
        status: "Active",
        provider: "google.com",
      };
      await setDoc(loginRef, { data: loginPayload });

      const userPayload = {
        ...registeredData,
        email: cleanEmail,
        uid: user.uid,
        role: detectedRole,
        employeeProfile: employeeProfile,
      };

      localStorage.setItem("authUser", JSON.stringify(userPayload));
      return userPayload;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 4. Async Thunk: Reset Password Email Handler
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (email, { rejectWithValue }) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      await sendPasswordResetEmail(auth, cleanEmail);
      return "Password reset email sent! Please check your inbox or spam folder.";
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return rejectWithValue("No account found with this email address!");
      }
      return rejectWithValue(error.message);
    }
  }
);

// 5. Async Thunk: Firebase Logout Handler
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      localStorage.removeItem("authUser");
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: savedUser,
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearAuthMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign Up
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.isOwner) {
          state.user = action.payload.user;
        }
        state.successMessage = action.payload.message;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed!";
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.successMessage = "Login successful!";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed!";
      })

      // Google Login
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.successMessage = "Google Login successful!";
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Google Sign-In failed!";
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send reset email!";
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
        state.successMessage = null;
      });
  },
});

export const { clearAuthMessages } = authSlice.actions;
export default authSlice.reducer;