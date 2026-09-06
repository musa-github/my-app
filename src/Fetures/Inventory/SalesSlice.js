
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase/Firebase'; // আপনার ফায়ারবেস কনফিগ পাথ

// ফায়ারবেসের 'salesList' (collection group) থেকে সমস্ত সেলস ডাটা ফেচ করার থাঙ্ক
export const fetchAllSalesData = createAsyncThunk(
  'sales/fetchAllSalesData',
  async (_, { rejectWithValue }) => {
    try {
      // collectionGroup ব্যবহার করে যেকোনো কোম্পানির ভেতরের 'salesList' থেকে ডাটা আনবে
      const querySnapshot = await getDocs(collectionGroup(db, 'salesList'));
      const allSales = [];

      querySnapshot.forEach((docSnap) => {
        allSales.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      return allSales;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState: {
    salesList: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSalesData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSalesData.fulfilled, (state, action) => {
        state.loading = false;
        state.salesList = action.payload; // ডাটা স্টোরে সেভ হচ্ছে
      })
      .addCase(fetchAllSalesData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default salesSlice.reducer;