import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Message } from '../../../shared/types/index';
import api from '../services/api';

export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'reply';
  messageId: string;
  channelId: string;
  fromUsername: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  notifications: Notification[];
}

const initialState: MessageState = {
  messages: [],
  loading: false,
  error: null,
  notifications: [],
};

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/channel/${channelId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages');
    }
  }
);

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    editMessage: (state, action) => {
      const msg = state.messages.find(m => m.id === action.payload.id);
      if (msg) { msg.content = action.payload.content; msg.edited = true; }
    },
    deleteMessage: (state, action) => {
      state.messages = state.messages.filter(m => m.id !== action.payload);
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
    markNotificationsRead: (state) => {
      state.notifications.forEach(n => { n.read = true; });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch messages';
      });
  },
});

export const { addMessage, clearMessages, editMessage, deleteMessage, addNotification, markNotificationsRead } = messageSlice.actions;
export default messageSlice.reducer;