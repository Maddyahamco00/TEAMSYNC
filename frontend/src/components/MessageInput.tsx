import React, { useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addMessage } from '../store/messageSlice';
import socketService from '../services/socket';
import FileUpload from './FileUpload';

interface DMUser { id: string; username: string; fullName: string; status: string; }
interface MessageInputProps { selectedDMUser: DMUser | null; }

const TYPING_DEBOUNCE_MS = 1500;

const MessageInput: React.FC<MessageInputProps> = ({ selectedDMUser }) => {
  const [message, setMessage] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const dispatch = useDispatch();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentChannel } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.user);

  const activeChannelId = selectedDMUser ? null : currentChannel?.id;
  const placeholder = selectedDMUser
    ? `Message ${selectedDMUser.fullName || selectedDMUser.username}`
    : `Message #${currentChannel?.name || 'channel'}`;

  const mentionSuggestions = mentionQuery
    ? users.filter(u =>
        u.id !== user?.id &&
        (u.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
         u.fullName?.toLowerCase().includes(mentionQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  const stopTyping = useCallback(() => {
    if (isTypingRef.current && activeChannelId) {
      socketService.sendTypingStop(activeChannelId);
      isTypingRef.current = false;
    }
  }, [activeChannelId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);

    // Detect @mention trigger
    const cursorPos = e.target.selectionStart || 0;
    const textUpToCursor = val.slice(0, cursorPos);
    const mentionMatch = textUpToCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }

    if (!activeChannelId) return;
    if (!isTypingRef.current) {
      socketService.sendTypingStart(activeChannelId);
      isTypingRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_DEBOUNCE_MS);
  };

  const insertMention = (username: string) => {
    const cursorPos = inputRef.current?.selectionStart || message.length;
    const before = message.slice(0, cursorPos).replace(/@\w*$/, `@${username} `);
    const after = message.slice(cursorPos);
    setMessage(before + after);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const sendMessage = (content: string) => {
    if (!user) return;
    if (!selectedDMUser && !currentChannel) return;

    const newMessage = {
      id: crypto.randomUUID(),
      content,
      userId: user.id,
      username: user.username,
      channelId: selectedDMUser ? selectedDMUser.id : currentChannel!.id,
      createdAt: new Date(),
      edited: false,
    };
    dispatch(addMessage(newMessage));
    socketService.sendMessage({
      content,
      ...(selectedDMUser ? { recipientId: selectedDMUser.id } : { channelId: currentChannel!.id }),
    });
  };

  const handleFileSelect = (file: File) => {
    sendMessage(`📎 Shared file: ${file.name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    stopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendMessage(message.trim());
    setMessage('');
    setShowMentions(false);
  };

  return (
    <div className="border-t border-gray-200 p-4 flex-shrink-0 relative">
      {/* @mention suggestions */}
      {showMentions && mentionSuggestions.length > 0 && (
        <div className="absolute bottom-full mb-1 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {mentionSuggestions.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => insertMention(u.username)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm"
            >
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">{u.username.charAt(0).toUpperCase()}</span>
              </div>
              <span className="font-medium text-gray-900">{u.username}</span>
              <span className="text-gray-400 text-xs">{u.fullName}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <FileUpload onFileSelect={handleFileSelect} />
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleChange}
          onKeyDown={e => {
            if (e.key === 'Escape') setShowMentions(false);
          }}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
