import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { collection, collectionGroup, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../../Firebase/Firebase';



// ১. Firestore-এর সকল offersList (Subcollection) থেকে সরাসরি Offer Fetch করা

export const fetchAllSavedOffers = createAsyncThunk(

  'offer/fetchAllSavedOffers',

  async (_, { rejectWithValue }) => {

    try {

      const querySnapshot = await getDocs(collectionGroup(db, 'offersList'));

      const allOffers = [];



      querySnapshot.forEach((docSnap) => {

        const companyName = docSnap.ref.parent.parent ? docSnap.ref.parent.parent.id : 'Unknown_Company';

       

        allOffers.push({

          companyName,

          docId: docSnap.id,

          ...docSnap.data()

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

        products.push({ id: doc.id, ...doc.data() });

      });

      return products;

    } catch (error) {

      return rejectWithValue(error.message);

    }

  }

);



// ৩. Purchase Products লোড করা (FIXED: 'purchaseProducts' এর জায়গায় 'purchase' কালেকশন নাম দেওয়া হয়েছে)

export const fetchPurchaseProducts = createAsyncThunk(

  'offer/fetchPurchaseProducts',

  async (_, { rejectWithValue }) => {

    try {

      const querySnapshot = await getDocs(collection(db, 'purchase'));

      const products = [];

      querySnapshot.forEach((doc) => {

        products.push({ id: doc.id, ...doc.data() });

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



      return { companyName: cleanCompanyName, id: newOfferRef.id };

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



      return { companyName, docId };

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

    resetFormState: (state) => {

      state.savedOfferInfo = null;

      state.currentOfferData = null;

    }

  },

  extraReducers: (builder) => {

    builder

      .addCase(fetchAllSavedOffers.fulfilled, (state, action) => {

        state.allSavedOffers = action.payload;

      })

      .addCase(saveOfferToFirebase.pending, (state) => {

        state.loading = true;

        state.error = null;

      })

      .addCase(saveOfferToFirebase.fulfilled, (state, action) => {

        state.loading = false;

        state.savedOfferInfo = action.payload;

      })

      .addCase(saveOfferToFirebase.rejected, (state, action) => {

        state.loading = false;

        state.error = action.payload;

      })

      .addCase(updateOfferInFirebase.pending, (state) => {

        state.isUpdating = true;

        state.error = null;

      })

      .addCase(updateOfferInFirebase.fulfilled, (state) => {

        state.isUpdating = false;

      })

      .addCase(updateOfferInFirebase.rejected, (state, action) => {

        state.isUpdating = false;

        state.error = action.payload;

      })

      .addCase(deleteOfferFromFirebase.pending, (state) => {

        state.isDeleting = true;

        state.error = null;

      })

      .addCase(deleteOfferFromFirebase.fulfilled, (state) => {

        state.isDeleting = false;

        state.savedOfferInfo = null;

      state.currentOfferData = null;

      })

      .addCase(deleteOfferFromFirebase.rejected, (state, action) => {

        state.isDeleting = false;

        state.error = action.payload;

      })

      .addCase(fetchOfferProducts.fulfilled, (state, action) => {

        state.offerList = action.payload;

      })

      .addCase(fetchPurchaseProducts.fulfilled, (state, action) => {

        state.purchaseList = action.payload;

      });

  }

});



export const { clearOfferStatus, setSavedOfferInfo, resetFormState } = offerSlice.actions;

export default offerSlice.reducer;