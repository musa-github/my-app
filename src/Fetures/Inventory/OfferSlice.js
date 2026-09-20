import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../Firebase/Firebase';

// Firebase Timestamp কে Serializable Plain Data (ISO String)-এ রূপান্তর করার হেল্পার ফাংশন
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [] : {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof Timestamp) {
        sanitized[key] = value.toDate().toISOString();
      } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};

// ১. Firestore-এর সকল offersList (Subcollection) থেকে সরাসরি Offer Fetch করা
export const fetchAllSavedOffers = createAsyncThunk(
  'offer/fetchAllSavedOffers',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collectionGroup(db, 'offersList'));
      const allOffers = [];

      querySnapshot.forEach((docSnap) => {
        const companyName = docSnap.ref.parent.parent ? docSnap.ref.parent.parent.id : 'Unknown_Company';
        const rawData = docSnap.data();

        allOffers.push({
          companyName,
          docId: docSnap.id,
          ...sanitizeData(rawData)
        });
      });

      return allOffers;
    } catch (error) {
      console.error("Error fetching saved offers:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ২. Offer Products লোড করা
export const fetchOfferProducts = createAsyncThunk(
  'offer/fetchOfferProducts',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'offerProducts'));
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...sanitizeData(doc.data()) });
      });
      return products;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ৩. Purchase Products লোড করা
export const fetchPurchaseProducts = createAsyncThunk(
  'offer/fetchPurchaseProducts',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'purchase'));
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...sanitizeData(doc.data()) });
      });
      return products;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ৪. Firebase-এ Offer সেভ করা
export const saveOfferToFirebase = createAsyncThunk(
  'offer/saveOfferToFirebase',
  async (offerData, { rejectWithValue }) => {
    try {
      const companyName = offerData.headerData?.toCompany || 'Unassigned_Company';
      const cleanCompanyName = companyName.trim().replace(/\s+/g, '_');

      const offersCollectionRef = collection(db, 'offer', cleanCompanyName, 'offersList');
      const newOfferRef = doc(offersCollectionRef);

      const dataToSave = {
        ...offerData,
        createdAt: new Date().toISOString()
      };

      await setDoc(newOfferRef, dataToSave);

      return { companyName: cleanCompanyName, id: newOfferRef.id, ...dataToSave };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ৫. Firebase-এ Offer আপডেট করা
export const updateOfferInFirebase = createAsyncThunk(
  'offer/updateOfferInFirebase',
  async ({ companyName, docId, offerPayload }, { rejectWithValue }) => {
    try {
      const offerDocRef = doc(db, 'offer', companyName, 'offersList', docId);

      const dataToUpdate = {
        ...offerPayload,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(offerDocRef, dataToUpdate);

      return { companyName, docId, offerPayload: dataToUpdate };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ৬. Firebase থেকে Offer ডিলিট করা
export const deleteOfferFromFirebase = createAsyncThunk(
  'offer/deleteOfferFromFirebase',
  async ({ companyName, docId }, { rejectWithValue }) => {
    try {
      const offerDocRef = doc(db, 'offer', companyName, 'offersList', docId);
      await deleteDoc(offerDocRef);

      return { companyName, docId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const offerSlice = createSlice({
  name: 'offer',
  initialState: {
    offerList: [],
    purchaseList: [],
    allSavedOffers: [],
    loading: false,
    isUpdating: false,
    isDeleting: false,
    savedOfferInfo: null,
    currentOfferData: null,
    error: null,
    successMessage: null
  },
  reducers: {
    clearOfferStatus: (state) => {
      state.loading = false;
      state.isUpdating = false;
      state.isDeleting = false;
      state.error = null;
      state.successMessage = null;
    },
    setSavedOfferInfo: (state, action) => {
      state.savedOfferInfo = action.payload;
    },
    setCurrentOfferData: (state, action) => {
      state.currentOfferData = action.payload;
    },
    resetFormState: (state) => {
      state.savedOfferInfo = null;
      state.currentOfferData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Saved Offers
      .addCase(fetchAllSavedOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSavedOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.allSavedOffers = action.payload;
      })
      .addCase(fetchAllSavedOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save Offer
      .addCase(saveOfferToFirebase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveOfferToFirebase.fulfilled, (state, action) => {
        state.loading = false;
        state.savedOfferInfo = action.payload;
        state.allSavedOffers.unshift(action.payload);
      })
      .addCase(saveOfferToFirebase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Offer
      .addCase(updateOfferInFirebase.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateOfferInFirebase.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.allSavedOffers.findIndex(
          (item) => item.docId === action.payload.docId && item.companyName === action.payload.companyName
        );
        if (index !== -1) {
          state.allSavedOffers[index] = {
            ...state.allSavedOffers[index],
            ...action.payload.offerPayload
          };
        }
      })
      .addCase(updateOfferInFirebase.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Delete Offer
      .addCase(deleteOfferFromFirebase.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteOfferFromFirebase.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.savedOfferInfo = null;
        state.currentOfferData = null;
        state.allSavedOffers = state.allSavedOffers.filter(
          (item) => !(item.docId === action.payload.docId && item.companyName === action.payload.companyName)
        );
      })
      .addCase(deleteOfferFromFirebase.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })

      // Fetch Offer Products
      .addCase(fetchOfferProducts.fulfilled, (state, action) => {
        state.offerList = action.payload;
      })

      // Fetch Purchase Products
      .addCase(fetchPurchaseProducts.fulfilled, (state, action) => {
        state.purchaseList = action.payload;
      });
  }
});

export const { clearOfferStatus, setSavedOfferInfo, setCurrentOfferData, resetFormState } = offerSlice.actions;
export default offerSlice.reducer;