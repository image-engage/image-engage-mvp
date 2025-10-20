'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '../../components/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Upload, Image, Menu, X, Settings, BookOpen, Star, Bot, Calendar, Archive, Code, BarChart3, User, LogOut } from 'lucide-react';
import { api } from '../../components/lib/api';
import { toast } from 'sonner';

// 1. Define the type for a single navigation item
interface NavItem {
    name: string;
    href: string;
    icon: any; // Using 'any' for the icon since it's a React component from 'lucide-react'
}

// 2. Explicitly type the arrays using the defined interface
const primaryNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Capture Media', href: '/dashboard/workflow', icon: FileText },
  { name: 'View Media', href: '/dashboard/completed-sessions', icon: FileText },
  { name: 'View Consents', href: '/dashboard/consents', icon: FileText },
];

const secondaryNavigation: NavItem[] = [
  // Example of a secondary group for settings/admin tools
  // { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  // { name: 'User Management', href: '/dashboard/users', icon: User },
];

const settingsNavigation: NavItem[] = [
  { name: 'Settings', href: '/dashboard/setup-settings', icon: Settings },
  // { name: 'Resources', href: '/dashboard/resources', icon: BookOpen },
];


export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [practiceName, setPracticeName] = useState('Image Engage AI');
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('hasGoogleDriveAccess');
    localStorage.removeItem('practice');
    
    toast.success('Logged out successfully');
    router.push('/login');
  };

  useEffect(() => {
    const fetchPracticeName = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response: any = await api.get('/user/profile', token);
          if (response.success && response.data?.practice_data?.name) {
            setPracticeName(response.data.practice_data.name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch practice name:', error);
      }
    };

    fetchPracticeName();
  }, []);

  // 3. Update the NavigationLink prop type to use the new interface
  const NavigationLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out group",
          isActive
            ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
            : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
        )}
      >
        <item.icon className={cn(
          "mr-3 h-5 w-5 transition-colors duration-150",
          isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600"
        )} />
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile menu button (Improved style) */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="default"
          size="icon"
          className='rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-50 transition-opacity duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Modernized Look) */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo and Practice Name Section (Elevated Style) */}
        <div className="flex flex-col items-center px-6 py-6 border-b border-gray-100 bg-gray-50/50">
          <div className="p-1.5 rounded-xl border border-blue-100 bg-white shadow-sm flex items-center justify-center">
            <img
              src="/image-engage-logo.png"
              alt="ImageEngage AI Logo"
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{practiceName}</h1>
            <p className="text-xs text-blue-600 font-semibold tracking-wide uppercase mt-1">Admin Portal</p>
          </div>
        </div>

        {/* Navigation - Grouped and Spaced */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {/* Primary Navigation */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-1">Main</p>
            {primaryNavigation.map((item) => <NavigationLink key={item.name} item={item} />)}
          </div>

          {/* Secondary Navigation (If uncommented) */}
          {secondaryNavigation.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-1">Tools</p>
              {secondaryNavigation.map((item) => <NavigationLink key={item.name} item={item} />)}
            </div>
          )}

           {/* Settings Navigation */}
           {settingsNavigation.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-1">Configuration</p>
              {settingsNavigation.map((item) => <NavigationLink key={item.name} item={item} />)}
            </div>
          )}
        </nav>

        {/* Footer (Simplified and includes a Log Out button) */}
        <div className="p-4 border-t border-gray-100 flex flex-col space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:bg-red-50/50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
          <div className="text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} {practiceName}
            </p>
            <p className="text-xs text-gray-400">
              Dental Marketing Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
}