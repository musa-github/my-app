import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "../../Firebase/Firebase";

const savedUser = JSON.parse(localStorage.getItem("authUser")) || null;

// ১. Async Thunk: Sign Up Request Handler (Admin Approval এর জন্য)
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (signUpData, { rejectWithValue }) => {
    try {
      const cleanEmail = signUpData.email.trim().toLowerCase();

      // একই ইমেইল দিয়ে আগের কোনো পেন্ডিং রিকোয়েস্ট আছে কিনা চেক করা
      const pendingRef = doc(db, "pendingRequests", cleanEmail);
      const pendingSnap = await getDoc(pendingRef);

      if (pendingSnap.exists()) {
        return rejectWithValue("An approval request is already pending for this email!");
      }

      // Firestore-এর pendingRequests কালেকশনে সেভ রাখা
      const pendingPayload = {
        name: signUpData.name,
        email: cleanEmail,
        password: signUpData.password, // এডমিন এপ্রুভালের পর Firebase Auth-এ ইউজার বানাতে লাগবে
        status: "Pending",
        requestedAt: new Date().toISOString(),
      };

      await setDoc(pendingRef, { data: pendingPayload });

      return "Signup request sent successfully! Waiting for admin approval.";
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ২. Async Thunk: Firebase Login Handler
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Firebase Auth সাইন ইন
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // loginData কালেকশনে স্টেটাস আপডেট
      const loginRef = doc(db, "loginData", cleanEmail);
      const loginPayload = {
        email: cleanEmail,
        uid: user.uid,
        loggedInAt: new Date().toISOString(),
        status: "Active",
      };
      await setDoc(loginRef, { data: loginPayload });

      // signUpData কালেকশন থেকে প্রোফাইল ডাটা রিড করা
      const userSnap = await getDoc(doc(db, "signUpData", cleanEmail));
      const registeredData = userSnap.exists() ? userSnap.data().data : {};

      // employees কালেকশন থেকে Profile ম্যাচ করা
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

// ৩. Async Thunk: Firebase Logout Handler
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
        state.successMessage = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration request failed!";
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