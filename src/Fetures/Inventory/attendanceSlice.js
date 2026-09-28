// src/redux/slices/attendanceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const today = new Date();
const initialMonthYear = today.toLocaleString("en-US", {
  month: "long",
  year: "numeric",
});

const initialState = {
  selectedMonthYear: initialMonthYear, // e.g., "September 2026"
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setSelectedMonthYear: (state, action) => {
      state.selectedMonthYear = action.payload;
    },
  },
});

export const { setSelectedMonthYear } = attendanceSlice.actions;
export default attendanceSlice.reducer;