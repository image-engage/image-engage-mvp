// components/SignatureCaptureComponent.tsx (or integrate directly into your form where signature is captured)
'use client';

import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Eraser, Type, PenTool } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SignatureCaptureProps {
  onSignatureChange: (signatureData: string | null) => void;
  initialSignatureData?: string | null;
  patientFirstName?: string; // To pre-fill for auto-generated signature
  patientLastName?: string;  // To pre-fill for auto-generated signature
}

type SignatureMode = 'draw' | 'type';

export default function SignatureCaptureComponent({
  onSignatureChange,
  initialSignatureData,
  patientFirstName = '',
  patientLastName = '',
}: SignatureCaptureProps) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('draw'); // Default to draw mode
  const [typedName, setTypedName] = useState<string>(`${patientFirstName} ${patientLastName}`.trim());
  const [generatedSignatureData, setGeneratedSignatureData] = useState<string | null>(null);

  // Initialize signature pad with existing data if provided
  useEffect(() => {
    if (initialSignatureData && sigCanvas.current && signatureMode === 'draw') {
      sigCanvas.current.fromDataURL(initialSignatureData);
    } else if (initialSignatureData && signatureMode === 'type') {
        // If initial data is from a typed signature (e.g., base64 image data)
        setGeneratedSignatureData(initialSignatureData);
    }
  }, [initialSignatureData, signatureMode]);

  // Handle changes from the drawing pad
  const handleDrawChange = () => {
    if (sigCanvas.current) {
      onSignatureChange(sigCanvas.current.isEmpty() ? null : sigCanvas.current.toDataURL());
    }
  };

  // Clear the drawing pad
  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onSignatureChange(null);
    }
    setTypedName(`${patientFirstName} ${patientLastName}`.trim()); // Reset typed name
    setGeneratedSignatureData(null); // Clear generated signature
  };

  // Generate signature from typed name
  const generateSignatureFromName = () => {
    if (typedName.trim() === '') {
      setGeneratedSignatureData(null);
      onSignatureChange(null);
      return;
    }

    // --- Simple Text-to-Image Generation (Conceptual) ---
    // In a real application, you might use a library like html2canvas,
    // or a backend service, to generate a more stylized image.
    // For simplicity, we'll create a canvas and draw text on it.

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions suitable for a signature
    canvas.width = 400; // Example width
    canvas.height = 100; // Example height
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // White background

    ctx.font = 'italic 48px "Dancing Script", cursive, sans-serif'; // Use a script-like font for signature feel
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedSignatureData(dataUrl);
    onSignatureChange(dataUrl); // Pass the generated data URL back to the parent form
  };

  // Effect to re-generate signature when typed name changes in 'type' mode
  useEffect(() => {
    if (signatureMode === 'type') {
      generateSignatureFromName();
    }
  }, [typedName, signatureMode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Signature</CardTitle>
        <CardDescription>
          Provide your signature by drawing or typing your name.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signature Mode Toggle */}
        <div className="flex justify-center mb-4">
          <ToggleGroup type="single" value={signatureMode} onValueChange={(value: SignatureMode) => {
            if (value) {
              setSignatureMode(value);
              clearSignature(); // Clear current signature when switching modes
            }
          }}>
            <ToggleGroupItem value="draw" aria-label="Draw Signature">
              <PenTool className="h-4 w-4 mr-2" /> Draw Signature
            </ToggleGroupItem>
            <ToggleGroupItem value="type" aria-label="Type Signature">
              <Type className="h-4 w-4 mr-2" /> Type Name
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {signatureMode === 'draw' && (
          <div className="border border-gray-300 rounded-md bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{ width: 500, height: 200, className: 'signature-canvas' }}
              onEnd={handleDrawChange} // Capture signature on end of stroke
              onBegin={clearSignature} // Clear when starting a new draw
            />
            <div className="p-2 border-t border-gray-200 flex justify-end">
              <Button type="button" variant="outline" onClick={clearSignature} size="sm">
                <Eraser className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
          </div>
        )}

        {signatureMode === 'type' && (
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="typedName">Type Your Full Name</Label>
              <Input
                id="typedName"
                type="text"
                placeholder="e.g., John Doe"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                onBlur={generateSignatureFromName} // Generate when input loses focus
              />
            </div>
            {typedName.trim() !== '' && (
              <div className="flex flex-col items-center">
                <Label className="mb-2 text-sm text-gray-600">Generated Signature Preview:</Label>
                <div className="border border-gray-300 rounded-md bg-white p-4 flex justify-center items-center overflow-hidden" style={{ width: 500, height: 200 }}>
                  {generatedSignatureData ? (
                    <img src={generatedSignatureData} alt="Generated Signature" className="max-w-full h-auto object-contain" />
                  ) : (
                    <p className="text-gray-400 italic">Type your name above to generate a signature.</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This signature is automatically generated from your typed name.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}