'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Download, 
  X,
  Sun,
  Contrast,
  Palette,
  Crop as CropIcon,
  Sliders,
  Undo,
  Redo,
  Settings
} from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onSave: (editedFile: File) => void;
}

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia: number;
  grayscale: number;
}

interface ImageTransforms {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  scale: number;
}

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
};

const DEFAULT_TRANSFORMS: ImageTransforms = {
  rotation: 0,
  flipX: false,
  flipY: false,
  scale: 1,
};

export function ImageEditor({ isOpen, onClose, imageFile, onSave }: ImageEditorProps) {
  const { theme } = useTheme();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [transforms, setTransforms] = useState<ImageTransforms>(DEFAULT_TRANSFORMS);
  const [activeTab, setActiveTab] = useState('crop');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [outputQuality, setOutputQuality] = useState(90);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get theme-aware background color
  const getThemeBackground = () => {
    return theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  };

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        // Reset all adjustments when new image loads
        setAdjustments(DEFAULT_ADJUSTMENTS);
        setTransforms(DEFAULT_TRANSFORMS);
        setCrop(undefined);
        setCompletedCrop(undefined);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  // Initialize crop area
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Create a square crop in the center
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width,
      height
    );
    setCrop(crop);
  }, []);

  // Generate CSS filter string from adjustments
  const getFilterStyle = useCallback(() => {
    return {
      filter: `
        brightness(${adjustments.brightness}%)
        contrast(${adjustments.contrast}%)
        saturate(${adjustments.saturation}%)
        hue-rotate(${adjustments.hue}deg)
        blur(${adjustments.blur}px)
        sepia(${adjustments.sepia}%)
        grayscale(${adjustments.grayscale}%)
      `,
      transform: `
        rotate(${transforms.rotation}deg)
        scaleX(${transforms.flipX ? -1 : 1})
        scaleY(${transforms.flipY ? -1 : 1})
        scale(${transforms.scale})
      `,
    };
  }, [adjustments, transforms]);

  // Apply crop and filters to canvas
  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      const canvas = canvasRef.current;
      if (!canvas || !crop) throw new Error('Canvas or crop not available');

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2d context');

      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      // Apply filters
      ctx.filter = `
        brightness(${adjustments.brightness}%)
        contrast(${adjustments.contrast}%)
        saturate(${adjustments.saturation}%)
        hue-rotate(${adjustments.hue}deg)
        blur(${adjustments.blur}px)
        sepia(${adjustments.sepia}%)
        grayscale(${adjustments.grayscale}%)
      `;

      // Calculate transform matrix
      const centerX = crop.width * scaleX / 2;
      const centerY = crop.height * scaleY / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((transforms.rotation * Math.PI) / 180);
      ctx.scale(
        transforms.flipX ? -transforms.scale : transforms.scale,
        transforms.flipY ? -transforms.scale : transforms.scale
      );
      ctx.translate(-centerX, -centerY);

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      return new Promise((resolve) => {
        const mimeType = `image/${outputFormat}`;
        const quality = outputQuality / 100;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
            const file = new File([blob], `edited-${Date.now()}.${extension}`, {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(file);
          }
        }, mimeType, quality);
      });
    },
    [adjustments, transforms, imageFile?.name]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;
    
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      onSave(croppedFile);
      onClose();
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, getCroppedImg, onSave, onClose]);

  // Reset all adjustments
  const handleReset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setTransforms(DEFAULT_TRANSFORMS);
  };

  // Transform controls
  const rotateLeft = () => setTransforms(prev => ({ ...prev, rotation: prev.rotation - 90 }));
  const rotateRight = () => setTransforms(prev => ({ ...prev, rotation: prev.rotation + 90 }));
  const flipHorizontal = () => setTransforms(prev => ({ ...prev, flipX: !prev.flipX }));
  const flipVertical = () => setTransforms(prev => ({ ...prev, flipY: !prev.flipY }));

  if (!imageSrc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            Edit Profile Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="crop" className="flex items-center gap-2">
                <CropIcon className="w-4 h-4" />
                Crop
              </TabsTrigger>
              <TabsTrigger value="adjust" className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Adjust
              </TabsTrigger>
              <TabsTrigger value="transform" className="flex items-center gap-2">
                <RotateCw className="w-4 h-4" />
                Transform
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crop" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className={`relative w-full flex justify-center items-center ${getThemeBackground()} rounded-lg min-h-[400px] max-h-[500px] overflow-auto`}>
                    <div className="relative">
                      <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        minWidth={50}
                        minHeight={50}
                        keepSelection
                        ruleOfThirds
                        className="max-w-full max-h-full"
                      >
                        <img
                          ref={imgRef}
                          alt="Crop preview"
                          src={imageSrc}
                          style={{
                            ...getFilterStyle(),
                            maxWidth: '100%',
                            maxHeight: '500px',
                            width: 'auto',
                            height: 'auto',
                            display: 'block'
                          }}
                          onLoad={onImageLoad}
                        />
                      </ReactCrop>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag to adjust the crop area. The image will be cropped to a square. Scroll if needed to see the full image.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adjust" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Brightness: {adjustments.brightness}%
                      </Label>
                      <Slider
                        value={[adjustments.brightness]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, brightness: value }))
                        }
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Contrast className="w-4 h-4" />
                        Contrast: {adjustments.contrast}%
                      </Label>
                      <Slider
                        value={[adjustments.contrast]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, contrast: value }))
                        }
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Saturation: {adjustments.saturation}%
                      </Label>
                      <Slider
                        value={[adjustments.saturation]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, saturation: value }))
                        }
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hue: {adjustments.hue}°</Label>
                      <Slider
                        value={[adjustments.hue]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, hue: value }))
                        }
                        min={-180}
                        max={180}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Blur: {adjustments.blur}px</Label>
                      <Slider
                        value={[adjustments.blur]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, blur: value }))
                        }
                        min={0}
                        max={10}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sepia: {adjustments.sepia}%</Label>
                      <Slider
                        value={[adjustments.sepia]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, sepia: value }))
                        }
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Grayscale: {adjustments.grayscale}%</Label>
                      <Slider
                        value={[adjustments.grayscale]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, grayscale: value }))
                        }
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Scale: {transforms.scale.toFixed(1)}x</Label>
                      <Slider
                        value={[transforms.scale]}
                        onValueChange={([value]) => 
                          setTransforms(prev => ({ ...prev, scale: value }))
                        }
                        min={0.5}
                        max={3}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className={`relative w-full flex justify-center items-center ${getThemeBackground()} rounded-lg border min-h-[250px] max-h-[300px] overflow-auto`}>
                    <img
                      alt="Adjustment preview"
                      src={imageSrc}
                      style={{
                        ...getFilterStyle(),
                        maxWidth: '100%',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transform" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={rotateLeft}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Rotate Left
                    </Button>
                    <Button variant="outline" onClick={rotateRight}>
                      <RotateCw className="w-4 h-4 mr-2" />
                      Rotate Right
                    </Button>
                    <Button variant="outline" onClick={flipHorizontal}>
                      <FlipHorizontal className="w-4 h-4 mr-2" />
                      Flip H
                    </Button>
                    <Button variant="outline" onClick={flipVertical}>
                      <FlipVertical className="w-4 h-4 mr-2" />
                      Flip V
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Rotation: {transforms.rotation}°</Label>
                    <Slider
                      value={[transforms.rotation]}
                      onValueChange={([value]) => 
                        setTransforms(prev => ({ ...prev, rotation: value }))
                      }
                      min={-180}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className={`relative w-full flex justify-center items-center ${getThemeBackground()} rounded-lg border min-h-[250px] max-h-[300px] overflow-auto`}>
                    <img
                      alt="Transform preview"
                      src={imageSrc}
                      style={{
                        ...getFilterStyle(),
                        maxWidth: '100%',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Output Format</Label>
                      <Select value={outputFormat} onValueChange={(value: 'jpeg' | 'png' | 'webp') => setOutputFormat(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jpeg">JPEG (Smaller file, lossy)</SelectItem>
                          <SelectItem value="png">PNG (Larger file, lossless)</SelectItem>
                          <SelectItem value="webp">WebP (Modern, efficient)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quality: {outputQuality}%</Label>
                      <Slider
                        value={[outputQuality]}
                        onValueChange={([value]) => setOutputQuality(value)}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full"
                        disabled={outputFormat === 'png'} // PNG is lossless
                      />
                      {outputFormat === 'png' && (
                        <p className="text-xs text-muted-foreground">
                          PNG format is lossless - quality setting doesn't apply
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Preview Settings</Label>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Format:</span>
                        <span className="font-medium">{outputFormat.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Quality:</span>
                        <span className="font-medium">
                          {outputFormat === 'png' ? 'Lossless' : `${outputQuality}%`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Estimated size:</span>
                        <span className="font-medium text-muted-foreground">
                          {outputFormat === 'jpeg' ? 'Small' : outputFormat === 'webp' ? 'Medium' : 'Large'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`relative w-full flex justify-center items-center ${getThemeBackground()} rounded-lg border min-h-[250px] max-h-[300px] overflow-auto`}>
                    <img
                      alt="Export preview"
                      src={imageSrc}
                      style={{
                        ...getFilterStyle(),
                        maxWidth: '100%',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <Undo className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}