import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RootState } from '../store';
import { fetchUserProfile, fetchUsers } from '../store/userSlice';
import { fetchWorkspaces } from '../store/workspaceSlice';
import { workspaceAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile } = useSelector((state: RootState) => state.user);
  const { workspaces, currentWorkspace, channels } = useSelector((state: RootState) => state.workspace);
  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    dispatch(fetchUserProfile() as any);
    dispatch(fetchWorkspaces() as any);
    dispatch(fetchUsers() as any);
  }, [dispatch]);

  const displayUser = profile || user;

  const handleCopyInvite = () => {
    if (!currentWorkspace) return;
    navigator.clipboard.writeText(currentWorkspace.id);
    toast.success('Workspace ID copied! Share it with your team.');
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    setJoining(true);
    try {
      await workspaceAPI.join(joinId.trim());
      dispatch(fetchWorkspaces() as any);
      toast.success('Joined workspace!');
      setJoinId('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to join workspace');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, {user?.fullName || user?.username}! 👋
        </h1>
        <p className="text-gray-500 text-sm">Ready to collaborate with your team?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Workspaces', value: workspaces.length, color: 'bg-blue-500' },
          { label: 'Channels', value: channels.length, color: 'bg-green-500' },
          { label: 'Team Members', value: currentWorkspace?.members?.length ?? 0, color: 'bg-purple-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 ${color} rounded-md flex items-center justify-center`}>
                <span className="text-white text-sm font-bold">{value}</span>
              </div>
              <p className="ml-4 text-sm font-medium text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>

        {/* Invite */}
          {currentWorkspace ? (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Share this Workspace ID to invite members:</p>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-white border border-gray-200 rounded px-2 py-1 flex-1 truncate">
                  {currentWorkspace.id}
                </code>
                <button
                  onClick={handleCopyInvite}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md">
              <p className="text-xs text-gray-600 mb-2">You don't have a workspace yet.</p>
              <Link to="/chat" className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Go to Chat → Create one
              </Link>
            </div>
          )}

          {/* Join workspace */}
          <form onSubmit={handleJoinWorkspace} className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Join a workspace with an ID:</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
                placeholder="Paste workspace ID"
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={joining || !joinId.trim()}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {joining ? '...' : 'Join'}
              </button>
            </div>
          </form>

          <Link to="/chat" className="inline-flex items-center text-sm text-blue-500 hover:underline">
            Go to Chat →
          </Link>
        </div>

        {/* Your Profile */}
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
          {displayUser ? (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {displayUser.fullName?.charAt(0) || displayUser.username?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{displayUser.fullName}</p>
                  <p className="text-sm text-gray-500">@{displayUser.username}</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900">{displayUser.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {displayUser.status || 'online'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Loading profile...</p>
          )}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-3">
          {[
            { step: 1, title: 'Create a workspace', desc: 'Click + next to the workspace name in the Chat sidebar' },
            { step: 2, title: 'Create a channel', desc: 'Click + next to Channels — letters and numbers only' },
            { step: 3, title: 'Invite team members', desc: 'Copy your Workspace ID above and share it — they paste it in "Join a workspace"' },
            { step: 4, title: 'Start messaging', desc: 'Select a channel and send messages in real-time' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start p-3 bg-blue-50 border border-blue-100 rounded-md">
              <div className="shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">{step}</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
              <Link to="/chat" className="text-xs text-blue-500 hover:underline ml-2 mt-0.5">Go →</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
