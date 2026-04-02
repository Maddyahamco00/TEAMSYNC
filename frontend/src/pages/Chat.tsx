import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import socketService from '../services/socket';
import { logoutUser } from '../store/authSlice';

const Chat: React.FC = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const { currentChannel } = useSelector((state: RootState) => state.workspace);

  useEffect(() => {
    if (token) socketService.connect(token);
    return () => { socketService.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (currentChannel) socketService.joinChannel(currentChannel.id);
  }, [currentChannel]);

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      <Sidebar />
      <ChatArea />
    </div>
  );
};

export default Chat;
