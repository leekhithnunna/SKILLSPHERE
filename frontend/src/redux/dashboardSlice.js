import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardStats: (state, action) => {
      state.stats = action.payload;
    },
    setDashboardLoading: (state, action) => {
      state.loading = action.payload;
    },
    setDashboardError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setDashboardStats, setDashboardLoading, setDashboardError } =
  dashboardSlice.actions;

export default dashboardSlice.reducer;
