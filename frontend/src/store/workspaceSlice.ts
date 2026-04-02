import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  createdBy: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

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
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/workspaces');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspaces');
    }
  }
);

export const createWorkspace = createAsyncThunk(
  'workspace/createWorkspace',
  async (data: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/workspaces', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create workspace');
    }
  }
);

export const fetchChannels = createAsyncThunk(
  'workspace/fetchChannels',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/channels`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch channels');
    }
  }
);

export const createChannel = createAsyncThunk(
  'workspace/createChannel',
  async (data: { workspaceId: string; name: string; description?: string; type?: string }, { rejectWithValue }) => {
    try {
      const { workspaceId, ...body } = data;
      const response = await api.post(`/workspaces/${workspaceId}/channels`, body);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create channel');
    }
  }
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.currentWorkspace = action.payload;
      state.channels = [];
      state.currentChannel = null;
    },
    setCurrentChannel: (state, action: PayloadAction<Channel>) => {
      state.currentChannel = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload;
        if (action.payload.length > 0 && !state.currentWorkspace) {
          state.currentWorkspace = action.payload[0];
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.workspaces.push(action.payload);
        state.currentWorkspace = action.payload;
        state.channels = [];
        state.currentChannel = null;
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(fetchChannels.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false;
        state.channels = action.payload;
        if (action.payload.length > 0 && !state.currentChannel) {
          state.currentChannel = action.payload[0];
        }
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.channels.push(action.payload);
        state.currentChannel = action.payload;
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentWorkspace, setCurrentChannel, clearError } = workspaceSlice.actions;
export default workspaceSlice.reducer;
