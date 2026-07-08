import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import gigReducer from './gigSlice';
import proposalReducer from './proposalSlice';
import dashboardReducer from './dashboardSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    gigs: gigReducer,
    proposals: proposalReducer,
    dashboard: dashboardReducer,
  },
});

export default store;
