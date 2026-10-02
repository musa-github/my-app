import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../Firebase/Firebase";

// 1. Fetch Technical Support Requests (Filters out expired >10 days requests)
export const fetchSupportRequests = createAsyncThunk(
  "technicalSupport/fetchRequests",
  async (_, { rejectWithValue }) => {
    try {
      const snap = await getDocs(collection(db, "technicalSupportRequests"));
      const list = [];
      const now = new Date();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        let isExpired = false;

        // Auto-filter requests older than 10 days on client side
        if (data.expiresAt) {
          const expireTime = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
          if (now > expireTime) {
            isExpired = true;
          }
        }

        if (!isExpired) {
          list.push({ id: docSnap.id, ...data });
        }
      });

      return list;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 2. Save Admin Response & Items to Request ID
export const saveSupportResponse = createAsyncThunk(
  "technicalSupport/saveResponse",
  async ({ requestId, adminResponse, status }, { rejectWithValue }) => {
    try {
      const docRef = doc(db, "technicalSupportRequests", requestId);
      const updateData = {
        adminResponse: {
          problemNotes: adminResponse.problemNotes || "",
          partsList: adminResponse.partsList || [],
          totalAmount: adminResponse.totalAmount || 0,
          updatedAt: new Date().toISOString(),
          respondedBy: adminResponse.respondedBy || "Admin",
        },
        status: status || "Processed",
      };

      await updateDoc(docRef, updateData);
      return { requestId, adminResponse: updateData.adminResponse, status: updateData.status };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const technicalSupportSlice = createSlice({
  name: "technicalSupport",
  initialState: {
    requests: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Requests
      .addCase(fetchSupportRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSupportRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchSupportRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save Response
      .addCase(saveSupportResponse.fulfilled, (state, action) => {
        const { requestId, adminResponse, status } = action.payload;
        const existing = state.requests.find((r) => r.id === requestId);
        if (existing) {
          existing.adminResponse = adminResponse;
          existing.status = status;
        }
      });
  },
});

export default technicalSupportSlice.reducer;