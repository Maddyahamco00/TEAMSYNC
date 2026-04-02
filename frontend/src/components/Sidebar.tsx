import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  fetchWorkspaces, fetchChannels, setCurrentChannel,
  createWorkspace, createChannel, setCurrentWorkspace
} from '../store/workspaceSlice';
import socketService from '../services/socket';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace, channels, currentChannel } = useSelector(
    (state: RootState) => state.workspace
  );

  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [channelName, setChannelName] = useState('');

  useEffect(() => {
    dispatch(fetchWorkspaces() as any);
  }, [dispatch]);

  useEffect(() => {
    if (currentWorkspace) dispatch(fetchChannels(currentWorkspace.id) as any);
  }, [currentWorkspace, dispatch]);

  const handleChannelClick = (channel: any) => {
    if (currentChannel) socketService.leaveChannel(currentChannel.id);
    dispatch(setCurrentChannel(channel));
    socketService.joinChannel(channel.id);
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    dispatch(createWorkspace({ name: workspaceName.trim() }) as any);
    setWorkspaceName('');
    setShowNewWorkspace(false);
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !currentWorkspace) return;
    dispatch(createChannel({ workspaceId: currentWorkspace.id, name: channelName.trim() }) as any);
    setChannelName('');
    setShowNewChannel(false);
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0">
      {/* Workspace header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
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
          <button
            onClick={() => setShowNewWorkspace(true)}
            className="ml-2 text-gray-400 hover:text-white text-xl leading-none"
            title="New workspace"
          >+</button>
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</span>
          <button
            onClick={() => setShowNewChannel(true)}
            className="text-gray-400 hover:text-white text-lg leading-none"
            title="New channel"
          >+</button>
        </div>

        <div className="space-y-0.5">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => handleChannelClick(channel)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                currentChannel?.id === channel.id
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              # {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* New Workspace modal */}
      {showNewWorkspace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateWorkspace} className="bg-white rounded-lg p-6 w-80 space-y-4">
            <h3 className="text-gray-900 font-semibold text-lg">Create Workspace</h3>
            <input
              autoFocus
              type="text"
              value={workspaceName}
              onChange={e => setWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-2 justify-end">
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
            <h3 className="text-gray-900 font-semibold text-lg">Create Channel</h3>
            <input
              autoFocus
              type="text"
              value={channelName}
              onChange={e => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="channel-name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-2 justify-end">
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
