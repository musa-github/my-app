import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../Firebase/Firebase";

const savedUser = JSON.parse(localStorage.getItem("authUser")) || null;
const OWNER_EMAIL = "osanlift@gmail.com";

// 1. Sign Up
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (signUpData, { rejectWithValue }) => {
    try {
      const cleanEmail = signUpData.email.trim().toLowerCase();

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

        const finalPayload = { ...userPayload, uid: user.uid };
        localStorage.setItem("authUser", JSON.stringify(finalPayload));
        return { isOwner: true, user: finalPayload, message: "Admin account created & logged in successfully!" };
      }

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

// 2. Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      const userSnap = await getDoc(doc(db, "signUpData", cleanEmail));
      const registeredData = userSnap.exists() ? userSnap.data().data : {};

      const userPayload = {
        ...registeredData,
        email: cleanEmail,
        uid: user.uid,
      };

      localStorage.setItem("authUser", JSON.stringify(userPayload));
      return userPayload;
    } catch (error) {
      return rejectWithValue("Invalid email/password or account not approved yet!");
    }
  }
);

// 3. Google Login
export const googleLoginUser = createAsyncThunk(
  "auth/googleLoginUser",
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const cleanEmail = user.email.trim().toLowerCase();

      const userPayload = {
        name: user.displayName || "Google User",
        email: cleanEmail,
        uid: user.uid,
        photoURL: user.photoURL,
        role: cleanEmail === OWNER_EMAIL ? "Admin" : "User",
      };

      await setDoc(doc(db, "signUpData", cleanEmail), { data: userPayload }, { merge: true });
      localStorage.setItem("authUser", JSON.stringify(userPayload));
      return userPayload;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 4. Reset Password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (email, { rejectWithValue }) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      await sendPasswordResetEmail(auth, cleanEmail);
      return `Password reset link sent to ${cleanEmail}. Please check your email inbox/spam folder.`;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 5. Logout
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
      // Register
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.isOwner) state.user = action.payload.user;
        state.successMessage = action.payload.message;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.successMessage = "Login successful!";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Google Login
      .addCase(googleLoginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(googleLoginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.successMessage = "Logged in with Google!";
      })
      .addCase(googleLoginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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