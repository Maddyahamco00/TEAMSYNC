import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Workspace, Channel } from '../../../shared/types';
import api from '../services/api';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  channels: Channel[];
  currentChannel: Channel | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  channels: [],
  currentChannel: null,
  loading: false,
  error: null,
};

export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchWorkspaces',
  async () => {
    const response = await api.get('/workspaces');
    return response.data.data;
  }
);

export const fetchChannels = createAsyncThunk(
  'workspace/fetchChannels',
  async (workspaceId: string) => {
    const response = await api.get(`/workspaces/${workspaceId}/channels`);
    return response.data.data;
  }
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
    },
    setCurrentChannel: (state, action) => {
      state.currentChannel = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload;
        if (action.payload.length > 0 && !state.currentWorkspace) {
          state.currentWorkspace = action.payload[0];
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch workspaces';
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.channels = action.payload;
        if (action.payload.length > 0 && !state.currentChannel) {
          state.currentChannel = action.payload[0];
        }
      });
  },
});

export const { setCurrentWorkspace, setCurrentChannel } = workspaceSlice.actions;
export default workspaceSlice.reducer;