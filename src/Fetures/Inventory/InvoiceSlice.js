import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../Firebase/Firebase'; // আপনার প্রজেক্টের সঠিক পাথ অনুযায়ী এডজাস্ট করে নেবেন

// 1. Save or Upsert Bill to Firebase
export const saveBillToFirebase = createAsyncThunk(
  'invoice/saveBillToFirebase',
  async ({ companyDocId, billData, selectedOfferId }, { rejectWithValue }) => {
    try {
      const payloadWithTimestamp = {
        ...billData,
        updatedAt: new Date().toISOString()
      };

      // Offer ID থাকলে সেটাই Target ID হবে, না থাকলে billNo বা অটো-জেনারেটেড ID
      const targetDocId = selectedOfferId || billData.billNo || `INV-${Date.now().toString().slice(-6)}`;

      // Step 1: Parent Document নিশ্চিত করা
      await setDoc(doc(db, 'bill', companyDocId), { lastUpdated: new Date().toISOString() }, { merge: true });
      await setDoc(doc(db, 'sales', companyDocId), { lastUpdated: new Date().toISOString() }, { merge: true });

      // Step 2: 'bill' কালেকশনে ডাটা সেট/আপডেট করা
      const billDocRef = doc(db, 'bill', companyDocId, 'bill_lists', targetDocId);
      await setDoc(billDocRef, payloadWithTimestamp, { merge: true });

      // Step 3: 'sales' কালেকশনে ডাটা সেট/আপডেট করা
      const salesDocRef = doc(db, 'sales', companyDocId, 'salesList', targetDocId);
      await setDoc(salesDocRef, payloadWithTimestamp, { merge: true });

      return { 
        billId: targetDocId, 
        salesId: targetDocId, 
        ...billData 
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 2. Update Bill in Firebase
export const updateBillInFirebase = createAsyncThunk(
  'invoice/updateBill',
  async ({ companyDocId, billId, salesId, billData }, { rejectWithValue }) => {
    try {
      const targetDocId = billId || salesId;

      if (!targetDocId) {
        throw new Error("Target Document ID missing for update.");
      }

      const payloadWithTimestamp = {
        ...billData,
        updatedAt: new Date().toISOString()
      };

      // Parent Docs Ensure
      await setDoc(doc(db, 'bill', companyDocId), { lastUpdated: new Date().toISOString() }, { merge: true });
      await setDoc(doc(db, 'sales', companyDocId), { lastUpdated: new Date().toISOString() }, { merge: true });

      // bill_lists এবং salesList এ আপডেট
      const billRef = doc(db, 'bill', companyDocId, 'bill_lists', targetDocId);
      await setDoc(billRef, payloadWithTimestamp, { merge: true });

      const salesRef = doc(db, 'sales', companyDocId, 'salesList', targetDocId);
      await setDoc(salesRef, payloadWithTimestamp, { merge: true });

      return { billId: targetDocId, salesId: targetDocId, billData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 3. Delete Bill from Firebase
export const deleteBillFromFirebase = createAsyncThunk(
  'invoice/deleteBillFromFirebase',
  async ({ companyDocId, billId, salesId }, { rejectWithValue }) => {
    try {
      const targetDocId = billId || salesId;

      if (!targetDocId) {
        throw new Error("Target Document ID missing for delete.");
      }

      // bill_lists থেকে ডিলিট
      const billRef = doc(db, 'bill', companyDocId, 'bill_lists', targetDocId);
      await deleteDoc(billRef);

      // salesList থেকে ডিলিট
      const salesRef = doc(db, 'sales', companyDocId, 'salesList', targetDocId);
      await deleteDoc(salesRef);

      return { billId: targetDocId, salesId: targetDocId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState: {
    savingBill: false,
    updatingBill: false,
    deletingBill: false,
    saveSuccess: false,
    updateSuccess: false,
    deleteSuccess: false,
    savedBillIds: null,
    savedInvoice: null,
    error: null,
  },
  reducers: {
    resetSaveStatus: (state) => {
      state.savingBill = false;
      state.updatingBill = false;
      state.deletingBill = false;
      state.saveSuccess = false;
      state.updateSuccess = false;
      state.deleteSuccess = false;
      state.error = null;
    },
    resetInvoiceData: (state) => {
      state.savingBill = false;
      state.updatingBill = false;
      state.deletingBill = false;
      state.saveSuccess = false;
      state.updateSuccess = false;
      state.deleteSuccess = false;
      state.savedBillIds = null;
      state.savedInvoice = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Save Bill
      .addCase(saveBillToFirebase.pending, (state) => {
        state.savingBill = true;
        state.error = null;
        state.saveSuccess = false;
      })
      .addCase(saveBillToFirebase.fulfilled, (state, action) => {
        state.savingBill = false;
        state.saveSuccess = true;
        state.savedInvoice = action.payload;
        state.savedBillIds = {
          billId: action.payload.billId,
          salesId: action.payload.salesId,
        };
      })
      .addCase(saveBillToFirebase.rejected, (state, action) => {
        state.savingBill = false;
        state.error = action.payload;
      })

      // Update Bill
      .addCase(updateBillInFirebase.pending, (state) => {
        state.updatingBill = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateBillInFirebase.fulfilled, (state, action) => {
        state.updatingBill = false;
        state.updateSuccess = true;
        state.savedInvoice = action.payload;
      })
      .addCase(updateBillInFirebase.rejected, (state, action) => {
        state.updatingBill = false;
        state.error = action.payload;
      })

      // Delete Bill
      .addCase(deleteBillFromFirebase.pending, (state) => {
        state.deletingBill = true;
        state.error = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteBillFromFirebase.fulfilled, (state) => {
        state.deletingBill = false;
        state.deleteSuccess = true;
        state.savedBillIds = null;
        state.savedInvoice = null;
      })
      .addCase(deleteBillFromFirebase.rejected, (state, action) => {
        state.deletingBill = false;
        state.error = action.payload;
      });
  },
});

export const { resetSaveStatus, resetInvoiceData } = invoiceSlice.actions;
export default invoiceSlice.reducer;