import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logoutUser } from '../store/authSlice';
import { addNotification, markNotificationsRead } from '../store/messageSlice';
import { notificationsAPI, searchAPI } from '../services/api';
import { toggleDarkMode } from '../store/uiSlice';

const Layout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications } = useSelector((state: RootState) => state.message);
  const { currentWorkspace } = useSelector((state: RootState) => state.workspace);
  const { darkMode } = useSelector((state: RootState) => state.ui);
  const isChat = location.pathname === '/chat';

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications on mount
  useEffect(() => {
    notificationsAPI.getAll().then(res => {
      res.data.data.forEach((n: any) => dispatch(addNotification(n)));
    }).catch(() => {});
  }, [dispatch]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchAPI.messages(searchQuery, currentWorkspace?.id);
        setSearchResults(res.data.data);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  }, [searchQuery, currentWorkspace?.id]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery(''); setSearchResults([]);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async () => {
    await notificationsAPI.markRead();
    dispatch(markNotificationsRead());
  };

  const handleLogout = () => dispatch(logoutUser() as any);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 gap-4">
            {/* Left: Logo + Nav */}
            <div className="flex items-center space-x-6 flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">TeamSync</h1>
              <nav className="flex space-x-1">
                {[{ to: '/dashboard', label: 'Dashboard' }, { to: '/chat', label: 'Chat' }].map(({ to, label }) => (
                  <Link key={to} to={to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === to
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >{label}</Link>
                ))}
              </nav>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(searchResults.length > 0 || searching) && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                  {searching && <p className="text-xs text-gray-400 p-3">Searching...</p>}
                  {!searching && searchResults.map(msg => (
                    <button
                      key={msg.id}
                      onClick={() => { navigate('/chat'); setSearchQuery(''); setSearchResults([]); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-xs font-medium text-gray-700">{msg.username}</p>
                      <p className="text-sm text-gray-900 truncate">{msg.content}</p>
                      <p className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</p>
                    </button>
                  ))}
                  {!searching && searchResults.length === 0 && searchQuery && (
                    <p className="text-xs text-gray-400 p-3">No results found</p>
                  )}
                </div>
              )}
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Dark mode toggle */}
              <button
                onClick={() => dispatch(toggleDarkMode())}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setShowNotifications(v => !v); if (!showNotifications) handleMarkRead(); }}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkRead} className="text-xs text-blue-500 hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 && (
                      <p className="text-xs text-gray-400 p-4 text-center">No notifications yet</p>
                    )}
                    {notifications.map(n => (
                      <div key={n.id} className={`px-3 py-2 border-b border-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                        <p className="text-xs font-medium text-gray-700">
                          <span className="text-blue-600">@{n.fromUsername}</span> mentioned you
                        </p>
                        <p className="text-sm text-gray-800 truncate">{n.content}</p>
                        <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User avatar */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.fullName || user?.username}
                </span>
              </div>

              <button onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {isChat ? <Outlet /> : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default Layout;
