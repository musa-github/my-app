import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../Firebase/Firebase';

// ১. Filter Mode অনুযায়ী সমস্ত কোম্পানির তালিকা ফেচ করা
export const fetchAllCompanies = createAsyncThunk(
  'invoice/fetchAllCompanies',
  async (filterMode = 'all') => {
    const companiesMap = new Map();

    if (filterMode === 'all' || filterMode === 'offer') {
      const offerCompaniesSnap = await getDocs(collection(db, 'offer'));
      offerCompaniesSnap.forEach((docSnap) => {
        companiesMap.set(docSnap.id, { id: docSnap.id, displayName: docSnap.id.replace(/_/g, ' ') });
      });
    }

    if (filterMode === 'all' || filterMode === 'bill') {
      const billCompaniesSnap = await getDocs(collection(db, 'bill'));
      billCompaniesSnap.forEach((docSnap) => {
        companiesMap.set(docSnap.id, { id: docSnap.id, displayName: docSnap.id.replace(/_/g, ' ') });
      });
    }

    return Array.from(companiesMap.values());
  }
);

// ২. Filter Mode অনুযায়ী নির্দিষ্ট কোম্পানির Offer/Bill এর ড্রপডাউন অপশন ফেচ করা
export const fetchOffersByCompany = createAsyncThunk(
  'invoice/fetchOffersByCompany',
  async ({ companyDocId, filterMode = 'all' }) => {
    let itemsList = [];

    // All Data: Offer এবং Bill উভয় কালেকশন থেকেই ডাটা আনবে
    if (filterMode === 'all') {
      const offersRef = collection(db, 'offer', companyDocId, 'offersList');
      const offersSnap = await getDocs(offersRef);
      offersSnap.forEach((docSnap) => {
        itemsList.push({
          id: docSnap.id,
          displayLabel: `🏷️ Offer: ${docSnap.id}`,
          sourceType: 'offer',
          ...docSnap.data()
        });
      });

      const billsRef = collection(db, 'bill', companyDocId, 'bill_lists');
      const billsSnap = await getDocs(billsRef);
      billsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        itemsList.push({
          id: docSnap.id,
          displayLabel: `🧾 Bill: ${data.billNo || docSnap.id}`,
          sourceType: 'bill',
          ...data
        });
      });
    }

    // Offer Only: শুধু offer কালেকশন আনবে
    else if (filterMode === 'offer') {
      const offersRef = collection(db, 'offer', companyDocId, 'offersList');
      const offersSnap = await getDocs(offersRef);
      offersSnap.forEach((docSnap) => {
        itemsList.push({
          id: docSnap.id,
          displayLabel: `🏷️ Offer: ${docSnap.id}`,
          sourceType: 'offer',
          ...docSnap.data()
        });
      });
    }

    // Bills Only: শুধুমাত্র Create Blank এর মাধ্যমে তৈরি হওয়া বিল ফেচ করবে
    else if (filterMode === 'bill') {
      const billsRef = collection(db, 'bill', companyDocId, 'bill_lists');
      const billsSnap = await getDocs(billsRef);
      billsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isBlankCreated || data.sourceType === 'blank' || !data.offerId) {
          itemsList.push({
            id: docSnap.id,
            displayLabel: `🧾 Blank Bill: ${data.billNo || docSnap.id}`,
            sourceType: 'bill',
            ...data
          });
        }
      });
    }

    return itemsList;
  }
);

// ৩. নির্দিষ্ট ড্রপডাউন আইটেমের বিস্তারিত আনবে এবং Offer-এর ক্ষেত্রে সম্পর্কিত Bill ম্যাচ করবে
export const fetchSpecificOfferFromDb = createAsyncThunk(
  'invoice/fetchSpecificOfferFromDb',
  async ({ companyDocId, offerId, filterMode = 'offer' }) => {
    // যদি Bills Only সিলেক্টেড থাকে
    if (filterMode === 'bill') {
      const billRef = doc(db, 'bill', companyDocId, 'bill_lists', offerId);
      const billSnap = await getDoc(billRef);
      if (billSnap.exists()) {
        return { id: billSnap.id, sourceType: 'bill', ...billSnap.data() };
      }
    }

    // যদি Offers Only বা All Data সিলেক্টেড থাকে
    if (filterMode === 'offer' || filterMode === 'all') {
      const offerRef = doc(db, 'offer', companyDocId, 'offersList', offerId);
      const offerSnap = await getDoc(offerRef);

      if (offerSnap.exists()) {
        const offerData = offerSnap.data();

        // bill_lists এ এই অফারের সাথে মিল থাকা কোন বিল আছে কিনা তা দেখা
        const matchingBillRef = doc(db, 'bill', companyDocId, 'bill_lists', offerId);
        const matchingBillSnap = await getDoc(matchingBillRef);

        let mergedBillData = null;
        if (matchingBillSnap.exists()) {
          mergedBillData = matchingBillSnap.data();
        }

        return {
          id: offerSnap.id,
          sourceType: 'offer',
          ...offerData,
          matchedBill: mergedBillData ? { id: matchingBillSnap.id, ...mergedBillData } : null
        };
      }
    }

    // সরাসরি fallback ফিল্টারিং
    const fallbackBillRef = doc(db, 'bill', companyDocId, 'bill_lists', offerId);
    const fallbackBillSnap = await getDoc(fallbackBillRef);
    if (fallbackBillSnap.exists()) {
      return { id: fallbackBillSnap.id, sourceType: 'bill', ...fallbackBillSnap.data() };
    }

    throw new Error('No matching record found in Firestore.');
  }
);

