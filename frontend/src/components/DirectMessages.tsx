import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchUsers } from '../store/userSlice';
import { clearMessages } from '../store/messageSlice';
import socketService from '../services/socket';

interface DMUser {
  id: string;
  username: string;
  fullName: string;
  status: string;
}

interface DirectMessagesProps {
  onSelectUser: (user: DMUser | null) => void;
  selectedUserId: string | null;
}

const statusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-400';
    case 'away':   return 'bg-yellow-400';
    case 'busy':   return 'bg-red-400';
    default:       return 'bg-gray-400';
  }
};

const DirectMessages: React.FC<DirectMessagesProps> = ({ onSelectUser, selectedUserId }) => {
  const dispatch = useDispatch();
  const { users } = useSelector((state: RootState) => state.user);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchUsers() as any);
  }, [dispatch]);

  // Exclude self
  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  const handleSelect = (dmUser: DMUser) => {
    if (selectedUserId === dmUser.id) {
      onSelectUser(null);
      return;
    }
    dispatch(clearMessages());
    onSelectUser(dmUser);
    socketService.joinDM(dmUser.id);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-3 mb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase">Direct Messages</span>
      </div>
      <div className="space-y-0.5">
        {otherUsers.length === 0 && (
          <p className="text-xs text-gray-500 px-3 py-1">No other members yet</p>
        )}
        {otherUsers.map(dmUser => (
          <button
            key={dmUser.id}
            onClick={() => handleSelect(dmUser)}
            className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 rounded text-sm ${
              selectedUserId === dmUser.id ? 'bg-gray-600' : 'hover:bg-gray-700'
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {dmUser.fullName?.charAt(0) || dmUser.username?.charAt(0)}
                </span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${statusColor(dmUser.status)}`} />
            </div>
            <span className="text-gray-300 truncate">{dmUser.fullName || dmUser.username}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DirectMessages;
