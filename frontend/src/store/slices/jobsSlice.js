import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jobService } from '../../services/jobService';

export const fetchJobs = createAsyncThunk('jobs/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await jobService.getJobs(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchJob = createAsyncThunk('jobs/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await jobService.getJob(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMyJobs = createAsyncThunk('jobs/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const res = await jobService.getMyJobs();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    job: null,
    myJobs: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearJob(state) { state.job = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchJobs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchJob.pending, (state) => { state.loading = true; })
      .addCase(fetchJob.fulfilled, (state, action) => { state.loading = false; state.job = action.payload.data; })
      .addCase(fetchJob.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMyJobs.fulfilled, (state, action) => { state.myJobs = action.payload.data; });
  },
});

export const { clearJob } = jobsSlice.actions;
export default jobsSlice.reducer;
