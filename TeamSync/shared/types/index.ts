// User types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Socket.IO event types
export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: () => void;
  
  // Authentication
  authenticate: (token: string) => void;
  
  // Channel events
  join_channel: (channelId: string) => void;
  leave_channel: (channelId: string) => void;
  
  // Message events
  send_message: (data: MessageData) => void;
  new_message: (message: Message) => void;
  
  // Typing events
  typing_start: (data: { channelId?: string; recipientId?: string }) => void;
  typing_stop: (data: { channelId?: string; recipientId?: string }) => void;
  user_typing: (data: { userId: string; username: string; channelId: string }) => void;
  user_stop_typing: (data: { userId: string; channelId: string }) => void;
  
  // Presence events
  user_online: () => void;
  user_status_change: (data: { userId: string; status: string }) => void;
}

// Message types (for future use)
export interface Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  channelId?: string;
  recipientId?: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

export interface MessageData {
  content: string;
  channelId?: string;
  recipientId?: string;
}

// Channel types (for future use)
export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  createdBy: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Workspace types (for future use)
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  channels: string[];
  createdAt: Date;
  updatedAt: Date;
}