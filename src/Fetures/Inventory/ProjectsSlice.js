
// export default projectSlice.reducer;
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../Firebase/Firebase';

// ১. ফায়ারবেস থেকে সব প্রজেক্ট ডাটা লোড করা
export const fetchProjects = createAsyncThunk('projects/fetchProjects', async () => {
  const querySnapshot = await getDocs(collection(db, 'projects'));
  const projectsData = [];
  querySnapshot.forEach((doc) => {
    projectsData.push({ id: doc.id, ...doc.data() });
  });
  return projectsData;
});

// ২. সব প্রজেক্ট ফায়ারবেসে সেভ করা
export const saveAllProjectsToFirebase = createAsyncThunk(
  'projects/saveAllProjectsToFirebase',
  async (_, { getState }) => {
    const { projects } = getState().project || {};
    const batch = writeBatch(db);

    (projects || []).forEach((proj) => {
      const docRef = doc(db, 'projects', proj.id || proj.projectName.replace(/\s+/g, '_'));
      
      const updatedBillList = (proj.billList || []).map(bill => ({
        ...bill,
        servicingDate: bill.servicingDate || proj.servicingDate || ''
      }));

      batch.set(docRef, {
        projectName: proj.projectName,
        address: proj.address || '',
        phoneNo: proj.phoneNo || '',
        liftQty: proj.liftQty || 1,
        whoseProjects: proj.whoseProjects || 'HRE',
        servicingDate: proj.servicingDate || '',
        billList: updatedBillList
      }, { merge: true });
    });

    await batch.commit();
    return true;
  }
);

// ৩. প্রজেক্ট ডিলিট করা
export const deleteProjectFromFirebase = createAsyncThunk(
  'projects/deleteProjectFromFirebase',
  async (projectId, { dispatch }) => {
    await deleteDoc(doc(db, 'projects', projectId));
    dispatch(removeProjectLocal(projectId));
    return projectId;
  }
);

