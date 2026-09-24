import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "../../Firebase/Firebase";

const savedUser = JSON.parse(localStorage.getItem("authUser")) || null;

// ওনার বা এডমিনের ইমেইল
const OWNER_EMAIL = "osanlift@gmail.com";

// ১. Async Thunk: Sign Up Request Handler
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (signUpData, { rejectWithValue }) => {
    try {
      const cleanEmail = signUpData.email.trim().toLowerCase();

      // ** যদি ওনার বা এডমিন অ্যাকাউন্ট ক্রিয়েট করে **
      if (cleanEmail === OWNER_EMAIL) {
        // ১. সরাসরি Firebase Auth এ অ্যাকাউন্ট তৈরি
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          signUpData.password
        );
        const user = userCredential.user;

        // ২. signUpData কালেকশনে ইউজারের প্রোফাইল ডাটা সেভ
        const userPayload = {
          name: signUpData.name,
          email: cleanEmail,
          role: "Admin",
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "signUpData", cleanEmail), { data: userPayload });

        // ৩. সরাসরি অটো-লগইন প্রোফাইল রিটার্ন
        const finalPayload = {
          ...userPayload,
          uid: user.uid,
        };

        localStorage.setItem("authUser", JSON.stringify(finalPayload));
        return { isOwner: true, user: finalPayload, message: "Admin account created & logged in successfully!" };
      }

      // ** সাধারণ ইউজারদের জন্য (অ্যাপ্রুভাল প্রসেস) **
      const pendingRef = doc(db, "pendingRequests", cleanEmail);
      const pendingSnap = await getDoc(pendingRef);

      if (pendingSnap.exists()) {
        return rejectWithValue("An approval request is already pending for this email!");
      }

      const pendingPayload = {
        name: signUpData.name,
        email: cleanEmail,
        password: signUpData.password,
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
        if (action.payload.isOwner) {
          state.user = action.payload.user; // ওনার হলে স্টেট-এ সরাসরি সেভ হবে
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