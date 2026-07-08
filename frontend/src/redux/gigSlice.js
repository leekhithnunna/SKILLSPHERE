import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  gigs: [],
  myGigs: [],
  currentGig: null,
  loading: false,
  error: null,
  page: 1,
  pages: 1,
  total: 0,
};

const gigSlice = createSlice({
  name: 'gigs',
  initialState,
  reducers: {
    setGigs: (state, action) => {
      const { data, page, pages, total } = action.payload;
      state.gigs = data;
      state.page = page;
      state.pages = pages;
      state.total = total;
    },
    setMyGigs: (state, action) => {
      state.myGigs = action.payload;
    },
    setCurrentGig: (state, action) => {
      state.currentGig = action.payload;
    },
    addGig: (state, action) => {
      state.myGigs.unshift(action.payload);
    },
    updateGig: (state, action) => {
      const idx = state.myGigs.findIndex((g) => g._id === action.payload._id);
      if (idx !== -1) state.myGigs[idx] = action.payload;
      if (state.currentGig?._id === action.payload._id) {
        state.currentGig = action.payload;
      }
    },
    removeGig: (state, action) => {
      state.myGigs = state.myGigs.filter((g) => g._id !== action.payload);
    },
    setGigLoading: (state, action) => {
      state.loading = action.payload;
    },
    setGigError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setGigs,
  setMyGigs,
  setCurrentGig,
  addGig,
  updateGig,
  removeGig,
  setGigLoading,
  setGigError,
} = gigSlice.actions;

export default gigSlice.reducer;
