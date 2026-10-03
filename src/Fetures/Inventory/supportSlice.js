import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  supportRequests: [],
  selectedRequest: null,
  loading: true,
};

const supportSlice = createSlice({
  name: "support",
  initialState,
  reducers: {
    setSupportRequests: (state, action) => {
      state.supportRequests = action.payload;
      state.loading = false;
    },
    setSelectedRequest: (state, action) => {
      state.selectedRequest = action.payload;
    },
    clearSelectedRequest: (state) => {
      state.selectedRequest = null;
    },
  },
});

export const { setSupportRequests, setSelectedRequest, clearSelectedRequest } =
  supportSlice.actions;

export default supportSlice.reducer;