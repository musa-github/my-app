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

// Fetch Total Purchase Items
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

// Update Purchase Item in Firestore & Redux State
export const updatePurchaseItem = createAsyncThunk(
  'totalPurchase/updatePurchaseItem',
  async ({ id, updatedFields }) => {
    if (id) {
      const docRef = doc(db, 'purchase', id);
      await updateDoc(docRef, updatedFields);
    }
    return { id, updatedFields };
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
      // Fetch Handlers
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
      // Update Handlers
      .addCase(updatePurchaseItem.fulfilled, (state, action) => {
        const { id, updatedFields } = action.payload;
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedFields };
        }
      });
  },
});

export default totalPurchaseSlice.reducer;