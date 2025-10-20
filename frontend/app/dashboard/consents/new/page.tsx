'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Save, RotateCcw, BookOpen, Plus, X, FileText, Video, Image, Pencil, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import SignaturePad from 'signature_pad';
import { Separator } from '@/components/ui/separator';
import SignatureCaptureComponent from '@/components/SignatureCaptureComponent';

// Import your custom api utility and the ApiError class
import { api, ApiError } from '@/components/lib/api';
// Adjust the path as per your project structure

// Assuming you have these types defined in a types file, e.g., '@/types'
// If not, you'll need to define them or adjust the imports
// If ConsentForm is also a type used, import it too:
// import type { ConsentForm } from '@/types';


const procedureTypes = [
  'Teeth Whitening',
  'Dental Implant',
  'Orthodontics',
  'Root Canal',
  'Crown/Bridge',
  'Periodontal Treatment',
  'Oral Surgery',
  'Cosmetic Dentistry',
  'Preventive Care',
  'Other'
];

interface ApiResponse<T = any> {
  success: boolean;
  message2: string; // Your backend uses message2
  data?: T;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  contentType: 'article' | 'pdf' | 'video' | 'image';
  category: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Mock Content Library (same as detail page for consistency)
const mockContentLibrary: ContentItem[] = [
  {
    id: 'c1', title: 'Understanding Teeth Whitening', description: 'A comprehensive guide to professional teeth whitening procedures and aftercare.', contentType: 'pdf', category: 'General', fileName: 'teeth_whitening.pdf', fileSize: 1.2, filePath: '/content/teeth_whitening.pdf', tags: ['teeth-whitening', 'cosmetic-dentistry'], isActive: true, createdBy: 'Admin', createdAt: '2023-01-01', updatedAt: '2023-01-01'
  },
  {
    id: 'c2', title: 'Dental Implants: What to Expect', description: 'Video explaining the dental implant process from consultation to recovery.', contentType: 'video', category: 'Implants', fileName: 'dental_implant_video.mp4', fileSize: 25.5, filePath: '/content/dental_implant_video.mp4', tags: ['dental-implant', 'oral-surgery'], isActive: true, createdBy: 'Admin', createdAt: '2023-02-01', updatedAt: '2023-02-01'
  },
  {
    id: 'c3', title: 'Invisalign Treatment Journey', description: 'An interactive article on the benefits and process of Invisalign clear aligners.', contentType: 'article', category: 'Orthodontics', fileName: 'invisalign_article.html', fileSize: 0.8, filePath: '/content/invisalign_article.html', tags: ['orthodontics', 'invisalign'], isActive: true, createdBy: 'Admin', createdAt: '2023-03-01', updatedAt: '2023-03-01'
  },
  {
    id: 'c4', title: 'Post-Procedure Care for Root Canals', description: 'Important tips for care after a root canal procedure.', contentType: 'pdf', category: 'General', fileName: 'root_canal_care.pdf', fileSize: 0.5, filePath: '/content/root_canal_care.pdf', tags: ['root-canal'], isActive: true, createdBy: 'Admin', createdAt: '2023-04-01', updatedAt: '2023-04-01'
  },
  {
    id: 'c5', title: 'Crowns vs. Veneers: Which is Right for You?', description: 'A comparison guide to help patients decide between crowns and veneers.', contentType: 'article', category: 'Cosmetic', fileName: 'crowns_vs_veneers.html', fileSize: 1.1, filePath: '/content/crowns_vs_veneers.html', tags: ['cosmetic-dentistry', 'crown-bridge', 'veneers'], isActive: true, createdBy: 'Admin', createdAt: '2023-05-01', updatedAt: '2023-05-01'
  },
  {
    id: 'c6', title: 'Why Regular Check-ups are Important', description: 'An infographic about the benefits of routine dental check-ups.', contentType: 'image', category: 'Preventive', fileName: 'checkup_infographic.png', fileSize: 0.3, filePath: '/content/checkup_infographic.png', tags: ['preventive-care'], isActive: true, createdBy: 'Admin', createdAt: '2023-06-01', updatedAt: '2023-06-01'
  }
];

export default function NewConsentPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  const handleSignatureCaptured = (dataUrl: string | null) => {
    setFormData(prev => ({
      ...prev,
      signatureData: dataUrl
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '', // Added Date of Birth
    email: '',
    phone: '',
    procedureType: '',
    notes: '',
    consentDate: new Date().toISOString().split('T')[0], // Added Date of Consent, defaults to today
    signatureData: null as string | null,
  });
  const [formErrors, setFormErrors] = useState({
    firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '', procedureType: '', signature: '', consentDate: ''
  });

  const [contentLibrary] = useState<ContentItem[]>(mockContentLibrary);
  const [sharedContent, setSharedContent] = useState<ContentItem[]>([]);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
      });
      signaturePadRef.current.removeEventListener('beginStroke', () => {
        setFormErrors(prev => ({ ...prev, signature: '' }));
      });
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, []);

  useEffect(() => {
    let filtered = contentLibrary.filter(item => item.isActive);

    if (formData.procedureType) {
      const procedureTag = formData.procedureType.toLowerCase().replace(/\s+/g, '-');
      filtered = filtered.filter(item =>
        item.tags.includes(procedureTag) ||
        item.category.toLowerCase().includes('general') ||
        item.category.toLowerCase().includes('faq')
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    filtered = filtered.filter(item => !sharedContent.some(shared => shared.id === item.id));

    setFilteredContent(filtered);
  }, [contentLibrary, formData.procedureType, searchTerm, sharedContent]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, procedureType: value }));
    setFormErrors(prev => ({ ...prev, procedureType: '' }));
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setFormErrors(prev => ({ ...prev, signature: 'Please provide a signature.' }));
    }
  };

  const addContentToShare = (content: ContentItem) => {
    if (!sharedContent.find(item => item.id === content.id)) {
      setSharedContent(prev => [...prev, content]);
      toast.success(`Added "${content.title}" to shared content`);
    } else {
      toast.info('Content already added');
    }
  };

  const removeSharedContent = (contentId: string) => {
    setSharedContent(prev => prev.filter(item => item.id !== contentId));
    toast.info('Content removed from shared list.');
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-600" />;
      case 'video': return <Video className="h-4 w-4 text-blue-600" />;
      case 'image': return <Image className="h-4 w-4 text-green-600" />;
      case 'article': return <BookOpen className="h-4 w-4 text-purple-600" />;
      default: return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '', procedureType: '', signature: '', consentDate: ''
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required.';
      isValid = false;
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required.';
      isValid = false;
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required.';
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required.';
      isValid = false;
    }
    if (!formData.procedureType.trim()) {
      newErrors.procedureType = 'Procedure Type is required.';
      isValid = false;
    }
    if (!formData.consentDate) {
      newErrors.consentDate = 'Consent Date is required.';
      isValid = false;
    }
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      newErrors.signature = 'Please provide a signature.';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    setIsSaving(true);
    const signatureData = signaturePadRef.current!.toDataURL();

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth, // Included in payload
      email: formData.email,
      phone: formData.phone,
      procedureType: formData.procedureType,
      notes: formData.notes,
      consentDate: formData.consentDate, // Included in payload
      signatureData: signatureData,
      sharedContent: sharedContent.map(content => ({
        id: content.id,
        title: content.title,
        contentType: content.contentType,
        sharedAt: new Date().toISOString()
      }))
    };

    try {
      // This is the API call to your backend's consent.controller.
      // The `api.post` method sends the payload to the `/consents` endpoint.
      const response: ApiResponse = await api.post('/consents', payload);

      if (response.success) {
        toast.success(response.message2 || 'Consent form saved successfully!');
        router.push('/dashboard/consents');
      } else {
        toast.error(response.message2 || 'Failed to save consent form. Please try again.');
      }
    } catch (error) {
      console.error('API call error:', error);
      let errorMessage = 'Failed to save consent form. Please try again.';

      if (error instanceof ApiError) {
        errorMessage = error.responseBody?.message2 || `API Error (${error.statusCode}): ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `An unexpected error occurred: ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/consents">
          <Button variant="outline" size="sm" aria-label="Back to Consents">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Consents
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Consent Form</h1>
          <p className="text-gray-600 mt-2">Create a new patient consent form and capture digital signature</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Enter the patient's details for the consent form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Patient's first name"
                  required
                />
                {formErrors.firstName && <p className="text-red-500 text-sm">{formErrors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Patient's last name"
                  required
                />
                {formErrors.lastName && <p className="text-red-500 text-sm">{formErrors.lastName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  required
                />
                {formErrors.dateOfBirth && <p className="text-red-500 text-sm">{formErrors.dateOfBirth}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="patient@example.com"
                  required
                />
                {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(123) 456-7890"
                  required
                />
                {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="consentDate">Date of Consent <span className="text-red-500">*</span></Label>
                <Input
                  id="consentDate"
                  type="date"
                  value={formData.consentDate}
                  onChange={(e) => handleInputChange('consentDate', e.target.value)}
                  required
                />
                {formErrors.consentDate && <p className="text-red-500 text-sm">{formErrors.consentDate}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Procedure Details */}
        <Card>
          <CardHeader>
            <CardTitle>Procedure Details</CardTitle>
            <CardDescription>Select the type of dental procedure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="procedureType">Procedure Type <span className="text-red-500">*</span></Label>
              <Select value={formData.procedureType} onValueChange={handleSelectChange}>
                <SelectTrigger id="procedureType" className={formErrors.procedureType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a procedure type" />
                </SelectTrigger>
                <SelectContent>
                  {procedureTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.procedureType && <p className="text-red-500 text-sm">{formErrors.procedureType}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any specific notes about this consent or procedure..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Patient Photo Consent and Release */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Photo Consent and Release</CardTitle>
            <CardDescription>
              Please read the following carefully before providing your signature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>I, the undersigned patient, hereby grant **[Your Dental Practice Name]**, and its employees, agents, and representatives (collectively, "the Practice"), permission to take photographs, digital images, and/or videos ("Images") of my face, mouth, and/or teeth.</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Purpose of Images:</h3>
              <p>I understand and agree that these Images are being taken for the following purposes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>**Treatment Documentation:** To document my dental condition, treatment progress, and the results of my dental procedures. These Images will become part of my confidential dental record.</li>
                <li>**Internal Education and Quality Improvement:** To be used for internal educational purposes within the Practice, such as staff training and case discussions, to improve the quality of care provided.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Confidentiality and Privacy:</h3>
              <p>I understand that all Images will be treated with the same confidentiality as my other protected health information (PHI) under the Health Insurance Portability and Accountability Act (HIPAA) and other applicable privacy laws. The Practice will implement reasonable safeguards to protect the privacy and security of these Images.</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">No Identification for External Use:</h3>
              <p>I understand and agree that my Images will **not** be used for external purposes (e.g., marketing, social media, website, publications, lectures) in a way that would identify me without my separate, specific, and explicit written consent. If the Practice wishes to use my Images for any external purpose where I might be identifiable, I understand they will request a separate consent form for that specific use.</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Waiver and Release of Liability:</h3>
              <p>I hereby release, discharge, and hold harmless **[Your Dental Practice Name]**, its officers, directors, employees, agents, and representatives, from any and all claims, demands, actions, causes of action, and/or liabilities whatsoever arising out of or related to the taking, use, or storage of these Images, provided that such actions are in accordance with the terms of this consent and applicable laws.</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Right to Revoke Consent:</h3>
              <p>I understand that I have the right to revoke this consent at any time by providing written notice to the Practice. Revocation of consent will only apply to future use of the Images and will not affect any actions taken by the Practice in reliance on this consent prior to its revocation.</p>

              <p className="mt-4">**Understanding and Agreement:** I have read this Consent and Release Form, understand its contents, and agree to the terms herein. I have been given the opportunity to ask questions and have received satisfactory answers.</p>
            </div>
          </CardContent>
        </Card>

        {/* Shared Educational Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Share Educational Content</CardTitle>
                <CardDescription>Select relevant content to share with the patient.</CardDescription>
              </div>
              <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Select Educational Content</DialogTitle>
                    <DialogDescription>
                      Choose content from your library to share with the patient.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Search content by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {filteredContent.length > 0 ? (
                        filteredContent.map((content) => (
                          <Card key={content.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {getContentIcon(content.contentType)}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm line-clamp-2">{content.title}</h4>
                                    <p className="text-xs text-gray-600">{content.category}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {content.contentType}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-3">{content.description}</p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => addContentToShare(content)}
                              >
                                Add to Share List
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="md:col-span-2 text-center text-gray-500 py-8">No matching content available to share.</div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {sharedContent.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No educational content selected.</p>
                <p className="text-sm text-gray-400">Add content to share patient information or instructions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedContent.map((content) => (
                  <div key={content.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="flex items-center space-x-3">
                      {getContentIcon(content.contentType)}
                      <div>
                        <p className="font-medium text-sm text-gray-900">{content.title}</p>
                        <p className="text-xs text-gray-600">{content.category}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeSharedContent(content.id)} aria-label={`Remove ${content.title}`}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Signature <span className="text-red-500">*</span></CardTitle>
            <CardDescription>Please have the patient sign below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`relative border border-gray-300 rounded-md overflow-hidden ${formErrors.signature ? 'border-red-500' : ''}`}>
              <canvas
                ref={canvasRef}
                className="w-full"
                height={150}
                style={{touchAction: 'none'}}
              />
              {signaturePadRef.current && signaturePadRef.current.isEmpty() && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-gray-500 text-sm pointer-events-none">
                  <Pencil className="h-6 w-6 mr-2" />
                  Draw signature here
                </div>
              )}
            </div>
            {formErrors.signature && <p className="text-red-500 text-sm">{formErrors.signature}</p>}
            <Button
              type="button"
              variant="outline"
              onClick={clearSignature}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Signature
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/consents">
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Consent Form
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
