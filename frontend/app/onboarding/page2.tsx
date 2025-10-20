// // This is a complete, self-contained React application for a multi-page practice onboarding wizard.
// // It is designed to be fully functional within a single-file environment,
// // simulating a multi-page experience using state management.

// import { useState, useRef, useEffect } from 'react';
// import {
//   Building,
//   AtSign,
//   Instagram,
//   CreditCard,
//   ArrowLeft,
//   ArrowRight,
//   Check,
//   ClipboardCheck,
//   Link as LinkIcon,
//   Palette,
//   Clock,
//   Phone,
//   FileText,
//   Lock,
//   Wallet,
//   Users,
// } from 'lucide-react';

// // =====================================================================
// // Custom UI Components (reused from previous version)
// // =====================================================================

// const Card = ({ className, children, ...props }) => (
//   <div className={`rounded-xl border bg-white text-gray-900 shadow-lg p-8 transition-all duration-300 ease-in-out ${className}`} {...props}>
//     {children}
//   </div>
// );

// const CardTitle = ({ className, children, ...props }) => (
//   <h3 className={`text-2xl font-bold leading-none tracking-tight mb-2 ${className}`} {...props}>
//     {children}
//   </h3>
// );

// const CardDescription = ({ className, children, ...props }) => (
//   <p className={`text-sm text-gray-600 mb-6 ${className}`} {...props}>
//     {children}
//   </p>
// );

// const Button = ({ className, children, ...props }) => (
//   <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`} {...props}>
//     {children}
//   </button>
// );

// const Input = ({ className, ...props }) => (
//   <input
//     className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
//     {...props}
//   />
// );

// const Label = ({ className, ...props }) => (
//   <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props} />
// );

// const Checkbox = ({ className, ...props }) => (
//   <input type="checkbox" className={`form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${className}`} {...props} />
// );

// const Header = ({ title, description }) => (
//   <div className="text-center mb-10">
//     <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">{title}</h1>
//     <p className="text-md text-gray-500">{description}</p>
//   </div>
// );

// const StageIndicator = ({ stages, currentStage }) => {
//   return (
//     <div className="flex justify-center items-center my-8">
//       {stages.map((stage, index) => (
//         <React.Fragment key={index}>
//           <div className={`flex flex-col items-center mx-2 md:mx-4 ${currentStage === index ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
//             <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${currentStage >= index ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
//               <span className={`text-sm md:text-md ${currentStage >= index ? 'text-white' : 'text-gray-500'}`}>{index + 1}</span>
//             </div>
//             <p className="hidden md:block text-xs mt-2 text-center w-24">{stage}</p>
//           </div>
//           {index < stages.length - 1 && (
//             <div className={`w-10 h-1 bg-gray-200 transition-colors duration-300 ${currentStage > index ? 'bg-blue-600' : ''}`}></div>
//           )}
//         </React.Fragment>
//       ))}
//     </div>
//   );
// };


// // =====================================================================
// // Custom Signature Pad Component (reused from previous version)
// // =====================================================================
// const SignaturePad = ({ onSign, signatureData }) => {
//   const canvasRef = useRef(null);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [isSigned, setIsSigned] = useState(!!signatureData);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d');
//     ctx.lineWidth = 2;
//     ctx.lineCap = 'round';
//     ctx.strokeStyle = '#000000';

//     if (signatureData) {
//       const img = new Image();
//       img.src = signatureData;
//       img.onload = () => {
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//       };
//     }
//   }, [signatureData]);

//   const startDrawing = (e) => {
//     setIsDrawing(true);
//     setIsSigned(true);
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const { clientX, clientY } = e.touches ? e.touches[0] : e;
//     const rect = canvas.getBoundingClientRect();
//     ctx.beginPath();
//     ctx.moveTo(clientX - rect.left, clientY - rect.top);
//   };

//   const draw = (e) => {
//     if (!isDrawing) return;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const { clientX, clientY } = e.touches ? e.touches[0] : e;
//     const rect = canvas.getBoundingClientRect();
//     ctx.lineTo(clientX - rect.left, clientY - rect.top);
//     ctx.stroke();
//   };

//   const stopDrawing = () => {
//     setIsDrawing(false);
//     const canvas = canvasRef.current;
//     if (canvas) {
//       onSign(canvas.toDataURL());
//     }
//   };

//   const clearPad = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     onSign('');
//     setIsSigned(false);
//   };

