import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase/Firebase';

// Timestamp কনভার্ট করার হেলপার ফাংশন
const convertTimestamps = (data) => {
  const convertedData = { ...data };
  
  Object.keys(convertedData).forEach((key) => {
    const value = convertedData[key];
    
    if (value && typeof value.toDate === 'function') {
      convertedData[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      convertedData[key] = new Date(value.seconds * 1000).toISOString();
    }
  });

  return convertedData;
};

export const fetchTotalPurchase = createAsyncThunk(
  'totalPurchase/fetchTotalPurchase',
  async () => {
    // এখানে 'totalPurchase' এর জায়গায় 'purchase' কালেকশন নির্দেশ করা হলো
    const querySnapshot = await getDocs(collection(db, 'purchase'));
    const items = [];
    
    querySnapshot.forEach((doc) => {
      const rawData = doc.data();
      const safeData = convertTimestamps(rawData);

      items.push({
        id: doc.id,
        ...safeData,
      });
    });
    
    return items;
  }
);

const totalPurchaseSlice = createSlice({
  name: 'totalPurchase',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTotalPurchase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTotalPurchase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTotalPurchase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default totalPurchaseSlice.reducer;