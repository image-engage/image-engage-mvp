'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Settings, LogOut, User as UserIcon, ChevronDown, Monitor } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Function to generate a title from the current pathname
const getPageTitle = (pathname: string): string => {
  const parts = pathname.split('/').filter(p => p && p !== 'dashboard');
  
  if (parts.length === 0 || pathname === '/dashboard') return 'Dashboard';
  
  const lastPart = parts[parts.length - 1];
  
  // Custom mapping for common path names
  const titleMap: { [key: string]: string } = {
    'workflow': 'Capture Session',
    'setup-settings': 'Platform Settings',
    // Add more custom mappings here
  };
  
  if (titleMap[lastPart]) return titleMap[lastPart];

  return lastPart
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // Clear all authentication and user-related items
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token'); 
    localStorage.removeItem('hasGoogleDriveAccess'); 
    localStorage.removeItem('practice'); 

    toast.success('Logged out successfully');
    
    router.push('/login');
  };

  if (!user) return null;

  // ------------------------------------------------------------------
  // FIX: Defensive coding to prevent 'Cannot read properties of undefined (reading 'charAt')'
  // If firstName or lastName is null/undefined/empty, use a '?' fallback.
  const firstInitial = user.firstName && user.firstName.length > 0 ? user.firstName.charAt(0).toUpperCase() : '?';
  const lastInitial = user.lastName && user.lastName.length > 0 ? user.lastName.charAt(0).toUpperCase() : '?';
  
  const initials = firstInitial + lastInitial;
  // ------------------------------------------------------------------

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Page Title / Breadcrumb Section */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 leading-tight">
            {pageTitle}
          </h2>
        </div>
        
        {/* User Actions and Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Notifications Button (Refined Look) */}
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-600 hover:bg-gray-100 relative rounded-full"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
          </Button>

          {/* Theme Toggle (Example) */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-600 hover:bg-gray-100 rounded-full hidden sm:flex"
            aria-label="Toggle Theme"
          >
            <Monitor className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* Refined Trigger Button */}
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-blue-500/50">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="hidden md:flex flex-col text-left leading-none">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64 shadow-xl">
              <DropdownMenuLabel className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex flex-col">
                  <p className="font-semibold text-base text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className='m-0 p-0' />
              
              <DropdownMenuItem className='py-2 hover:bg-blue-50 hover:text-blue-600'>
                <UserIcon className="mr-2 h-4 w-4 opacity-70" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem className='py-2 hover:bg-blue-50 hover:text-blue-600'>
                <Settings className="mr-2 h-4 w-4 opacity-70" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50/50 hover:text-red-700 font-medium py-2">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}