//   return (
//     <div className="border border-gray-300 rounded-md p-2 bg-white relative">
//       <canvas
//         ref={canvasRef}
//         width={600}
//         height={200}
//         className="w-full h-auto border border-dashed border-gray-400 rounded-md"
//         onMouseDown={startDrawing}
//         onMouseMove={draw}
//         onMouseUp={stopDrawing}
//         onMouseOut={stopDrawing}
//         onTouchStart={startDrawing}
//         onTouchMove={draw}
//         onTouchEnd={stopDrawing}
//       />
//       {!isSigned && (
//         <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-sm">
//           Please sign here
//         </div>
//       )}
//       <Button
//         onClick={clearPad}
//         className="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 w-full"
//         type="button"
//         disabled={!isSigned}
//       >
//         Clear Signature
//       </Button>
//     </div>
//   );
// };


// // =====================================================================
// // Page Components
// // =====================================================================

// const Stage1BasicInfoPage = ({ formData, updateFormData, onNext }) => {
//   const isNextDisabled = !formData.businessName || !formData.address || !formData.phone || !formData.email;

//   return (
//     <>
//       <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
//         <Building className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
//         Basic Practice Information
//       </CardTitle>
//       <CardDescription>
//         Let's start with the essential details about your practice.
//       </CardDescription>
//       <div className="space-y-4">
//         <div>
//           <Label htmlFor="businessName">Business Name</Label>
//           <div className="relative mt-1">
//             <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <Input
//               id="businessName"
//               placeholder="e.g., Smile Designs Dental Clinic"
//               value={formData.businessName || ''}
//               onChange={(e) => updateFormData('businessName', e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>
//         <div>
//           <Label htmlFor="address">Address</Label>
//           <div className="relative mt-1">
//             <Input
//               id="address"
//               placeholder="123 Main Street, Anytown, USA"
//               value={formData.address || ''}
//               onChange={(e) => updateFormData('address', e.target.value)}
//             />
//           </div>
//         </div>
//         <div>
//           <Label htmlFor="logo">Logo (URL)</Label>
//           <div className="relative mt-1">
//             <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <Input
//               id="logo"
//               placeholder="https://your-logo-url.com/logo.png"
//               value={formData.logo || ''}
//               onChange={(e) => updateFormData('logo', e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label htmlFor="brandColor">Primary Brand Color</Label>
//             <div className="relative mt-1">
//               <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//               <Input
//                 id="brandColor"
//                 type="color"
//                 value={formData.brandColor || '#1e40af'}
//                 onChange={(e) => updateFormData('brandColor', e.target.value)}
//                 className="pl-10 h-10 p-0"
//               />
//             </div>
//           </div>
//           <div>
//             <Label htmlFor="phone">Phone Number</Label>
//             <div className="relative mt-1">
//               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//               <Input
//                 id="phone"
//                 type="tel"
//                 placeholder="(555) 555-5555"
//                 value={formData.phone || ''}
//                 onChange={(e) => updateFormData('phone', e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//           </div>
//         </div>
//         <div>
//           <Label htmlFor="email">Contact Email</Label>
//           <div className="relative mt-1">
//             <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <Input
//               id="email"
//               type="email"
//               placeholder="contact@yourpractice.com"
//               value={formData.email || ''}
//               onChange={(e) => updateFormData('email', e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>
//         <div>
//           <Label htmlFor="businessHours">Business Hours</Label>
//           <div className="relative mt-1">
//             <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <Input
//               id="businessHours"
//               placeholder="e.g., Mon-Fri, 9am-5pm"
//               value={formData.businessHours || ''}
//               onChange={(e) => updateFormData('businessHours', e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>
//       </div>
//       <div className="flex justify-end mt-8">
//         <Button onClick={onNext} disabled={isNextDisabled} className="bg-blue-600 hover:bg-blue-700 text-white">
//           Next
//           <ArrowRight className="h-4 w-4 ml-2" />
//         </Button>
//       </div>
//     </>
//   );
// };

// const Stage2SocialMediaPage = ({ formData, updateFormData, onNext, onBack }) => {
//   const isNextDisabled = !formData.instagram || !formData.websiteUrl;
//   return (
//     <>
//       <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
//         <Instagram className="h-5 w-5 md:h-6 md:w-6 text-pink-500" />
//         Social Media & Integrations
//       </CardTitle>
//       <CardDescription>
//         Connect your social media accounts and provide your website URL.
//       </CardDescription>
//       <div className="space-y-4">
//         <div>
//           <Label htmlFor="instagram">Instagram Account</Label>
//           <div className="relative mt-1">
//             <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <Input
//               id="instagram"
//               placeholder="@yourpractice"
//               value={formData.instagram || ''}
//               onChange={(e) => updateFormData('instagram', e.target.value)}
//               className="pl-10"
//             />
//           </div>
//           <p className="text-xs text-gray-500 mt-1">We'll use this to post content. Please authorize access after this wizard.</p>
//         </div>
//         <div>
//           <Label htmlFor="websiteUrl">Practice Website URL</Label>
//           <div className="relative mt-1">
//             <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <Input
//               id="websiteUrl"
//               placeholder="https://www.yourpractice.com"
//               value={formData.websiteUrl || ''}
//               onChange={(e) => updateFormData('websiteUrl', e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>
//       </div>
//       <div className="flex justify-between mt-8">
//         <Button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
//           <ArrowLeft className="h-4 w-4 mr-2" />
//           Back
//         </Button>
//         <Button onClick={onNext} disabled={isNextDisabled} className="bg-blue-600 hover:bg-blue-700 text-white">
//           Next
//           <ArrowRight className="h-4 w-4 ml-2" />
//         </Button>
//       </div>
//     </>
//   );
// };

