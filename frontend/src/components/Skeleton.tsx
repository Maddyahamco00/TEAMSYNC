import React from 'react';

export const SkeletonLine: React.FC<{ width?: string; height?: string }> = ({
  width = 'w-full', height = 'h-4'
}) => (
  <div className={`${width} ${height} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
);

export const SkeletonMessage: React.FC<{ isOwn?: boolean }> = ({ isOwn = false }) => (
  <div className={`flex space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
    <div className={`flex flex-col space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      <SkeletonLine width="w-20" height="h-3" />
      <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    </div>
  </div>
);

export const SkeletonMessages: React.FC = () => (
  <div className="p-4 space-y-4">
    <SkeletonMessage />
    <SkeletonMessage isOwn />
    <SkeletonMessage />
    <SkeletonMessage />
    <SkeletonMessage isOwn />
  </div>
);

export const SkeletonSidebarItem: React.FC = () => (
  <div className="flex items-center space-x-2 px-2 py-1.5">
    <SkeletonLine width="w-4" height="h-4" />
    <SkeletonLine width="w-24" height="h-4" />
  </div>
);
