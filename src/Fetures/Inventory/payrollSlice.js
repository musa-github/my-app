import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../Firebase/Firebase";

export const fetchPayrollData = createAsyncThunk(
  "payroll/fetchPayrollData",
  async (selectedMonth) => {
    // 1. Load Employees
    const empSnap = await getDocs(collection(db, "employees"));
    const employees = [];
    empSnap.forEach((docSnap) => {
      const item = docSnap.data().data || docSnap.data();
      employees.push({ id: docSnap.id, ...item });
    });

    const processedPayroll = [];

    // 2. Process Salary & Friday Attendance for each employee
    for (const emp of employees) {
      const cleanName = (emp.name || emp.employeeName || emp.id).replace(/[^a-zA-Z0-9]/g, "_");
      const monthlyAttRef = collection(db, "attendance", cleanName, selectedMonth);
      const attSnap = await getDocs(monthlyAttRef);

      let totalPresentDays = 0;
      let workedFridays = 0; // Extra Friday work counter
      let leaveDays = 0;

      attSnap.forEach((docSnap) => {
        const att = docSnap.data();
        const attDateStr = att.date || docSnap.id; // e.g. "2026-09-18" or timestamp
        const isApproved = att.statusIn === "Approved" || att.statusOut === "Approved";

        if (isApproved) {
          totalPresentDays += 1;

          // Check if this attendance date was a Friday
          const attDate = new Date(attDateStr);
          if (!isNaN(attDate.getTime()) && attDate.getDay() === 5) { // 5 = Friday
            workedFridays += 1;
          }
        } else if (att.status === "Leave") {
          leaveDays += 1;
        }
      });

      const baseSalary = Number(emp.baseSalary || 0);
      const totalMonthDays = 30; // Standard month basis
      const dailyRate = baseSalary > 0 ? baseSalary / totalMonthDays : 0;

      // Base Gross Salary for 30 Days scale
      const standardPayableDays = totalPresentDays + leaveDays;
      const grossPayable = Math.round(dailyRate * Math.min(standardPayableDays, totalMonthDays));

      // Extra Friday Allowance (1 extra day salary per worked Friday)
      const fridayAllowance = Math.round(workedFridays * dailyRate);

      // Total Payable Days (Can exceed 30 if worked on Friday)
      const totalPayableDays = standardPayableDays + workedFridays;
      const absentDays = Math.max(0, totalMonthDays - standardPayableDays);

      const advanceDeduction = Number(emp.advanceDeduction || 0);

      // Net Payable = Base Gross + Extra Friday Allowance - Advance
      const netPayable = Math.max(0, grossPayable + fridayAllowance - advanceDeduction);

      processedPayroll.push({
        id: emp.id,
        cleanName: cleanName,
        name: emp.name || emp.employeeName || cleanName,
        designation: emp.designation || "N/A",
        baseSalary: baseSalary,
        presentDays: totalPresentDays,
        leaveDays: leaveDays,
        workedFridays: workedFridays, // Friday worked count
        fridayAllowance: fridayAllowance, // Extra Friday money
        absentDays: absentDays,
        totalPayableDays: totalPayableDays,
        dailyRate: Math.round(dailyRate),
        grossPayable: grossPayable,
        advanceDeduction: advanceDeduction,
        netPayable: netPayable,
      });
    }

    return processedPayroll;
  }
);

export const updateEmployeeSalaryDetails = createAsyncThunk(
  "payroll/updateSalary",
  async ({ empId, baseSalary, advanceDeduction }, { dispatch, getState }) => {
    await setDoc(
      doc(db, "employees", empId),
      {
        data: {
          baseSalary: Number(baseSalary),
          advanceDeduction: Number(advanceDeduction),
        },
      },
      { merge: true }
    );

    const { selectedMonth } = getState().payroll;
    dispatch(fetchPayrollData(selectedMonth));
  }
);

const payrollSlice = createSlice({
  name: "payroll",
  initialState: {
    selectedMonth: "September 2026",
    payrollData: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedMonth: (state, action) => {
      state.selectedMonth = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayrollData.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollData = action.payload;
      })
      .addCase(fetchPayrollData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setSelectedMonth } = payrollSlice.actions;
export default payrollSlice.reducer;