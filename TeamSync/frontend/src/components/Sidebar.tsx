import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchWorkspaces, fetchChannels, setCurrentChannel } from '../store/workspaceSlice';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace, channels, currentChannel } = useSelector(
    (state: RootState) => state.workspace
  );

  useEffect(() => {
    dispatch(fetchWorkspaces() as any);
  }, [dispatch]);

  useEffect(() => {
    if (currentWorkspace) {
      dispatch(fetchChannels(currentWorkspace.id) as any);
    }
  }, [currentWorkspace, dispatch]);

  const handleChannelClick = (channel: any) => {
    dispatch(setCurrentChannel(channel));
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">
          {currentWorkspace?.name || 'TeamSync'}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Channels</h3>
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                  currentChannel?.id === channel.id ? 'bg-gray-700' : ''
                }`}
              >
                # {channel.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;