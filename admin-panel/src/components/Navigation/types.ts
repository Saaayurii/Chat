import { UserRole } from '@/types';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: (keyof typeof UserRole)[];
  category?: string;
}

export interface NavCategory {
  name: string;
  items: NavItem[];
  roles: (keyof typeof UserRole)[];
}