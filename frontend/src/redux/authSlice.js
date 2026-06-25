import { createSlice } from '@reduxjs/toolkit';

// Rehydrate from localStorage on app load
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Dispatch on successful login.
     * Payload: { user, token }
     */
    login: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },

    /**
     * Dispatch on logout.
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    /**
     * Dispatch to update the stored user (e.g., after profile update).
     * Payload: updated user object
     */
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { login, logout, setUser, setLoading } = authSlice.actions;

export default authSlice.reducer;
