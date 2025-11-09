'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Download, X, CheckCircle, FileText, ChevronLeft, ChevronRight, Loader2, View } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { api, ApiError, ApiResponse } from '@/components/lib/api';

interface PatientConsent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  procedure_type: string;
  consent_date: string;
  status: 'completed' | 'pending';
  signature_data: string | null;
  created_at: string;
}

export default function ConsentsPage() {
  const [consents, setConsents] = useState<PatientConsent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [totalConsents, setTotalConsents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchConsents = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('status', 'completed');
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      queryParams.append('sortBy', 'newest');
      queryParams.append('page', String(currentPage));
      queryParams.append('limit', String(itemsPerPage));

      const response: ApiResponse<{ consents: PatientConsent[]; total: number; totalPages: number }> = 
        await api.get(`/consents?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        setConsents(response.data.consents);
        setTotalConsents(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        toast.error(response.message2 || 'Failed to load consent forms.');
      }
    } catch (err) {
      console.error('Error fetching consents:', err);
      toast.error('Failed to load consent forms.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
  };

  const handleDownload = async (consent: PatientConsent, download: boolean = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get<ApiResponse>(`/consents/${consent.id}/download`, token || undefined);
      
      if (response.success && response.data?.url) {
        const url = response.data.url;
        
        if (download) {
          // For data URLs, create a downloadable file
          if (url.startsWith('data:')) {
            const a = document.createElement('a');
            a.href = url;
            a.download = `consent_${consent.firstName}_${consent.lastName}.html`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            // For regular URLs, fetch and download
            const fileResponse = await fetch(url);
            const blob = await fileResponse.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `consent_${consent.firstName}_${consent.lastName}.pdf`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
          }
        } else {
          // For viewing, open in new tab
          window.open(url, '_blank');
        }
        
        toast.success(download ? 'Consent form downloaded successfully!' : 'Consent form opened in new tab!');
      } else {
        toast.error('Failed to access consent form.');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to access consent form.');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this consent? This action cannot be undone.')) {
      return;
    }

    try {
      const response: ApiResponse = await api.delete(`/consents/${id}`);
      
      if (response.success) {
        toast.success('Consent revoked successfully!');
        fetchConsents();
      } else {
        toast.error(response.message2 || 'Failed to revoke consent.');
      }
    } catch (err) {
      console.error('Revoke error:', err);
      toast.error('Failed to revoke consent.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading consents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Completed Consent Forms</h1>
          <p className="text-gray-600 mt-2">Download and manage completed patient consents</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Consents</CardTitle>
          <CardDescription>Find consent forms by patient name, email, or procedure type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search patients by name, email, or procedure..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consent Forms ({totalConsents})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No completed consent forms found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Procedure</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.map((consent) => (
                    <TableRow key={consent.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{consent.firstName} {consent.lastName}</div>
                          <div className="text-sm text-gray-500">{consent.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{consent.procedure_type}</TableCell>
                      <TableCell>{format(new Date(consent.consent_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(consent)}
                          >
                            <View className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(consent, true)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(consent.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalConsents)} of {totalConsents} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}