// ৪. [নতুন] ProjectDetails পেজের জন্য নির্দিষ্ট বিল ফায়ারবেসে সেভ/আপডেট করা
export const saveBillToFirebase = createAsyncThunk(
  'projects/saveBillToFirebase',
  async ({ projectId, billData }, { rejectWithValue }) => {
    try {
      const projectRef = doc(db, 'projects', String(projectId));
      const docSnap = await getDoc(projectRef);

      let currentBills = [];
      if (docSnap.exists()) {
        currentBills = docSnap.data().billList || [];
      }

      const existingIndex = currentBills.findIndex((b) => b.month === billData.month);
      if (existingIndex !== -1) {
        currentBills[existingIndex] = { ...currentBills[existingIndex], ...billData };
      } else {
        currentBills.push(billData);
      }

      await updateDoc(projectRef, { billList: currentBills });
      return { projectId, updatedBills: currentBills };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ৫. [নতুন] ProjectDetails পেজের জন্য নির্দিষ্ট ফায়ারবেস থেকে বিল ডিলিট করা
export const deleteBillFromFirebase = createAsyncThunk(
  'projects/deleteBillFromFirebase',
  async ({ projectId, month }, { rejectWithValue }) => {
    try {
      const projectRef = doc(db, 'projects', String(projectId));
      const docSnap = await getDoc(projectRef);

      if (docSnap.exists()) {
        const currentBills = docSnap.data().billList || [];
        const updatedBills = currentBills.filter((b) => b.month !== month);
        await updateDoc(projectRef, { billList: updatedBills });
        return { projectId, updatedBills };
      }
      return { projectId, updatedBills: [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    projects: [],
    selectedMonth: 'All',
    selectedWhoseProject: 'All',
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedMonth: (state, action) => {
      state.selectedMonth = action.payload;
    },
    setSelectedWhoseProject: (state, action) => {
      state.selectedWhoseProject = action.payload;
    },
    addNewProjectLocal: (state, action) => {
      const servicingBill = Number(action.payload.servicingBill) || 0;
      const sparePartsBill = Number(action.payload.sparePartsBill) || 0;
      const lastMonthDue = Number(action.payload.lastMonthDue) || 0;
      const totalBill = servicingBill + sparePartsBill + lastMonthDue;
      const collectedBill = Number(action.payload.collectedBill) || 0;
      const totalDue = totalBill - collectedBill;

      const newProj = {
        id: `proj_${Date.now()}`,
        projectName: action.payload.projectName,
        address: action.payload.address,
        phoneNo: action.payload.phoneNo,
        liftQty: Number(action.payload.liftQty) || 1,
        whoseProjects: action.payload.whoseProjects || 'HRE',
        billList: [
          {
            month: action.payload.month || 'August',
            servicingDate: action.payload.servicingDate || '',
            servicingBill: servicingBill,
            sparePartsBill: sparePartsBill,
            lastMonthDue: lastMonthDue,
            totalBill: totalBill,
            collectedBill: collectedBill,
            totalDue: totalDue,
            collectedBy: action.payload.collectedBy || '',
            approvedBy: action.payload.approvedBy || '',
            servicedBy: action.payload.servicedBy || ''
          }
        ]
      };
      state.projects.unshift(newProj);
    },

    updateProjectLocal: (state, action) => {
      const { 
        id, projectName, address, phoneNo, liftQty, whoseProjects, month, 
        servicingBill, sparePartsBill, lastMonthDue, collectedBill, 
        collectedBy, approvedBy, servicedBy, lastServicingDate, servicingStatus 
      } = action.payload;
      
      const sBill = Number(servicingBill) || 0;
      const pBill = Number(sparePartsBill) || 0;
      const lDue = Number(lastMonthDue) || 0;
      const tBill = sBill + pBill + lDue;
      const cBill = Number(collectedBill) || 0;
      const tDue = tBill - cBill;

      const projectIndex = state.projects.findIndex(p => String(p.id) === String(id));
      if (projectIndex !== -1) {
        const currentProj = state.projects[projectIndex];
        currentProj.projectName = projectName;
        currentProj.address = address;
        currentProj.phoneNo = phoneNo;
        currentProj.liftQty = Number(liftQty) || 1;
        currentProj.whoseProjects = whoseProjects || 'HRE';

        const updatedMonth = month || 'August';
        let billList = currentProj.billList ? [...currentProj.billList] : [];
        const billIndex = billList.findIndex(b => b.month === updatedMonth);

        const newBillData = {
          month: updatedMonth,
          servicingDate: action.payload.servicingDate || lastServicingDate || '',
          lastServicingDate: action.payload.lastServicingDate || action.payload.servicingDate || '',
          servicingStatus: servicingStatus || 'Pending',
          servicingBill: sBill,
          sparePartsBill: pBill,
          lastMonthDue: lDue,
          totalBill: tBill,
          collectedBill: cBill,
          totalDue: tDue,
          collectedBy: collectedBy || '',
          approvedBy: approvedBy || '',
          servicedBy: servicedBy || ''
        };

        if (billIndex !== -1) {
          billList[billIndex] = { ...billList[billIndex], ...newBillData };
        } else {
          billList.push(newBillData);
        }

        currentProj.billList = billList;
      }
    },
    
    removeProjectLocal: (state, action) => {
      state.projects = state.projects.filter(p => String(p.id) !== String(action.payload));
    },

    // ৫. [নতুন] ProjectDetails পেজ থেকে লোকাল স্টেট-এ সরাসরি বিল যোগ বা আপডেট করার রিডিউসার
    addOrUpdateBill: (state, action) => {
      const { projectId, billData } = action.payload;
      const targetProject = state.projects.find((p) => String(p.id) === String(projectId));

      if (targetProject) {
        if (!targetProject.billList) {
          targetProject.billList = [];
        }

        const existingIndex = targetProject.billList.findIndex((b) => b.month === billData.month);
        if (existingIndex !== -1) {
          targetProject.billList[existingIndex] = { ...targetProject.billList[existingIndex], ...billData };
        } else {
          targetProject.billList.push(billData);
        }
      }
    },

    // ৬. [নতুন] ProjectDetails পেজ থেকে লোকাল স্টেট-এর নির্দিষ্ট মাসের বিল ডিলিট করার রিডিউসার
    deleteMonthBill: (state, action) => {
      const { projectId, month } = action.payload;
      const targetProject = state.projects.find((p) => String(p.id) === String(projectId));

      if (targetProject && targetProject.billList) {
        targetProject.billList = targetProject.billList.filter((b) => b.month !== month);
      }
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(saveAllProjectsToFirebase.pending, (state) => { state.loading = true; })
      .addCase(saveAllProjectsToFirebase.fulfilled, (state) => { state.loading = false; });
  }
});

export const { 
  setSelectedMonth, 
  setSelectedWhoseProject, 
  addNewProjectLocal, 
  updateProjectLocal, 
  removeProjectLocal,
  addOrUpdateBill,
  deleteMonthBill
} = projectSlice.actions;

export default projectSlice.reducer;