'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { LucideProps } from 'lucide-react';

const DynamicIcons = {
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  MessageSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MessageSquare })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Users: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  LogOut: dynamic(() => import('lucide-react').then(mod => ({ default: mod.LogOut })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Menu: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Menu })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Search: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Search })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Send: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Send })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Paperclip: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Paperclip })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Eye: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Eye })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  EyeOff: dynamic(() => import('lucide-react').then(mod => ({ default: mod.EyeOff })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Camera: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Camera })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  }),
  Save: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Save })), {
    loading: () => <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />,
    ssr: false
  })
};

export type IconName = keyof typeof DynamicIcons;

interface DynamicIconProps extends LucideProps {
  name: IconName;
}

export const DynamicIcon: ComponentType<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = DynamicIcons[name];
  return <IconComponent {...props} />;
};

export default DynamicIcon;