// const Stage3BillingPage = ({ formData, updateFormData, onNext, onBack }) => {
//   const isNextDisabled = !formData.billingContact || !formData.billingEmail || !formData.subscriptionPlan || !formData.cardNumber || !formData.cardExpiry || !formData.cardCVC;

//   return (
//     <>
//       <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
//         <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
//         Billing & Subscription
//       </CardTitle>
//       <CardDescription>
//         Choose your subscription plan and enter your billing details.
//       </CardDescription>
//       <div className="space-y-4">
//         <div>
//           <Label htmlFor="billingContact">Billing Contact Name</Label>
//           <Input
//             id="billingContact"
//             placeholder="Jane Doe"
//             value={formData.billingContact || ''}
//             onChange={(e) => updateFormData('billingContact', e.target.value)}
//           />
//         </div>
//         <div>
//           <Label htmlFor="billingEmail">Billing Contact Email</Label>
//           <Input
//             id="billingEmail"
//             type="email"
//             placeholder="jane.doe@yourpractice.com"
//             value={formData.billingEmail || ''}
//             onChange={(e) => updateFormData('billingEmail', e.target.value)}
//           />
//         </div>
//         <div>
//           <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
//           <select
//             id="subscriptionPlan"
//             value={formData.subscriptionPlan || ''}
//             onChange={(e) => updateFormData('subscriptionPlan', e.target.value)}
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
//           >
//             <option value="">Select a plan</option>
//             <option value="basic">Basic ($99/mo)</option>
//             <option value="pro">Pro ($199/mo)</option>
//             <option value="enterprise">Enterprise (Custom)</option>
//           </select>
//         </div>
//         <div className="space-y-2">
//           <Label>Credit Card Information</Label>
//           <Input
//             placeholder="Card Number"
//             value={formData.cardNumber || ''}
//             onChange={(e) => updateFormData('cardNumber', e.target.value)}
//             type="text"
//             inputMode="numeric"
//           />
//           <div className="grid grid-cols-2 gap-2">
//             <Input
//               placeholder="MM/YY"
//               value={formData.cardExpiry || ''}
//               onChange={(e) => updateFormData('cardExpiry', e.target.value)}
//               type="text"
//             />
//             <Input
//               placeholder="CVC"
//               value={formData.cardCVC || ''}
//               onChange={(e) => updateFormData('cardCVC', e.target.value)}
//               type="text"
//               inputMode="numeric"
//             />
//           </div>
//         </div>
//         <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-800">
//           <Wallet className="inline h-4 w-4 mr-2" />
//           Payment information will be securely processed by a third-party provider like Stripe.
//         </div>
//       </div>
//       <div className="flex justify-between mt-8">
//         <Button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
//           <ArrowLeft className="h-4 w-4 mr-2" />
//           Back
//         </Button>
//         <Button onClick={onNext} disabled={isNextDisabled} className="bg-blue-600 hover:bg-blue-700 text-white">
//           Next
//           <ArrowRight className="h-4 w-4 ml-2" />
//         </Button>
//       </div>
//     </>
//   );
// };

// const Stage4LegalPage = ({ formData, updateFormData, onNext, onBack }) => {
//   const isNextDisabled = !formData.termsAccepted || !formData.baaAccepted || !formData.signature;

