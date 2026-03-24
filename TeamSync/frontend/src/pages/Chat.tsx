import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import socketService from '../services/socket';
import { logoutUser } from '../store/authSlice';

const Chat: React.FC = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { currentChannel } = useSelector((state: RootState) => state.workspace);

  const handleLogout = () => {
    dispatch(logoutUser() as any);
  };

  useEffect(() => {
    if (token) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (currentChannel) {
      socketService.joinChannel(currentChannel.id);
    }
  }, [currentChannel]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary-600">TeamSync</h1>
              <nav className="flex space-x-4">
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Dashboard
                </Link>
                <span className="px-3 py-2 rounded-md text-sm font-medium bg-primary-100 text-primary-700">
                  Chat
                </span>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.fullName || user?.username}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <ChatArea />
      </div>
    </div>
  );
};

export default Chat;