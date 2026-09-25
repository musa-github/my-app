import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
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
    const querySnapshot = await getDocs(collection(db, 'purchase'));
    const items = [];
    
    querySnapshot.forEach((docSnap) => {
      const rawData = docSnap.data();
      const safeData = convertTimestamps(rawData);

      items.push({
        id: docSnap.id,
        ...safeData,
      });
    });
    
    return items;
  }
);

// Data Edit/Update Thunk
export const updatePurchaseItem = createAsyncThunk(
  'totalPurchase/updatePurchaseItem',
  async ({ id, updatedData }) => {
    const docRef = doc(db, 'purchase', id);
    await updateDoc(docRef, updatedData);
    return { id, updatedData };
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
      // Fetch Reducers
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
      })
      // Update Reducers
      .addCase(updatePurchaseItem.fulfilled, (state, action) => {
        const { id, updatedData } = action.payload;
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedData };
        }
      });
  },
});

export default totalPurchaseSlice.reducer;