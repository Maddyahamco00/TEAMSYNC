import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import socketService from '../services/socket';

interface DMUser {
  id: string;
  username: string;
  fullName: string;
  status: string;
}

const Chat: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { currentChannel } = useSelector((state: RootState) => state.workspace);
  const [selectedDMUser, setSelectedDMUser] = useState<DMUser | null>(null);

  useEffect(() => {
    if (token) socketService.connect(token);
    return () => { socketService.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (currentChannel) socketService.joinChannel(currentChannel.id);
  }, [currentChannel]);

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      <Sidebar onSelectDM={setSelectedDMUser} selectedDMUser={selectedDMUser} />
      <ChatArea selectedDMUser={selectedDMUser} />
    </div>
  );
};

export default Chat;
