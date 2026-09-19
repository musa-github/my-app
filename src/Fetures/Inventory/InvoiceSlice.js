import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from '../../Firebase/Firebase';

// -------------------------------------------------------------
// THUNKS
// -------------------------------------------------------------

// 1. Fetch Companies dynamically (Handles virtual/ghost parent documents)
export const fetchAllCompanies = createAsyncThunk(
  'invoice/fetchAllCompanies',
  async (filterMode, { rejectWithValue }) => {
    try {
      const companySet = new Map();

      // Helper function to extract company doc IDs from subcollections
      const extractFromSubcollection = async (subCollectionName) => {
        const querySnapshot = await getDocs(collectionGroup(db, subCollectionName));
        querySnapshot.forEach((docSnap) => {
          // docSnap.ref.parent.parent gives the company document
          const parentCompanyRef = docSnap.ref.parent.parent;
          if (parentCompanyRef) {
            const compId = parentCompanyRef.id;
            if (!companySet.has(compId)) {
              companySet.set(compId, {
                id: compId,
                displayName: compId.replace(/_/g, ' ')
              });
            }
          }
        });
      };

      if (filterMode === 'offer_based') {
        // Fetch companies that have 'offersList' or 'bill_lists'
        await extractFromSubcollection('offersList');
        await extractFromSubcollection('bill_lists');
      } else if (filterMode === 'general') {
        await extractFromSubcollection('bill_lists');
      } else {
        // 'all' mode
        await extractFromSubcollection('offersList');
        await extractFromSubcollection('bill_lists');
      }

      return Array.from(companySet.values());
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 2. Fetch Offers or Saved Bills by Company & Sub-Source
export const fetchOffersByCompany = createAsyncThunk(
  'invoice/fetchOffersByCompany',
  async ({ companyDocId, filterMode, subSourceFilter }, { rejectWithValue }) => {
    try {
      const offersList = [];

      // A. Raw Offers from 'offer' collection
      const fetchRawOffers = async () => {
        const offersRef = collection(db, 'offer', companyDocId, 'offersList');
        const snap = await getDocs(offersRef);
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const offerNo = data.headerData?.offerNo || docSnap.id;
          const subject = data.headerData?.subject || 'Offer';
          
          offersList.push({
            id: docSnap.id,
            displayLabel: `🏷️ ${offerNo} - ${subject}`,
            sourceType: 'offer',
            ...data
          });
        });
      };

      // B. Saved Offer Bills from 'bill' collection (createdType == "offer_based")
      const fetchSavedOfferBills = async () => {
        const billsRef = collection(db, 'bill', companyDocId, 'bill_lists');
        const q = query(billsRef, where('createdType', '==', 'offer_based'));
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          offersList.push({
            id: docSnap.id,
            displayLabel: `🧾 ${data.billNo || docSnap.id} - ${data.subject || 'Saved Bill'}`,
            sourceType: 'bill',
            ...data
          });
        });
      };

      // C. General Bills from 'bill' collection
      const fetchGeneralBills = async () => {
        const billsRef = collection(db, 'bill', companyDocId, 'bill_lists');
        const snap = await getDocs(billsRef);
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.createdType === 'General' || data.isBlankCreated === true) {
            offersList.push({
              id: docSnap.id,
              displayLabel: `📄 ${data.billNo || docSnap.id} - ${data.subject || 'General Bill'}`,
              sourceType: 'bill',
              ...data
            });
          }
        });
      };

      if (filterMode === 'offer_based') {
        if (subSourceFilter === 'offers_only') {
          await fetchRawOffers();
        } else if (subSourceFilter === 'bills_only') {
          await fetchSavedOfferBills();
        } else {
          await Promise.all([fetchRawOffers(), fetchSavedOfferBills()]);
        }
      } else if (filterMode === 'general') {
        await fetchGeneralBills();
      } else {
        await Promise.all([fetchRawOffers(), fetchSavedOfferBills(), fetchGeneralBills()]);
      }

      return offersList;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 3. Fetch Specific Offer or Bill Detail Data
