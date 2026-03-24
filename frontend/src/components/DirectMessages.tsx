import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const DirectMessages: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  // Mock users for now
  const users = [
    { id: '2', username: 'alice', fullName: 'Alice Johnson', status: 'online' },
    { id: '3', username: 'bob', fullName: 'Bob Smith', status: 'away' },
    { id: '4', username: 'charlie', fullName: 'Charlie Brown', status: 'offline' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'busy': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-300 mb-2 px-4">Direct Messages</h3>
      <div className="space-y-1">
        {users.map((dmUser) => (
          <button
            key={dmUser.id}
            onClick={() => setSelectedUser(dmUser.id)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2 ${
              selectedUser === dmUser.id ? 'bg-gray-700' : ''
            }`}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {dmUser.fullName.charAt(0)}
                </span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(dmUser.status)}`}></div>
            </div>
            <span className="text-sm text-gray-300">{dmUser.fullName}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DirectMessages;