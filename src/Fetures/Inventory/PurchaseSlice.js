import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../Firebase/Firebase';

// ১. Async Thunk: ফায়ারবেসে ডাটা পাঠানো এবং কোয়ান্টিটি যোগ করার লজিক
export const savePurchaseData = createAsyncThunk(
  'purchase/savePurchaseData',
  async (items, { rejectWithValue }) => {
    try {
      const purchaseRef = collection(db, "purchase");

      for (const item of items) {
        if (!item.ItemsName.trim()) continue;

        const itemId = item.ItemsName.trim().toLowerCase();
        const itemDocRef = doc(purchaseRef, itemId);
        const docSnap = await getDoc(itemDocRef);

        const currentQty = parseFloat(item.QTY) || 0;
        const currentUnitPrice = parseFloat(item.UnitPrice) || 0;
        const currentSalingPrice = parseFloat(item.SalingPrice) || 0;
        const currentTotalPrice = parseFloat(item.TotalPrice) || (currentQty * currentUnitPrice);

        if (docSnap.exists()) {
          const existingData = docSnap.data();
          const newQty = (parseFloat(existingData.QTY) || 0) + currentQty;
          const newTotalPrice = (parseFloat(existingData.TotalPrice) || 0) + currentTotalPrice;

          await updateDoc(itemDocRef, {
            QTY: newQty,
            UnitPrice: currentUnitPrice,
            SalingPrice: currentSalingPrice,
            TotalPrice: newTotalPrice.toFixed(2),
            updatedAt: new Date()
          });
        } else {
          await setDoc(itemDocRef, {
            ItemsName: item.ItemsName.trim(),
            QTY: currentQty,
            UnitPrice: currentUnitPrice,
            SalingPrice: currentSalingPrice,
            TotalPrice: currentTotalPrice.toFixed(2),
            createdAt: new Date()
          });
        }
      }

      return items; // সফল হলে ডাটা পেলোড হিসেবে পাঠাবে
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ২. Purchase Slice
const purchaseSlice = createSlice({
  name: 'purchase',
  initialState: {
    loading: false,
    error: null,
    successMessage: false
  },
  reducers: {
    clearStatus: (state) => {
      state.error = null;
      state.successMessage = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(savePurchaseData.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = false;
      })
      .addCase(savePurchaseData.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = true;
      })
      .addCase(savePurchaseData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearStatus } = purchaseSlice.actions;
export default purchaseSlice.reducer;