export const fetchSpecificOfferFromDb = createAsyncThunk(
  'invoice/fetchSpecificOfferFromDb',
  async ({ companyDocId, offerId, sourceType }, { rejectWithValue }) => {
    try {
      let docRef;
      if (sourceType === 'bill') {
        docRef = doc(db, 'bill', companyDocId, 'bill_lists', offerId);
      } else {
        docRef = doc(db, 'offer', companyDocId, 'offersList', offerId);
      }

      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Target Document not found in Database!");
      }

      return {
        id: docSnap.id,
        sourceType,
        ...docSnap.data()
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 4. Save Bill to Firebase
export const saveBillToFirebase = createAsyncThunk(
  'invoice/saveBillToFirebase',
  async ({ companyDocId, billData }, { rejectWithValue }) => {
    try {
      const billId = billData.billNo || `INV-${Date.now()}`;
      const docRef = doc(db, 'bill', companyDocId, 'bill_lists', billId);
      
      const payload = {
        ...billData,
        id: billId,
        createdAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });

      return {
        billId,
        salesId: billId,
        billData: payload
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 5. Update Bill in Firebase
export const updateBillInFirebase = createAsyncThunk(
  'invoice/updateBillInFirebase',
  async ({ companyDocId, billId, billData }, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'bill', companyDocId, 'bill_lists', billId);
      
      const payload = {
        ...billData,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });

      return {
        billId,
        salesId: billId,
        billData: payload
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 6. Delete Bill from Firebase
export const deleteBillFromFirebase = createAsyncThunk(
  'invoice/deleteBillFromFirebase',
  async ({ companyDocId, billId }, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'bill', companyDocId, 'bill_lists', billId);
      await deleteDoc(docRef);
      return billId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// -------------------------------------------------------------
// SLICE
// -------------------------------------------------------------

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState: {
    companiesList: [],
    offersList: [],
    challanData: null,
    filterMode: 'all',
    subSourceFilter: 'offers_only',
    savedBillIds: null,
    loadingCompanies: false,
    loadingOffers: false,
    loadingChallan: false,
    savingBill: false,
    updatingBill: false,
    deletingBill: false,
    saveSuccess: false,
    updateSuccess: false,
    deleteSuccess: false,
    error: null
  },
  reducers: {
    setFilterMode: (state, action) => {
      state.filterMode = action.payload;
    },
    setSubSourceFilter: (state, action) => {
      state.subSourceFilter = action.payload;
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
      // Fetch All Companies
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
        state.error = action.payload;
      })

      // Fetch Offers By Company
      .addCase(fetchOffersByCompany.pending, (state) => {
        state.loadingOffers = true;
        state.offersList = [];
        state.error = null;
      })
      .addCase(fetchOffersByCompany.fulfilled, (state, action) => {
        state.loadingOffers = false;
        state.offersList = action.payload;
      })
      .addCase(fetchOffersByCompany.rejected, (state, action) => {
        state.loadingOffers = false;
        state.error = action.payload;
      })

      // Fetch Specific Offer
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
        state.error = action.payload;
      })

      // Save Bill
      .addCase(saveBillToFirebase.pending, (state) => {
        state.savingBill = true;
        state.saveSuccess = false;
      })
      .addCase(saveBillToFirebase.fulfilled, (state, action) => {
        state.savingBill = false;
        state.saveSuccess = true;
        state.savedBillIds = {
          billId: action.payload.billId,
          salesId: action.payload.salesId
        };
      })
      .addCase(saveBillToFirebase.rejected, (state, action) => {
        state.savingBill = false;
        state.error = action.payload;
      })

      // Update Bill
      .addCase(updateBillInFirebase.pending, (state) => {
        state.updatingBill = true;
        state.updateSuccess = false;
      })
      .addCase(updateBillInFirebase.fulfilled, (state) => {
        state.updatingBill = false;
        state.updateSuccess = true;
      })
      .addCase(updateBillInFirebase.rejected, (state, action) => {
        state.updatingBill = false;
        state.error = action.payload;
      })

      // Delete Bill
      .addCase(deleteBillFromFirebase.pending, (state) => {
        state.deletingBill = true;
        state.deleteSuccess = false;
      })
      .addCase(deleteBillFromFirebase.fulfilled, (state) => {
        state.deletingBill = false;
        state.deleteSuccess = true;
        state.challanData = null;
        state.savedBillIds = null;
      })
      .addCase(deleteBillFromFirebase.rejected, (state, action) => {
        state.deletingBill = false;
        state.error = action.payload;
      });
  }
});

export const {
  setFilterMode,
  setSubSourceFilter,
  resetInvoiceData,
  resetSaveStatus
} = invoiceSlice.actions;

export default invoiceSlice.reducer;