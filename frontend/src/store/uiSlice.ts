import { createSlice } from '@reduxjs/toolkit';

interface UIState {
  darkMode: boolean;
}

const savedDark = localStorage.getItem('darkMode') === 'true';

const initialState: UIState = {
  darkMode: savedDark,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(state.darkMode));
    },
  },
});

export const { toggleDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
