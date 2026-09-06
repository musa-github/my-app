import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, collectionGroup, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase/Firebase';

// Unique Challan Number Generator
const generateUniqueChallanNo = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CH-${dateStr}-${randomNum}`;
};

// ১. সকল Company Name ফেচ করার জন্য Collection Group Query
export const fetchAllCompanies = createAsyncThunk(
  'challan/fetchAllCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collectionGroup(db, 'offersList'));
      const companySet = new Set();

      querySnapshot.forEach((docSnap) => {
        if (docSnap.ref.parent && docSnap.ref.parent.parent) {
          companySet.add(docSnap.ref.parent.parent.id);
        }
      });

      const companies = Array.from(companySet).map((companyId) => ({
        id: companyId,
        displayName: companyId.replace(/_/g, ' ')
      }));

      return companies;
    } catch (error) {
      return rejectWithValue("Failed to load companies: " + error.message);
    }
  }
);

// ২. সিলেক্টেড কোম্পানির সকল Offer ID ও Metadata ফেচ করা (FIXED)
export const fetchOffersByCompany = createAsyncThunk(
  'challan/fetchOffersByCompany',
  async (companyDocId, { rejectWithValue }) => {
    try {
      if (!companyDocId) return [];

      const offersSubCollectionRef = collection(db, 'offer', companyDocId, 'offersList');
      const querySnapshot = await getDocs(offersSubCollectionRef);

      const offerList = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        offerList.push({
          id: docSnap.id,
          docId: docSnap.id,
          offerNo: data.offerNo || data.headerData?.offerNo || docSnap.id,
          subject: data.headerData?.subject || data.subject || 'No Subject',
          date: data.headerData?.date || data.date || 'No Date',
          ...data
        });
      });
      return offerList;
    } catch (error) {
      return rejectWithValue("Failed to load offers: " + error.message);
    }
  }
);

// ৩. চালানের জন্য স্পেসিফিক ডাটা ফেচ (Price ছাড়া)
export const fetchSpecificOfferForChallan = createAsyncThunk(
  'challan/fetchSpecificOfferForChallan',
  async ({ companyDocId, offerId }, { rejectWithValue }) => {
    try {
      const offerDocRef = doc(db, 'offer', companyDocId, 'offersList', offerId);
      const docSnap = await getDoc(offerDocRef);

      if (!docSnap.exists()) {
        throw new Error("Offer document not found!");
      }

      const rawData = docSnap.data();

      const itemsSource = rawData.items || rawData.products || [];
      const filteredItems = itemsSource.map((item) => ({
        name: item.name || item.itemName || item.description || '',
        quantity: item.quantity || item.qty || 1,
        unit: item.unit || 'Pcs'
      }));

      return {
        challanNo: generateUniqueChallanNo(),
        date: new Date().toLocaleDateString('en-GB'),
        toCompany: rawData.headerData?.toCompany || rawData.toCompany || companyDocId.replace(/_/g, ' '),
        address: rawData.headerData?.address || rawData.address || '',
        subject: rawData.headerData?.subject ? `Delivery Challan for ${rawData.headerData.subject}` : 'Delivery Challan',
        items: filteredItems
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ৪. ইনভয়েসের জন্য ডাটা ফেচ (FIXED)
export const fetchSpecificOfferFromDb = createAsyncThunk(
  'challan/fetchSpecificOfferFromDb',
  async ({ companyDocId, offerId }, { rejectWithValue }) => {
    try {
      // Step A: 'bill' কালেকশনে চেক
      const billDocRef = doc(db, 'bill', companyDocId, 'bill_lists', offerId);
      const billSnap = await getDoc(billDocRef);

      if (billSnap.exists()) {
        const billData = billSnap.data();
        return {
          id: billSnap.id,
          docId: billSnap.id,
          salesId: billData.salesId || billSnap.id,
          isFromBill: true,
          offerNo: billData.billNo || billSnap.id,
          date: billData.date || new Date().toLocaleDateString('en-GB'),
          toCompany: billData.companyName || billData.toCompany || companyDocId.replace(/_/g, ' '),
          address: billData.address || '',
          subject: billData.subject || 'Bill / Invoice Statement',
          items: billData.items || billData.products || [],
          paidAmount: billData.paidAmount || 0,
          dueAmount: billData.dueAmount || 0,
          notes: billData.notes || null,
          paymentMode: billData.paymentMode || null
        };
      }

      // Step B: মূল 'offer' কালেকশন থেকে ফেচ
      const offerDocRef = doc(db, 'offer', companyDocId, 'offersList', offerId);
      const docSnap = await getDoc(offerDocRef);

      if (!docSnap.exists()) {
        throw new Error("Neither Bill nor Offer document found!");
      }

      const rawData = docSnap.data();

      return {
        id: docSnap.id,
        docId: docSnap.id,
        isFromBill: false,
        offerNo: rawData.offerNo || rawData.headerData?.offerNo || docSnap.id,
        date: rawData.headerData?.date || rawData.date || new Date().toLocaleDateString('en-GB'),
        toCompany: rawData.headerData?.toCompany || rawData.toCompany || companyDocId.replace(/_/g, ' '),
        address: rawData.headerData?.address || rawData.address || '',
        subject: rawData.headerData?.subject || rawData.subject || 'Bill / Invoice Statement',
        items: rawData.items || rawData.products || []
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const challanSlice = createSlice({
  name: 'challan',
  initialState: {
    companiesList: [],
    offersList: [],
    challanData: null,
    loadingCompanies: false,
    loadingOffers: false,
    loadingChallan: false,
    error: null
  },
  reducers: {
    clearOffersList: (state) => {
      state.offersList = [];
      state.challanData = null;
    },
    createCustomChallan: (state, action) => {
      const customInfo = action.payload || {};
      state.challanData = {
        challanNo: generateUniqueChallanNo(),
        date: customInfo.date || new Date().toLocaleDateString('en-GB'),
        toCompany: customInfo.toCompany || 'Client / Company Name',
        address: customInfo.address || 'Address Details',
        subject: customInfo.subject || 'Delivery Challan',
        items: customInfo.items || [
          { name: 'Sample Item Name', quantity: 1, unit: 'Pcs' }
        ]
      };
    },
    resetChallan: (state) => {
      state.offersList = [];
      state.challanData = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Companies
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

      // Offers List
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
        state.error = action.payload;
      })

      // Specific Challan Data
      .addCase(fetchSpecificOfferForChallan.pending, (state) => {
        state.loadingChallan = true;
        state.error = null;
      })
      .addCase(fetchSpecificOfferForChallan.fulfilled, (state, action) => {
        state.loadingChallan = false;
        state.challanData = action.payload;
      })
      .addCase(fetchSpecificOfferForChallan.rejected, (state, action) => {
        state.loadingChallan = false;
        state.error = action.payload;
        state.challanData = null;
      })

      // Specific Offer / Bill Data for Invoice
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
        state.challanData = null;
      });
  }
});

export const { clearOffersList, createCustomChallan, resetChallan } = challanSlice.actions;
export default challanSlice.reducer;