// ৪. নতুন তৈরি করা বিল সেভ করা
export const saveBillToFirebase = createAsyncThunk(
  'invoice/saveBillToFirebase',
  async ({ companyDocId, billData }) => {
    const docId = billData.billNo || `INV-${Date.now().toString().slice(-6)}`;
    const billDocRef = doc(db, 'bill', companyDocId, 'bill_lists', docId);
    const parentCompanyRef = doc(db, 'bill', companyDocId);

    await setDoc(parentCompanyRef, { lastUpdated: new Date().toISOString() }, { merge: true });
    await setDoc(billDocRef, { ...billData, isBlankCreated: billData.isBlankCreated ?? true });

    return { billId: docId, companyDocId };
  }
);

// ৫. বিল আপডেট করা
export const updateBillInFirebase = createAsyncThunk(
  'invoice/updateBillInFirebase',
  async ({ companyDocId, billId, billData }) => {
    const billDocRef = doc(db, 'bill', companyDocId, 'bill_lists', billId);
    await updateDoc(billDocRef, billData);
    return { billId, companyDocId };
  }
);

// ৬. বিল ডিলিট করা
export const deleteBillFromFirebase = createAsyncThunk(
  'invoice/deleteBillFromFirebase',
  async ({ companyDocId, billId }) => {
    const billDocRef = doc(db, 'bill', companyDocId, 'bill_lists', billId);
    await deleteDoc(billDocRef);
    return { billId };
  }
);

const initialState = {
  companiesList: [],
  offersList: [],
  challanData: null,
  loadingCompanies: false,
  loadingOffers: false,
  loadingChallan: false,
  savingBill: false,
  updatingBill: false,
  deletingBill: false,
  saveSuccess: false,
  updateSuccess: false,
  deleteSuccess: false,
  savedBillIds: null,
  filterMode: 'all',
  error: null
};

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setFilterMode: (state, action) => {
      state.filterMode = action.payload;
    },
    resetInvoiceData: (state) => {
      state.challanData = null;
      state.savedBillIds = null;
      state.error = null;
    },
    resetSaveStatus: (state) => {
      state.saveSuccess = false;
      state.updateSuccess = false;
      state.deleteSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Companies
      .addCase(fetchAllCompanies.pending, (state) => {
        state.loadingCompanies = true;
        state.error = null;
      })
      .addCase(fetchAllCompanies.fulfilled, (state, action) => {
        state.loadingCompanies = false;
        state.companiesList = action.payload;
      })
      .addCase(fetchAllCompanies.rejected, (state, action) => {
        state.loadingCompanies = false;
        state.error = action.error.message;
      })

      // Fetch Offers By Company
      .addCase(fetchOffersByCompany.pending, (state) => {
        state.loadingOffers = true;
        state.error = null;
      })
      .addCase(fetchOffersByCompany.fulfilled, (state, action) => {
        state.loadingOffers = false;
        state.offersList = action.payload;
      })
      .addCase(fetchOffersByCompany.rejected, (state, action) => {
        state.loadingOffers = false;
        state.error = action.error.message;
      })

      // Fetch Specific Details
      .addCase(fetchSpecificOfferFromDb.pending, (state) => {
        state.loadingChallan = true;
        state.error = null;
      })
      .addCase(fetchSpecificOfferFromDb.fulfilled, (state, action) => {
        state.loadingChallan = false;
        state.challanData = action.payload;
      })
      .addCase(fetchSpecificOfferFromDb.rejected, (state, action) => {
        state.loadingChallan = false;
        state.error = action.error.message;
      })

      // Save Bill
      .addCase(saveBillToFirebase.pending, (state) => {
        state.savingBill = true;
      })
      .addCase(saveBillToFirebase.fulfilled, (state, action) => {
        state.savingBill = false;
        state.saveSuccess = true;
        state.savedBillIds = action.payload;
      })
      .addCase(saveBillToFirebase.rejected, (state, action) => {
        state.savingBill = false;
        state.error = action.error.message;
      })

      // Update Bill
      .addCase(updateBillInFirebase.pending, (state) => {
        state.updatingBill = true;
      })
      .addCase(updateBillInFirebase.fulfilled, (state, action) => {
        state.updatingBill = false;
        state.updateSuccess = true;
        state.savedBillIds = action.payload;
      })
      .addCase(updateBillInFirebase.rejected, (state, action) => {
        state.updatingBill = false;
        state.error = action.error.message;
      })

      // Delete Bill
      .addCase(deleteBillFromFirebase.pending, (state) => {
        state.deletingBill = true;
      })
      .addCase(deleteBillFromFirebase.fulfilled, (state) => {
        state.deletingBill = false;
        state.deleteSuccess = true;
        state.savedBillIds = null;
        state.challanData = null;
      })
      .addCase(deleteBillFromFirebase.rejected, (state, action) => {
        state.deletingBill = false;
        state.error = action.error.message;
      });
  }
});

export const { setFilterMode, resetInvoiceData, resetSaveStatus } = invoiceSlice.actions;
export default invoiceSlice.reducer;