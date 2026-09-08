/* eslint-disable no-unused-vars */
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase/Firebase';

// ১. Firestore থেকে Offer Data Fetch করার Thunk
export const fetchOfferList = createAsyncThunk(
  'client/fetchOfferList',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collectionGroup(db, 'offersList'));
      const offers = [];
      querySnapshot.forEach((doc) => {
        offers.push({ id: doc.id, ...doc.data() });
      });
      return offers;
    } catch (error) {
      try {
        const fallbackSnapshot = await getDocs(collectionGroup(db, 'offerList'));
        const offers = [];
        fallbackSnapshot.forEach((doc) => {
          offers.push({ id: doc.id, ...doc.data() });
        });
        return offers;
      } catch (err) {
        return rejectWithValue(error.message);
      }
    }
  }
);

// ২. Firestore থেকে Sales Data Fetch করার Thunk
export const fetchSalesList = createAsyncThunk(
  'client/fetchSalesList',
  async (_, { rejectWithValue }) => {
    try {
      let querySnapshot;
      try {
        querySnapshot = await getDocs(collectionGroup(db, 'bill_lists'));
      } catch (e) {
        querySnapshot = await getDocs(collectionGroup(db, 'salesList'));
      }

      const sales = [];
      querySnapshot.forEach((doc) => {
        sales.push({ id: doc.id, ...doc.data() });
      });
      return sales;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  offerList: [],
  salesList: [],
  loading: false,
  error: null,
  searchTerm: '',
  statusFilter: 'ALL',
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    resetFilters: (state) => {
      state.searchTerm = '';
      state.statusFilter = 'ALL';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOfferList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOfferList.fulfilled, (state, action) => {
        state.loading = false;
        state.offerList = action.payload;
      })
      .addCase(fetchOfferList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSalesList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSalesList.fulfilled, (state, action) => {
        state.loading = false;
        state.salesList = action.payload;
      })
      .addCase(fetchSalesList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSearchTerm, setStatusFilter, resetFilters } = clientSlice.actions;

// Base Selectors
export const selectOfferList = (state) =>
  Array.isArray(state.client?.offerList) ? state.client.offerList : [];
export const selectSalesList = (state) =>
  Array.isArray(state.client?.salesList) ? state.client.salesList : [];
export const selectSearchTerm = (state) => state.client.searchTerm || '';
export const selectStatusFilter = (state) => state.client.statusFilter || 'ALL';

// Combined Client Data Selector
export const selectClientsData = createSelector(
  [selectOfferList, selectSalesList],
  (offerList, salesList) => {
    const clientsMap = {};

    offerList.forEach((offer) => {
      const rawName =
        offer.headerData?.toCompany ||
        offer.companyName ||
        offer.customerName ||
        'Unknown Client';
      const companyName = rawName.trim();

      const offerAmount = Number(
        offer.grandTotal || offer.totalAmount || offer.totalBill || 0
      );

      if (!clientsMap[companyName]) {
        clientsMap[companyName] = {
          clientName: companyName,
          totalOffer: 0,
          totalBill: 0,
          totalReceived: 0,
          totalDue: 0,
        };
      }
      clientsMap[companyName].totalOffer += offerAmount;
    });

    salesList.forEach((sale) => {
      const rawName =
        sale.companyName ||
        sale.headerData?.toCompany ||
        sale.customerName ||
        'Unknown Client';
      const companyName = rawName.trim();

      const billAmount = Number(
        sale.grandTotal || sale.totalBill || sale.billAmount || 0
      );
      // String to Number safety conversion
      const rawReceived = sale.paidAmount ?? sale.receivedAmount ?? sale.totalReceived ?? 0;
      const receivedAmount = parseFloat(String(rawReceived).replace(/,/g, '')) || 0;

      if (!clientsMap[companyName]) {
        clientsMap[companyName] = {
          clientName: companyName,
          totalOffer: 0,
          totalBill: 0,
          totalReceived: 0,
          totalDue: 0,
        };
      }
      clientsMap[companyName].totalBill += billAmount;
      clientsMap[companyName].totalReceived += receivedAmount;
    });

    return Object.values(clientsMap).map((client) => {
      const due = client.totalBill - client.totalReceived;
      return {
        ...client,
        totalDue: due > 0 ? due : 0,
      };
    });
  }
);

// Filtered Clients Selector
export const selectFilteredClients = createSelector(
  [selectClientsData, selectSearchTerm, selectStatusFilter],
  (clientsData, searchTerm, statusFilter) => {
    return clientsData.filter((client) => {
      const matchesSearch = client.clientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      if (statusFilter === 'DUE') {
        return matchesSearch && client.totalDue > 0;
      }
      if (statusFilter === 'PAID') {
        return matchesSearch && client.totalDue <= 0 && client.totalBill > 0;
      }
      return matchesSearch;
    });
  }
);

// Summary Totals Selector
export const selectClientSummaryTotals = createSelector(
  [selectFilteredClients],
  (filteredClients) => {
    return filteredClients.reduce(
      (acc, c) => {
        acc.totalOffer += c.totalOffer;
        acc.totalBill += c.totalBill;
        acc.totalReceived += c.totalReceived;
        acc.totalDue += c.totalDue;
        return acc;
      },
      { totalOffer: 0, totalBill: 0, totalReceived: 0, totalDue: 0 }
    );
  }
);

// Client Specific Ledger Selector
export const selectClientDetailsByName = (clientName) =>
  createSelector(
    [selectOfferList, selectSalesList],
    (offerList, salesList) => {
      if (!clientName) return null;

      const decodedName = decodeURIComponent(clientName).trim().toLowerCase();

      // Helper function to clean company names for flexible matching
      const cleanName = (str) =>
        (str || '').toString().trim().replace(/\./g, '').toLowerCase();

      const targetClean = cleanName(decodedName);

      // Offer Matching & Field Formatting
      const clientOffers = offerList
        .filter((offer) => {
          const name =
            offer.headerData?.toCompany ||
            offer.companyName ||
            offer.customerName ||
            '';
          return cleanName(name) === targetClean;
        })
        .map((offer) => ({
          ...offer,
          offerDate: offer.offerDate || offer.date || offer.createdAt?.split('T')[0] || 'N/A',
        }));

      // Sales / Bill Matching & Field Formatting
      const clientSales = salesList
        .filter((sale) => {
          const name =
            sale.companyName ||
            sale.headerData?.toCompany ||
            sale.customerName ||
            '';
          return cleanName(name) === targetClean;
        })
        .map((sale) => {
          const rawRec = sale.paidAmount ?? sale.receivedAmount ?? sale.totalReceived ?? 0;
          const recAmt = parseFloat(String(rawRec).replace(/,/g, '')) || 0;
          
          const recDate =
            sale.receivedDate ||
            sale.paymentDate ||
            sale.updatedAt ||
            (recAmt > 0 ? sale.billDate || sale.date : '-');

          return {
            ...sale,
            receivedAmount: recAmt,
            billDate: sale.billDate || sale.date || 'N/A',
            receivedDate: recDate,
          };
        });

      const itemsSet = new Set();
      [...clientOffers, ...clientSales].forEach((doc) => {
        const items = doc.items || doc.products || [];
        items.forEach((item) => {
          const itemName = item.name || item.itemName || item.description;
          if (itemName) itemsSet.add(itemName.trim());
        });
      });

      return {
        clientName: decodeURIComponent(clientName),
        offers: clientOffers,
        sales: clientSales,
        itemList: Array.from(itemsSet),
      };
    }
  );

export default clientSlice.reducer;