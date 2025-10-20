'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Image as ImageIcon, TrendingUp, Calendar, Clock, Archive, QrCode, Camera, ArrowRight, Activity, ClipboardList } from 'lucide-react'; // Added icons, renamed Image
import { api } from '@/components/lib/api';
import Link from 'next/link'; // Added Link for quick actions

// Define a type for the API response
interface UserProfile {
  first_name: string;
  last_name: string;
  practice_data: {
    name: string;
  };
}

// Define types for the new dashboard data
interface KpiCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface KpiData {
  todayConsents: number;
  sessionsInProgress: number;
}

interface QuickAction {
  title: string;
  icon: React.ElementType;
  description: string;
  href: string; 
  buttonColor: string; // New property for visual distinction
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KpiData>({ todayConsents: 0, sessionsInProgress: 0 });
  const [kpiLoading, setKpiLoading] = useState(true);

  // KPI cards configuration
  const kpiCards: KpiCard[] = [
    {
      title: 'Today\'s New Consents',
      value: kpiData.todayConsents,
      description: 'Signed in the last 24 hours',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Sessions In Progress',
      value: kpiData.sessionsInProgress,
      description: 'Photo capture not finished',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    }
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Start New Session',
      icon: Camera,
      description: 'Initiate photo/video capture for a patient.',
      href: '/dashboard/workflow',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700', // Primary Action
    },
    {
      title: 'View Consent Queue',
      icon: ClipboardList,
      description: 'Review and manage patients waiting for photos.',
      href: '/dashboard/workflow/patient-queue',
      buttonColor: 'bg-orange-500 hover:bg-orange-600', // Secondary Action
    },
    {
      title: 'View media',
      icon: Archive,
      description: 'View completed Sessions',
      href: 'completed-sessions',
      buttonColor: 'bg-gray-700 hover:bg-gray-800', // Tertiary Action
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch KPI data
        const kpiResponse = await api.get('/dashboard/kpi', token) as { success: boolean; data: KpiData };
        if (kpiResponse.success) {
          setKpiData(kpiResponse.data);
        }
        setKpiLoading(false);

        // Mock user data for now
        const mockData: UserProfile = {
          first_name: 'Dr.',
          last_name: 'Patel',
          practice_data: {
            name: 'Dental Associates of Springfield',
          },
        };
        setUserData(mockData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setKpiLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8 lg:p-10">
      {/* Header and Greeting */}
      <div className="pb-8 border-b border-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Hello, {isLoading ? 'Loading...' : userData?.first_name || 'Admin'}!
        </h1>
        <p className="text-xl text-gray-500 mt-1">
          {isLoading ? 'Fetching practice data...' : 
           userData?.practice_data ? `${userData.practice_data.name} Dashboard Overview` : 
           'ImageEngage AI Admin Console'
          }
        </p>
      </div>

      {/* Main Grid: Quick Actions (Lg) + Activity Feed (Sm) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        
        {/* LEFT COLUMN (2/3 width) - Quick Actions & KPIs */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions - Prominent Cards */}
            <h2 className="text-2xl font-semibold text-gray-700">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link href={action.href} key={action.title} className="block">
                            <Card className={`h-full hover:shadow-lg transition-shadow duration-300 border-l-4 ${action.buttonColor.includes('indigo') ? 'border-indigo-500' : action.buttonColor.includes('orange') ? 'border-orange-500' : 'border-gray-500'}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className={`p-3 rounded-full text-white ${action.buttonColor}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-xl font-bold text-gray-800">{action.title}</CardTitle>
                                    </div>
                                    <CardDescription className="text-sm text-gray-500 mt-2">
                                        {action.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* KPI Cards Section - Streamlined */}
            <h2 className="text-2xl font-semibold text-gray-700 pt-4">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {kpiCards.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <Card key={kpi.title} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                                        <Icon className={`h-5 w-5 ${kpi.color}`} />
                                    </div>
                                    <CardTitle className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                                        {kpi.title}
                                    </CardTitle>
                                </div>
                                <div className="mt-3">
                                    <div className="text-3xl font-extrabold text-gray-900">
                                        {kpiLoading ? '...' : kpi.value}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{kpi.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>

        {/* RIGHT COLUMN (1/3 width) - Activity Feed / Analytics */}
        <div className="lg:col-span-1 space-y-8">
            
            {/* Recent Activity/Analytics Card */}
            {/* <Card className="shadow-xl border-t-4 border-indigo-500 h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl text-indigo-700">
                        <Activity className="h-5 w-5" />
                        Platform Activity
                    </CardTitle>
                    <CardDescription>Metrics and recent engagement insights.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-3">
                        <p className="text-sm font-medium text-gray-600">Clicks on Showcases (7 Days)</p>
                        <div className="text-2xl font-bold text-gray-900">458</div>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3">
                        <p className="text-sm font-medium text-gray-600">Booked Appointments via Link</p>
                        <div className="text-2xl font-bold text-gray-900">12</div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <p className="text-base font-semibold text-gray-700">Top Performing Content</p>
                        <ul className="text-sm text-gray-500 space-y-2">
                            <li className="flex items-start">
                                <ArrowRight className="h-4 w-4 mt-1 mr-2 text-indigo-500 flex-shrink-0" />
                                <span>Teeth Whitening Before/After</span>
                            </li>
                            <li className="flex items-start">
                                <ArrowRight className="h-4 w-4 mt-1 mr-2 text-indigo-500 flex-shrink-0" />
                                <span>Orthodontic Progress #1245</span>
                            </li>
                            <li className="flex items-start">
                                <ArrowRight className="h-4 w-4 mt-1 mr-2 text-indigo-500 flex-shrink-0" />
                                <span>Veneer Consultation Guide</span>
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card> */}
        </div>
      </div>
    </div>
  );
}