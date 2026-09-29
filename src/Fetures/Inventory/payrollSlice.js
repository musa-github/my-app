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

    // 2. Process Salary & Attendance for each employee
    for (const emp of employees) {
      const rawEmail = (emp.email || emp.employeeEmail || emp.id || "").trim().toLowerCase();
      const rawName = (emp.name || emp.employeeName || "").trim();

      const cleanEmailKey = rawEmail.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanNameKey = rawName.replace(/[^a-zA-Z0-9]/g, "_");

      let attSnap = null;

      if (cleanEmailKey) {
        const emailAttRef = collection(db, "attendance", cleanEmailKey, selectedMonth);
        const snap = await getDocs(emailAttRef);
        if (!snap.empty) {
          attSnap = snap;
        }
      }

      if ((!attSnap || attSnap.empty) && cleanNameKey) {
        const nameAttRef = collection(db, "attendance", cleanNameKey, selectedMonth);
        const snap = await getDocs(nameAttRef);
        if (!snap.empty) {
          attSnap = snap;
        }
      }

      let totalPresentDays = 0;
      let workedFridays = 0;
      let leaveDays = 0;
      let fridayAbsents = 0;

      if (attSnap && !attSnap.empty) {
        attSnap.forEach((docSnap) => {
          const att = docSnap.data();
          const attDateStr = att.date || docSnap.id;
          const statusText = att.status || "Present";
          const isApproved = att.statusIn === "Approved" || att.statusOut === "Approved";

          const attDate = new Date(attDateStr);
          const isFriday = !isNaN(attDate.getTime()) && attDate.getDay() === 5;

          // Strict check for Absent status
          if (statusText === "Absent") {
            if (isFriday) {
              fridayAbsents += 1;
            }
          } else if (statusText === "Leave") {
            leaveDays += 1;
          } else if (statusText === "Present" || isApproved) {
            totalPresentDays += 1;

            if (isFriday) {
              workedFridays += 1;
            }
          }
        });
      }

      const baseSalary = Number(emp.baseSalary || 0);
      const totalMonthDays = 30;
      const totalGeneralWorkingDays = 26; // 30 days - 4 Fridays
      const dailyRate = baseSalary > 0 ? baseSalary / totalMonthDays : 0;

      // Regular working days duty (excluding Friday attendance)
      const generalWorkedDays = totalPresentDays - workedFridays;

      // Absent calculation: General day absents + Friday manual absents
      const generalAbsentDays = Math.max(0, totalGeneralWorkingDays - (generalWorkedDays + leaveDays));
      const absentDays = generalAbsentDays + fridayAbsents;

      // Base Gross Salary Calculation (Deducting total Absent Days)
      const grossPayable = Math.max(0, Math.round(baseSalary - (absentDays * dailyRate)));

      // Friday Allowance (Only for present Fridays)
      const fridayAllowance = Math.round(workedFridays * dailyRate);

      const totalPayableDays = generalWorkedDays + leaveDays + workedFridays;
      const advanceDeduction = Number(emp.advanceDeduction || 0);

      // Net Payable Formula
      const netPayable = Math.max(0, grossPayable + fridayAllowance - advanceDeduction);

      processedPayroll.push({
        id: emp.id,
        cleanName: cleanEmailKey || cleanNameKey,
        name: emp.name || emp.employeeName || emp.id,
        designation: emp.designation || "N/A",
        baseSalary: baseSalary,
        presentDays: totalPresentDays,
        leaveDays: leaveDays,
        workedFridays: workedFridays,
        fridayAllowance: fridayAllowance,
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