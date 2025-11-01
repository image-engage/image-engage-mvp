'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QualityStats {
  averageScore: number;
  totalPhotos: number;
  passRate: number;
  commonIssues: string[];
  trendDirection: 'up' | 'down' | 'stable';
}

interface QualityDashboardProps {
  stats: QualityStats;
  className?: string;
}

export default function QualityDashboard({ stats, className = '' }: QualityDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = () => {
    switch (stats.trendDirection) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Photo Quality Analytics
        </CardTitle>
        <CardDescription>
          Quality metrics and trends for your practice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Overall Score */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Quality Score</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold">{stats.averageScore}</span>
              <span className="text-gray-500">/100</span>
              {getTrendIcon()}
            </div>
          </div>
          <Badge className={getScoreColor(stats.averageScore)}>
            {stats.averageScore >= 80 ? 'Excellent' : 
             stats.averageScore >= 60 ? 'Good' : 'Needs Improvement'}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Quality Progress</span>
            <span>{stats.averageScore}%</span>
          </div>
          <Progress 
            value={stats.averageScore} 
            className="h-3"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalPhotos}</div>
            <div className="text-sm text-gray-600">Total Photos</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.passRate}%</div>
            <div className="text-sm text-gray-600">Pass Rate</div>
          </div>
        </div>

        {/* Common Issues */}
        {stats.commonIssues.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Common Quality Issues
            </p>
            <div className="space-y-1">
              {stats.commonIssues.slice(0, 3).map((issue, index) => (
                <div key={index} className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  • {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Tips */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-800 flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            Quality Tips
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Ensure adequate lighting (brightness 40-80)</li>
            <li>• Hold camera steady for sharpness</li>
            <li>• Use grid overlay for better composition</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}