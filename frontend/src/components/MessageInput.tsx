import React, { useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addMessage } from '../store/messageSlice';
import socketService from '../services/socket';
import FileUpload from './FileUpload';

const TYPING_DEBOUNCE_MS = 1500;

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const { currentChannel } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current && currentChannel) {
      socketService.sendTypingStop(currentChannel.id);
      isTypingRef.current = false;
    }
  }, [currentChannel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (!currentChannel) return;

    if (!isTypingRef.current) {
      socketService.sendTypingStart(currentChannel.id);
      isTypingRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_DEBOUNCE_MS);
  };

  const handleFileSelect = (file: File) => {
    if (!currentChannel || !user) return;

    const fileMessage = `📎 Shared file: ${file.name}`;
    const messageData = {
      content: fileMessage,
      channelId: currentChannel.id,
    };

    const newMessage = {
      id: crypto.randomUUID(),
      content: fileMessage,
      userId: user.id,
      username: user.username,
      channelId: currentChannel.id,
      timestamp: new Date(),
      edited: false,
    };

    dispatch(addMessage(newMessage));
    socketService.sendMessage(messageData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChannel || !user) return;

    stopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const messageData = { content: message.trim(), channelId: currentChannel.id };
    const newMessage = {
      id: crypto.randomUUID(),
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
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <FileUpload onFileSelect={handleFileSelect} />
        <input
          type="text"
          value={message}
          onChange={handleChange}
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