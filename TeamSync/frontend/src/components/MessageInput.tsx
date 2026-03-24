import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addMessage } from '../store/messageSlice';
import socketService from '../services/socket';

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const { currentChannel } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentChannel || !user) return;

    const messageData = {
      content: message.trim(),
      channelId: currentChannel.id,
    };

    // Add message to local state immediately
    const newMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      userId: user.id,
      username: user.username,
      channelId: currentChannel.id,
      timestamp: new Date(),
      edited: false,
    };

    dispatch(addMessage(newMessage));
    socketService.sendMessage(messageData);
    setMessage('');
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message #${currentChannel?.name || 'channel'}`}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageInput;