"use client";

import { UserRole } from '@/types';
import { getNavigationCategories, getUserInitials } from './utils';

export var useNavbarUtils = (user: any) => ({
  getUserInitials: () => Promise.resolve(getUserInitials(user)),
  
  getNavigationCategories: () => Promise.resolve(getNavigationCategories(user)),
  
  getLogoClickPath: () => Promise.resolve(
    !user ? "/login" :
    user.role === 'admin' ? "/admin/statistics" :
    user.role === 'operator' ? "/operator/statistics" :
    "/login"
  ),
  
  getRoleColor: (role: string) => 
    role === 'admin' ? "red" : role === 'operator' ? "blue" : "gray",
  
  getRoleLabel: (role: string) => 
    role === 'admin' ? "Администратор" : 
    role === 'operator' ? "Оператор" : 
    role === 'visitor' ? "Посетитель" : role
});