import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchMessages, addMessage } from '../store/messageSlice';
import MessageInput from './MessageInput';
import socketService from '../services/socket';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { SkeletonMessages } from './Skeleton';

interface DMUser { id: string; username: string; fullName: string; status: string; }
interface ChatAreaProps { selectedDMUser: DMUser | null; }

const renderContent = (content: string) => {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-blue-500 font-medium">{part}</span>
      : part
  );
};

const ChatArea: React.FC<ChatAreaProps> = ({ selectedDMUser }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { messages, loading } = useSelector((state: RootState) => state.message);
  const { currentChannel } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);

  const activeId = selectedDMUser ? selectedDMUser.id : currentChannel?.id;
  const title = selectedDMUser
    ? selectedDMUser.fullName || selectedDMUser.username
    : currentChannel ? `# ${currentChannel.name}` : null;

  useEffect(() => {
    if (!activeId) return;
    setTypingUsers([]);
    if (!selectedDMUser && currentChannel) {
      dispatch(fetchMessages(currentChannel.id) as any);
      socketService.onUserTyping(currentChannel.id, (data) => {
        if (data.userId !== user?.id && data.username) {
          setTypingUsers(prev =>
            prev.find(u => u.userId === data.userId) ? prev
              : [...prev, { userId: data.userId, username: data.username! }]
          );
        }
      });
      socketService.onUserStopTyping(currentChannel.id, (data) => {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      });
      return () => { socketService.offUserTyping(currentChannel.id); };
    }
  }, [activeId, selectedDMUser, currentChannel, dispatch, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    try {
      await api.patch(`/messages/${messageId}`, { content: editContent.trim() });
      dispatch({ type: 'message/editMessage', payload: { id: messageId, content: editContent.trim() } });
      setEditingId(null);
      toast.success('Message edited');
    } catch { toast.error('Failed to edit message'); }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await api.delete(`/messages/${messageId}`);
      dispatch({ type: 'message/deleteMessage', payload: messageId });
      toast.success('Message deleted');
    } catch { toast.error('Failed to delete message'); }
  };

  if (!title) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl mb-2">💬</p>
          <h3 className="text-lg font-medium text-gray-900">Welcome to TeamSync</h3>
          <p className="text-gray-500 text-sm">Select a channel or teammate to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {selectedDMUser && <p className="text-xs text-gray-400">{selectedDMUser.status}</p>}
        {currentChannel && !selectedDMUser && currentChannel.description && (
          <p className="text-xs text-gray-400">{currentChannel.description}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <SkeletonMessages />}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet. Say hello! 👋</p>
        )}
        {messages.map((message) => {
          const isOwn = message.userId === user?.id;
          return (
            <div key={message.id} className={`group flex space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOwn ? 'bg-blue-500' : 'bg-gray-400'}`}>
                  <span className="text-white text-sm font-medium">
                    {message.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className={`max-w-xs lg:max-w-md flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-2 mb-0.5">
                  {!isOwn && <span className="text-xs font-medium text-gray-700">{message.username}</span>}
                  <span className="text-xs text-gray-400">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.edited && <span className="text-xs text-gray-400 italic">(edited)</span>}
                </div>

                {editingId === message.id ? (
                  <div className="flex space-x-1 w-full">
                    <input
                      autoFocus
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleEdit(message.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none"
                    />
                    <button onClick={() => handleEdit(message.id)}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Save</button>
                    <button onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">Cancel</button>
                  </div>
                ) : (
                  <div className={`px-3 py-2 rounded-lg text-sm ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {renderContent(message.content)}
                  </div>
                )}

                {/* Edit/Delete actions — only for own messages */}
                {isOwn && editingId !== message.id && (
                  <div className="flex space-x-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingId(message.id); setEditContent(message.content); }}
                      className="text-xs text-gray-400 hover:text-gray-600 px-1"
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-1"
                    >Delete</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <p className="text-xs text-gray-400 italic pl-11">
            {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput selectedDMUser={selectedDMUser} />
    </div>
  );
};

export default ChatArea;
