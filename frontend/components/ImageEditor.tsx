'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Palette, Download, Undo, Circle, Square, Type } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageData: string, annotations: Annotation[]) => void;
}

interface Annotation {
  id: string;
  type: 'circle' | 'arrow' | 'text' | 'sticker';
  x: number;
  y: number;
  data: any;
}

const DENTAL_FILTERS = [
  { name: 'Original', filter: 'none' },
  { name: 'Enhance', filter: 'contrast(1.2) brightness(1.1) saturate(1.1)' },
  { name: 'Clinical', filter: 'contrast(1.3) brightness(1.2) saturate(0.9)' },
  { name: 'Whitening', filter: 'brightness(1.15) contrast(1.1) hue-rotate(5deg)' }
];

export default function ImageEditor({ imageUrl, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<'circle' | 'text' | null>(null);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [selectedFilter, setSelectedFilter] = useState(0);

  useEffect(() => {
    loadImage();
  }, [imageUrl]);

  const loadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      applyFilters();
    };
    
    img.src = imageUrl;
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const filter = `brightness(${brightness[0]}%) contrast(${contrast[0]}%) ${DENTAL_FILTERS[selectedFilter].filter}`;
    canvas.style.filter = filter;
  };

  useEffect(() => {
    applyFilters();
  }, [brightness, contrast, selectedFilter]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: selectedTool,
      x,
      y,
      data: selectedTool === 'circle' ? { radius: 20, color: '#ff0000' } : { text: 'Issue', color: '#ff0000' }
    };

    setAnnotations([...annotations, newAnnotation]);
    drawAnnotation(newAnnotation);
  };

  const drawAnnotation = (annotation: Annotation) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = annotation.data.color;
    ctx.lineWidth = 3;

    if (annotation.type === 'circle') {
      ctx.beginPath();
      ctx.arc(annotation.x, annotation.y, annotation.data.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (annotation.type === 'text') {
      ctx.fillStyle = annotation.data.color;
      ctx.font = '16px Arial';
      ctx.fillText(annotation.data.text, annotation.x, annotation.y);
    }
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas with filters applied
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    if (tempCtx) {
      // Apply filters to context
      tempCtx.filter = `brightness(${brightness[0]}%) contrast(${contrast[0]}%) ${DENTAL_FILTERS[selectedFilter].filter}`;
      tempCtx.drawImage(canvas, 0, 0);
      
      // Draw annotations
      annotations.forEach(drawAnnotation);
      
      const editedImageData = tempCanvas.toDataURL('image/jpeg', 0.9);
      onSave(editedImageData, annotations);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Selection */}
      <div className="flex gap-2 flex-wrap">
        {DENTAL_FILTERS.map((filter, index) => (
          <Button
            key={filter.name}
            variant={selectedFilter === index ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(index)}
          >
            {filter.name}
          </Button>
        ))}
      </div>

      {/* Adjustment Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Brightness: {brightness[0]}%</label>
          <Slider
            value={brightness}
            onValueChange={setBrightness}
            min={50}
            max={150}
            step={1}
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Contrast: {contrast[0]}%</label>
          <Slider
            value={contrast}
            onValueChange={setContrast}
            min={50}
            max={150}
            step={1}
            className="mt-2"
          />
        </div>
      </div>

      {/* Annotation Tools */}
      <div className="flex gap-2">
        <Button
          variant={selectedTool === 'circle' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool(selectedTool === 'circle' ? null : 'circle')}
        >
          <Circle className="h-4 w-4 mr-2" />
          Highlight
        </Button>
        <Button
          variant={selectedTool === 'text' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool(selectedTool === 'text' ? null : 'text')}
        >
          <Type className="h-4 w-4 mr-2" />
          Text
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {annotations.length} annotations
        </Badge>
      </div>

      {/* Canvas */}
      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="max-w-full h-auto cursor-crosshair"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={saveImage} className="bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Save Edited Image
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setAnnotations([])}
        >
          <Undo className="h-4 w-4 mr-2" />
          Clear Annotations
        </Button>
      </div>
    </div>
  );
}