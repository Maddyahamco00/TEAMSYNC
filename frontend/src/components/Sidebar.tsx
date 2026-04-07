import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  fetchWorkspaces, fetchChannels, setCurrentChannel,
  createWorkspace, createChannel, setCurrentWorkspace
} from '../store/workspaceSlice';
import { clearMessages } from '../store/messageSlice';
import socketService from '../services/socket';
import DirectMessages from './DirectMessages';

interface DMUser {
  id: string;
  username: string;
  fullName: string;
  status: string;
}

interface SidebarProps {
  onSelectDM: (user: DMUser | null) => void;
  selectedDMUser: DMUser | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectDM, selectedDMUser }) => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace, channels, currentChannel } = useSelector(
    (state: RootState) => state.workspace
  );
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => { dispatch(fetchWorkspaces() as any); }, [dispatch]);

  useEffect(() => {
    if (currentWorkspace?.id) dispatch(fetchChannels(currentWorkspace.id) as any);
  }, [currentWorkspace?.id, dispatch]);

  const handleChannelClick = (channel: any) => {
    if (currentChannel) socketService.leaveChannel(currentChannel.id);
    onSelectDM(null); // deselect DM
    dispatch(clearMessages());
    dispatch(setCurrentChannel(channel));
    socketService.joinChannel(channel.id);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setModalError('');
    const result = await dispatch(createWorkspace({ name: workspaceName.trim() }) as any);
    if (result.payload?.id) {
      await dispatch(fetchChannels(result.payload.id) as any);
      setWorkspaceName('');
      setShowNewWorkspace(false);
    } else {
      setModalError(result.payload || 'Failed to create workspace');
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !currentWorkspace) return;
    setModalError('');
    const result = await dispatch(createChannel({ workspaceId: currentWorkspace.id, name: channelName.trim() }) as any);
    if (result.payload?.id) {
      socketService.joinChannel(result.payload.id);
      setChannelName('');
      setShowNewChannel(false);
    } else {
      setModalError(result.payload || 'Failed to create channel');
    }
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0">
      {/* Workspace header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <select
          className="bg-transparent text-white font-semibold text-sm flex-1 outline-none cursor-pointer"
          value={currentWorkspace?.id || ''}
          onChange={e => {
            const ws = workspaces.find(w => w.id === e.target.value);
            if (ws) dispatch(setCurrentWorkspace(ws));
          }}
        >
          {workspaces.length === 0 && <option value="">No workspaces</option>}
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id} className="bg-gray-800">{ws.name}</option>
          ))}
        </select>
        <button onClick={() => { setShowNewWorkspace(true); setModalError(''); }}
          className="ml-2 text-gray-400 hover:text-white text-xl">+</button>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-400 uppercase">Channels</span>
          <button onClick={() => { setShowNewChannel(true); setModalError(''); }}
            className="text-gray-400 hover:text-white text-lg">+</button>
        </div>
        {channels.map(channel => (
          <button
            key={channel.id}
            onClick={() => handleChannelClick(channel)}
            className={`w-full text-left px-2 py-1.5 rounded text-sm mb-0.5 ${
              currentChannel?.id === channel.id && !selectedDMUser ? 'bg-gray-600' : 'hover:bg-gray-700'
            }`}
          >
            # {channel.name}
          </button>
        ))}

        {/* Direct Messages */}
        <DirectMessages
          onSelectUser={onSelectDM}
          selectedUserId={selectedDMUser?.id || null}
        />
      </div>

      {/* New Workspace modal */}
      {showNewWorkspace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateWorkspace} className="bg-white rounded-lg p-6 w-80 space-y-4">
            <h3 className="text-gray-900 font-semibold">Create Workspace</h3>
            {modalError && <p className="text-xs text-red-500">{modalError}</p>}
            <input autoFocus type="text" value={workspaceName}
              onChange={e => setWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowNewWorkspace(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button type="submit"
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* New Channel modal */}
      {showNewChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateChannel} className="bg-white rounded-lg p-6 w-80 space-y-4">
            <h3 className="text-gray-900 font-semibold">Create Channel</h3>
            {modalError && <p className="text-xs text-red-500">{modalError}</p>}
            <div>
              <input autoFocus type="text" value={channelName}
                onChange={e => setChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                placeholder="channelname"
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Lowercase letters and numbers only</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowNewChannel(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button type="submit"
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
