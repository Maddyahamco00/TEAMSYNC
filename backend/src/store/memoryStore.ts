import { randomUUID } from 'crypto';

export const generateId = (): string => randomUUID();

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  avatar: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelRecord {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  createdBy: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecord {
  id: string;
  content: string;
  userId: string;
  username: string;
  channelId: string;
  edited: boolean;
  editedAt?: Date;
  createdAt: Date;
}

export interface NotificationRecord {
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

export interface ThreadReplyRecord extends MessageRecord {
  parentMessageId: string;
}

export const users: UserRecord[] = [];
export const workspaces: WorkspaceRecord[] = [];
export const channels: ChannelRecord[] = [];
export const messages: MessageRecord[] = [];
export const notifications: NotificationRecord[] = [];
export const threadReplies: ThreadReplyRecord[] = [];