//   return (
//     <>
//       <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
//         <Lock className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
//         Legal & Compliance
//       </CardTitle>
//       <CardDescription>
//         Please review and digitally sign the legal agreements.
//       </CardDescription>
//       <div className="space-y-6">
//         <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-700">
//           <Users className="inline h-4 w-4 mr-2" />
//           By proceeding, you agree to our terms. This step ensures compliance with legal and privacy standards.
//         </div>
//         <div className="flex items-start">
//           <div className="flex items-center h-5">
//             <Checkbox
//               id="terms"
//               checked={formData.termsAccepted || false}
//               onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
//             />
//           </div>
//           <div className="ml-3 text-sm">
//             <Label htmlFor="terms" className="!font-normal text-gray-500">
//               I accept the <a href="#" className="font-medium text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="font-medium text-blue-600 hover:underline">Privacy Policy</a>.
//             </Label>
//           </div>
//         </div>
//         <div className="flex items-start">
//           <div className="flex items-center h-5">
//             <Checkbox
//               id="baa"
//               checked={formData.baaAccepted || false}
//               onChange={(e) => updateFormData('baaAccepted', e.target.checked)}
//             />
//           </div>
//           <div className="ml-3 text-sm">
//             <Label htmlFor="baa" className="!font-normal text-gray-500">
//               I agree to the **HIPAA Business Associate Agreement (BAA)**.
//             </Label>
//           </div>
//         </div>
//         <div>
//           <Label htmlFor="signature">Digital Signature</Label>
//           <SignaturePad
//             onSign={(signatureData) => updateFormData('signature', signatureData)}
//             signatureData={formData.signature}
//           />
//         </div>
//       </div>
//       <div className="flex justify-between mt-8">
//         <Button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
//           <ArrowLeft className="h-4 w-4 mr-2" />
//           Back
//         </Button>
//         <Button onClick={onNext} disabled={isNextDisabled} className="bg-blue-600 hover:bg-blue-700 text-white">
//           Submit
//           <ClipboardCheck className="h-4 w-4 ml-2" />
//         </Button>
//       </div>
//     </>
//   );
// };

// const SuccessPage = ({ formData, onReset }) => (
//   <div className="text-center p-8 bg-green-50 rounded-lg border-2 border-green-200 shadow-md">
//     <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
//     <h2 className="text-3xl font-bold text-green-800 mb-2">Onboarding Complete!</h2>
//     <p className="text-gray-700 mb-6">Thank you for completing the onboarding process. Your information has been submitted successfully.</p>
//     <div className="text-left text-sm text-gray-600 bg-green-100 p-4 rounded-lg">
//       <h4 className="font-bold mb-2">Summary of Data:</h4>
//       <pre className="whitespace-pre-wrap">{JSON.stringify(formData, null, 2)}</pre>
//       {formData.signature && (
//         <div className="mt-4">
//           <h4 className="font-bold mb-2">Digital Signature:</h4>
//           <img src={formData.signature} alt="Digital Signature" className="w-full border rounded-md bg-white" />
//         </div>
//       )}
//     </div>
//     <Button
//       onClick={onReset}
//       className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
//     >
//       Start Over
//     </Button>
//   </div>
// );


// // =====================================================================
// // Main App Component with "page" rendering logic.
// // This is the entry point of the application.
// // =====================================================================
// const App = () => {
//   const [currentStage, setCurrentStage] = useState(0);
//   const [formData, setFormData] = useState({});
//   const [isSubmitted, setIsSubmitted] = useState(false);

//   // Define the stages for the progress indicator
//   const stages = [
//     'Basic Info',
//     'Social Media',
//     'Billing',
//     'Legal & Compliance',
//   ];

//   const updateFormData = (key, value) => {
//     setFormData(prev => ({ ...prev, [key]: value }));
//   };

//   const handleNext = () => {
//     if (currentStage < stages.length - 1) {
//       setCurrentStage(prev => prev + 1);
//     } else {
//       // Final step, submit the form
//       setIsSubmitted(true);
//       console.log('Form Submitted:', formData);
//     }
//   };

//   const handleBack = () => {
//     if (currentStage > 0) {
//       setCurrentStage(prev => prev - 1);
//     }
//   };

//   const renderCurrentPage = () => {
//     switch (currentStage) {
//       case 0:
//         return <Stage1BasicInfoPage formData={formData} updateFormData={updateFormData} onNext={handleNext} />;
//       case 1:
//         return <Stage2SocialMediaPage formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
//       case 2:
//         return <Stage3BillingPage formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
//       case 3:
//         return <Stage4LegalPage formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
//       default:
//         return null;
//     }
//   };

//   const resetForm = () => {
//     setCurrentStage(0);
//     setFormData({});
//     setIsSubmitted(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//       <style>{`
//         @tailwind base;
//         @tailwind components;
//         @tailwind utilities;

//         body {
//           font-family: 'Inter', sans-serif;
//           background-color: #f9fafb;
//         }

//         :root {
//           --primary: 221.2 83.2% 53.3%;
//           --primary-foreground: 210 40% 98%;
//         }
//       `}</style>
//       <div className="max-w-3xl w-full">
//         {isSubmitted ? (
//           <SuccessPage formData={formData} onReset={resetForm} />
//         ) : (
//           <Card>
//             <Header
//               title="Practice Onboarding Wizard"
//               description="Welcome! Let's get your account set up in a few simple steps."
//             />
//             <StageIndicator stages={stages} currentStage={currentStage} />
//             <div className="space-y-6">
//               {renderCurrentPage()}
//             </div>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// };

// export default App;
