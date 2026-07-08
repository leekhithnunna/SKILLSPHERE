import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  myProposals: [],
  gigProposals: [],
  loading: false,
  error: null,
  success: false,
};

const proposalSlice = createSlice({
  name: 'proposals',
  initialState,
  reducers: {
    setMyProposals: (state, action) => {
      state.myProposals = action.payload;
    },
    setGigProposals: (state, action) => {
      state.gigProposals = action.payload;
    },
    addProposal: (state, action) => {
      state.myProposals.unshift(action.payload);
    },
    updateProposal: (state, action) => {
      const idx = state.myProposals.findIndex(
        (p) => p._id === action.payload._id
      );
      if (idx !== -1) state.myProposals[idx] = action.payload;

      const gigIdx = state.gigProposals.findIndex(
        (p) => p._id === action.payload._id
      );
      if (gigIdx !== -1) state.gigProposals[gigIdx] = action.payload;
    },
    setProposalLoading: (state, action) => {
      state.loading = action.payload;
    },
    setProposalError: (state, action) => {
      state.error = action.payload;
    },
    setProposalSuccess: (state, action) => {
      state.success = action.payload;
    },
  },
});

export const {
  setMyProposals,
  setGigProposals,
  addProposal,
  updateProposal,
  setProposalLoading,
  setProposalError,
  setProposalSuccess,
} = proposalSlice.actions;

export default proposalSlice.reducer;
