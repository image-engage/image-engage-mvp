'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, Clock, ArrowRight, ListChecks, Smile } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/components/lib/api';
import { ApiResponse } from '../../../../backend/src/types';

export default function WorkflowPage() {
  const [stats, setStats] = useState({
    totalConsents: 0,
    waitingPatients: 0,
    photosToday: 0,
    completedSessions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      let apiPatients: any[] = [];
      try {
        const response = await api.get<ApiResponse<any[]>>('/photo-session/waiting-patients');
        apiPatients = Array.isArray(response?.data) ? response.data : [];
      } catch (error: any) {
        console.error('Error fetching waiting patients:', error);
        apiPatients = [];
      }

      let allSessions: any[] = [];
      try {
        const storedSessions = localStorage.getItem('patientSessions');
        if (storedSessions) {
          const parsed = JSON.parse(storedSessions);
          allSessions = Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.error('Error parsing stored sessions:', error);
        allSessions = [];
      }

      const newStats = {
        totalConsents: allSessions.length,
        waitingPatients: apiPatients.length,
        photosToday: allSessions.reduce((acc: number, session: any) => {
          if (!session || typeof session !== 'object') return acc;
          const beforePhotos = Array.isArray(session.beforePhotos) ? session.beforePhotos : [];
          const afterPhotos = Array.isArray(session.afterPhotos) ? session.afterPhotos : [];
          const allPhotos = [...beforePhotos, ...afterPhotos];
          return acc + allPhotos.filter((p: any) => {
            return p && p.timestamp && new Date(p.timestamp).toDateString() === new Date().toDateString();
          }).length;
        }, 0),
        completedSessions: allSessions.filter((s: any) => {
          if (!s || typeof s !== 'object') return false;
          const beforePhotos = Array.isArray(s.beforePhotos) ? s.beforePhotos : [];
          const afterPhotos = Array.isArray(s.afterPhotos) ? s.afterPhotos : [];
          const videos = Array.isArray(s.videos) ? s.videos : [];
          return beforePhotos.length > 0 && afterPhotos.length > 0 && videos.length > 0;
        }).length,
      };
      setStats(newStats);
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Workflow</h1>
        <p className="text-gray-600 mt-2">Manage patient consent and photo capture sessions</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Link href="/dashboard/consents" className="cursor-pointer">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold text-gray-900">{stats.totalConsents}</p>
                <p className="text-sm text-indigo-600 font-medium mt-1">Total Consents</p>
              </div>
              <FileText className="h-8 w-8 text-indigo-400 opacity-50" />
            </CardContent>
          </Card>
        </Link>

        <Card className="border-l-4 border-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{stats.photosToday}</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">Photos Today</p>
            </div>
            <Smile className="h-8 w-8 text-emerald-400 opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-cyan-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{stats.completedSessions}</p>
              <p className="text-sm text-cyan-600 font-medium mt-1">Completed Sessions</p>
            </div>
            <CheckCircle className="h-8 w-8 text-cyan-400 opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{stats.waitingPatients}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">Waiting Patients</p>
            </div>
            <Clock className="h-8 w-8 text-amber-400 opacity-50" />
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Actions */}
      <div className="flex justify-center">
        {/* Patient Queue */}
        <Card className="shadow-lg border-2 border-amber-100 w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-amber-700">
              <ListChecks className="h-6 w-6 text-amber-500" />
              Continue Patient Session
            </CardTitle>
            <CardDescription>
              Access the queue to complete photo capture for patients who have signed consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <span className="text-lg font-semibold text-amber-800">
                Patients Waiting:
              </span>
              <Badge className="bg-amber-500 text-white text-xl font-bold px-4 py-1">
                {stats.waitingPatients}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600">
              This workflow is used when a patient has completed their consent and is ready for the next step (e.g., before photos, after photos).
            </p>

            <Link href="/dashboard/workflow/patient-queue" className="block">
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                size="lg"
                disabled={stats.waitingPatients === 0}
              >
                View Patient Queue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}