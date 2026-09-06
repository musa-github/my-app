// /* eslint-disable no-unused-vars */
// import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
// import { collectionGroup, getDocs } from 'firebase/firestore';
// import { db } from '../../Firebase/Firebase'; // আপনার Firebase Config পাথ বসিয়ে নিন

// // ১. Firestore থেকে Offer Data Fetch করার Thunk (offersList সাব-কালেকশন সাপোর্ট)
// export const fetchOfferList = createAsyncThunk(
//   'client/fetchOfferList',
//   async (_, { rejectWithValue }) => {
//     try {
//       // স্ক্রিনশট অনুযায়ী 'offersList' নামে খোঁজা হচ্ছে
//       const querySnapshot = await getDocs(collectionGroup(db, 'offersList'));
//       const offers = [];
//       querySnapshot.forEach((doc) => {
//         offers.push({ id: doc.id, ...doc.data() });
//       });
//       return offers;
//     } catch (error) {
//       try {
//         // Fallback: যদি কোথাও 'offerList' নামে থাকে
//         const fallbackSnapshot = await getDocs(collectionGroup(db, 'offerList'));
//         const offers = [];
//         fallbackSnapshot.forEach((doc) => {
//           offers.push({ id: doc.id, ...doc.data() });
//         });
//         return offers;
//       } catch (err) {
//         return rejectWithValue(error.message);
//       }
//     }
//   }
// );

// // ২. Firestore থেকে Sales Data Fetch করার Thunk
// export const fetchSalesList = createAsyncThunk(
//   'client/fetchSalesList',
//   async (_, { rejectWithValue }) => {
//     try {
//       const querySnapshot = await getDocs(collectionGroup(db, 'salesList'));
//       const sales = [];
//       querySnapshot.forEach((doc) => {
//         sales.push({ id: doc.id, ...doc.data() });
//       });
//       return sales;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// const initialState = {
//   offerList: [],
//   salesList: [],
//   loading: false,
//   error: null,
//   searchTerm: '',
//   statusFilter: 'ALL',
// };

// const clientSlice = createSlice({
//   name: 'client',
//   initialState,
//   reducers: {
//     setSearchTerm: (state, action) => {
//       state.searchTerm = action.payload;
//     },
//     setStatusFilter: (state, action) => {
//       state.statusFilter = action.payload;
//     },
//     resetFilters: (state) => {
//       state.searchTerm = '';
//       state.statusFilter = 'ALL';
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchOfferList.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchOfferList.fulfilled, (state, action) => {
//         state.loading = false;
//         state.offerList = action.payload;
//       })
//       .addCase(fetchOfferList.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(fetchSalesList.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchSalesList.fulfilled, (state, action) => {
//         state.loading = false;
//         state.salesList = action.payload;
//       })
//       .addCase(fetchSalesList.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { setSearchTerm, setStatusFilter, resetFilters } = clientSlice.actions;

// // Base Selectors
// const selectOfferList = (state) =>
//   Array.isArray(state.client?.offerList) ? state.client.offerList : [];
// const selectSalesList = (state) =>
//   Array.isArray(state.client?.salesList) ? state.client.salesList : [];
// const selectSearchTerm = (state) => state.client.searchTerm || '';
// const selectStatusFilter = (state) => state.client.statusFilter || 'ALL';

// // Combined Client Data Selector
// export const selectClientsData = createSelector(
//   [selectOfferList, selectSalesList],
//   (offerList, salesList) => {
//     const clientsMap = {};

//     // 1. Process Offer Data (headerData.toCompany prioritize করা হয়েছে)
//     offerList.forEach((offer) => {
//       const companyName =
//         offer.headerData?.toCompany?.trim() ||
//         offer.companyName?.trim() ||
//         offer.customerName?.trim() ||
//         'Unknown Client';

//       const offerAmount = Number(
//         offer.grandTotal || offer.totalAmount || offer.totalBill || 0
//       );

//       if (!clientsMap[companyName]) {
//         clientsMap[companyName] = {
//           clientName: companyName,
//           totalOffer: 0,
//           totalBill: 0,
//           totalReceived: 0,
//           totalDue: 0,
//         };
//       }
//       clientsMap[companyName].totalOffer += offerAmount;
//     });

//     // 2. Process Sales Data
//     salesList.forEach((sale) => {
//       const companyName =
//         sale.companyName?.trim() ||
//         sale.headerData?.toCompany?.trim() ||
//         sale.customerName?.trim() ||
//         'Unknown Client';

//       const billAmount = Number(
//         sale.grandTotal || sale.totalBill || sale.billAmount || 0
//       );
//       const receivedAmount = Number(
//         sale.receivedAmount || sale.paidAmount || sale.totalReceived || 0
//       );

//       if (!clientsMap[companyName]) {
//         clientsMap[companyName] = {
//           clientName: companyName,
//           totalOffer: 0,
//           totalBill: 0,
//           totalReceived: 0,
//           totalDue: 0,
//         };
//       }
//       clientsMap[companyName].totalBill += billAmount;
//       clientsMap[companyName].totalReceived += receivedAmount;
//     });

//     // 3. Calculate Due
//     return Object.values(clientsMap).map((client) => {
//       const due = client.totalBill - client.totalReceived;
//       return {
//         ...client,
//         totalDue: due > 0 ? due : 0,
//       };
//     });
//   }
// );

// // Filtered Clients Selector
// export const selectFilteredClients = createSelector(
//   [selectClientsData, selectSearchTerm, selectStatusFilter],
//   (clientsData, searchTerm, statusFilter) => {
//     return clientsData.filter((client) => {
//       const matchesSearch = client.clientName
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase());

//       if (statusFilter === 'DUE') {
//         return matchesSearch && client.totalDue > 0;
//       }
//       if (statusFilter === 'PAID') {
//         return matchesSearch && client.totalDue <= 0 && client.totalBill > 0;
//       }
//       return matchesSearch;
//     });
//   }
// );

// // Summary Totals Selector
// export const selectClientSummaryTotals = createSelector(
//   [selectFilteredClients],
//   (filteredClients) => {
//     return filteredClients.reduce(
//       (acc, c) => {
//         acc.totalOffer += c.totalOffer;
//         acc.totalBill += c.totalBill;
//         acc.totalReceived += c.totalReceived;
//         acc.totalDue += c.totalDue;
//         return acc;
//       },
//       { totalOffer: 0, totalBill: 0, totalReceived: 0, totalDue: 0 }
//     );
//   }
// );

// export default clientSlice.reducer;

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
      const querySnapshot = await getDocs(collectionGroup(db, 'salesList'));
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
      const companyName =
        offer.headerData?.toCompany?.trim() ||
        offer.companyName?.trim() ||
        offer.customerName?.trim() ||
        'Unknown Client';

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
      const companyName =
        sale.companyName?.trim() ||
        sale.headerData?.toCompany?.trim() ||
        sale.customerName?.trim() ||
        'Unknown Client';

      const billAmount = Number(
        sale.grandTotal || sale.totalBill || sale.billAmount || 0
      );
      const receivedAmount = Number(
        sale.receivedAmount || sale.paidAmount || sale.totalReceived || 0
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

      const clientOffers = offerList.filter((offer) => {
        const name =
          offer.headerData?.toCompany ||
          offer.companyName ||
          offer.customerName ||
          '';
        return name.trim().toLowerCase() === decodedName;
      });

      const clientSales = salesList.filter((sale) => {
        const name =
          sale.companyName ||
          sale.headerData?.toCompany ||
          sale.customerName ||
          '';
        return name.trim().toLowerCase() === decodedName;
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