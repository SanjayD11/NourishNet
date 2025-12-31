import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, ImagePlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageData {
  file: File;
  preview: string;
  source: 'camera' | 'upload';
}

interface SmartImageCaptureProps {
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  maxResolution?: number;
}

// Detect if device is mobile
const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Read EXIF data to detect if image was captured from camera
const detectImageSource = async (file: File): Promise<'camera' | 'upload'> => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const view = new DataView(e.target?.result as ArrayBuffer);
          
          // Check for JPEG SOI marker
          if (view.getUint16(0, false) !== 0xFFD8) {
            resolve('upload');
            return;
          }
          
          let offset = 2;
          const length = view.byteLength;
          
          while (offset < length) {
            if (offset + 2 > length) break;
            
            const marker = view.getUint16(offset, false);
            offset += 2;
            
            // Look for APP1 marker (EXIF)
            if (marker === 0xFFE1) {
              if (offset + 2 > length) break;
              const exifLength = view.getUint16(offset, false);
              
              // Check for "Exif" string
              if (offset + 6 <= length) {
                const exifHeader = String.fromCharCode(
                  view.getUint8(offset + 2),
                  view.getUint8(offset + 3),
                  view.getUint8(offset + 4),
                  view.getUint8(offset + 5)
                );
                
                if (exifHeader === 'Exif') {
                  // Has EXIF data - now look for camera-specific tags
                  const tiffOffset = offset + 8;
                  if (tiffOffset + 8 <= length) {
                    // Check TIFF header
                    const endian = view.getUint16(tiffOffset, false);
                    const littleEndian = endian === 0x4949;
                    
                    const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
                    const ifdStart = tiffOffset + ifdOffset;
                    
                    if (ifdStart + 2 <= length) {
                      const numEntries = view.getUint16(ifdStart, littleEndian);
                      
                      // Scan IFD entries for Make (0x010F) or Model (0x0110) tags
                      for (let i = 0; i < numEntries && ifdStart + 2 + (i * 12) + 12 <= length; i++) {
                        const entryOffset = ifdStart + 2 + (i * 12);
                        const tag = view.getUint16(entryOffset, littleEndian);
                        
                        // 0x010F = Make, 0x0110 = Model, 0x9003 = DateTimeOriginal
                        if (tag === 0x010F || tag === 0x0110 || tag === 0x9003) {
                          resolve('camera');
                          return;
                        }
                      }
                    }
                  }
                }
              }
              
              offset += exifLength;
            } else if ((marker & 0xFF00) === 0xFF00) {
              // Other marker - skip it
              if (offset + 2 > length) break;
              const segmentLength = view.getUint16(offset, false);
              offset += segmentLength;
            } else {
              break;
            }
          }
          
          resolve('upload');
        } catch {
          resolve('upload');
        }
      };
      reader.onerror = () => resolve('upload');
      
      // Only read first 128KB for EXIF detection
      const blob = file.slice(0, 131072);
      reader.readAsArrayBuffer(blob);
    } catch {
      resolve('upload');
    }
  });
};

// Compress image client-side
const compressImage = async (
  file: File,
  maxSizeMB: number,
  maxResolution: number
): Promise<{ file: File; wasCompressed: boolean }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      const needsResize = width > maxResolution || height > maxResolution;
      const needsCompress = file.size > maxSizeMB * 1024 * 1024;
      
      if (!needsResize && !needsCompress) {
        resolve({ file, wasCompressed: false });
        return;
      }
      
      // Calculate new dimensions
      if (needsResize) {
        if (width > height) {
          if (width > maxResolution) {
            height = Math.round((height * maxResolution) / width);
            width = maxResolution;
          }
        } else {
          if (height > maxResolution) {
            width = Math.round((width * maxResolution) / height);
            height = maxResolution;
          }
        }
      }
      
      // Create canvas and compress
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ file, wasCompressed: false });
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels to get under size limit
      const tryCompress = (quality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, wasCompressed: false });
              return;
            }
            
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
              tryCompress(quality - 0.1);
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve({ file: compressedFile, wasCompressed: true });
          },
          'image/jpeg',
          quality
        );
      };
      
      tryCompress(0.85);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ file, wasCompressed: false });
    };
    
    img.src = url;
  });
};

export default function SmartImageCapture({
  images,
  onImagesChange,
  maxImages = 3,
  maxSizeMB = 5,
  maxResolution = 1920,
}: SmartImageCaptureProps) {
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  
  const isMobile = isMobileDevice();

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    // Check limit
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${maxImages} images.`,
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    const newImages: ImageData[] = [];
    let anyCompressed = false;
    
    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not supported. Use JPG or PNG.`,
          variant: "destructive",
        });
        continue;
      }
      
      try {
        // Detect source from EXIF
        const source = await detectImageSource(file);
        
        // Compress if needed
        let finalFile = file;
        if (file.size > maxSizeMB * 1024 * 1024 || file.size > 3 * 1024 * 1024) {
          const { file: compressed, wasCompressed } = await compressImage(
            file,
            maxSizeMB,
            maxResolution
          );
          finalFile = compressed;
          if (wasCompressed) anyCompressed = true;
        }
        
        // Create preview
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(finalFile);
        });
        
        newImages.push({
          file: finalFile,
          preview,
          source,
        });
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: "Processing failed",
          description: `Could not process ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    }
    
    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      
      if (anyCompressed) {
        toast({
          title: "Image optimized",
          description: "Large image was automatically compressed for faster upload.",
        });
      }
    }
    
    setProcessing(false);
  }, [images, maxImages, maxSizeMB, maxResolution, onImagesChange, toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    // Reset input
    e.target.value = '';
  }, [processFiles]);

  const handleAddPhoto = useCallback(() => {
    if (isMobile) {
      // On mobile, trigger camera input
      cameraInputRef.current?.click();
    } else {
      // On desktop, trigger file picker
      fileInputRef.current?.click();
    }
  }, [isMobile]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Image Previews */}
      <AnimatePresence mode="popLayout">
        {images.length > 0 && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {images.map((image, index) => (
              <motion.div
                key={image.preview}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-soft">
                  <img
                    src={image.preview}
                    alt={`Food preview ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 w-8 h-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
                  {/* Badges */}
                  <div className="absolute bottom-2 left-2 flex gap-2">
                    {index === 0 && (
                      <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm text-xs">
                        Main Image
                      </Badge>
                    )}
                    
                    {image.source === 'camera' && (
                      <Badge 
                        variant="secondary" 
                        className="bg-emerald-500/90 text-white backdrop-blur-sm text-xs flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" />
                        Captured live
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Photo Button Area */}
      {canAddMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 sm:p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
            {processing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Processing image...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ImagePlus className="w-7 h-7 text-primary" />
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {images.length === 0
                    ? "Add photos of your food to help others see what you're sharing"
                    : `Add ${maxImages - images.length} more photo${maxImages - images.length > 1 ? 's' : ''}`}
                </p>
                
                <Button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={processing}
                  className="min-w-[160px] gap-2"
                >
                  {isMobile ? (
                    <>
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Add Photo
                    </>
                  )}
                </Button>
                
                {isMobile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="mt-2 text-muted-foreground"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Choose from gallery
                  </Button>
                )}
                
                {/* Trust tip */}
                <p className="group/tip mt-4 text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5 cursor-default">
                  <Camera className="w-3.5 h-3.5 text-primary/60 animate-pulse group-hover/tip:text-primary group-hover/tip:scale-110 group-hover/tip:rotate-12 group-hover/tip:animate-none transition-all duration-300" />
                  <span>Tip: Capturing photos in real time using your phone camera helps build trust in food authenticity.</span>
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Hidden inputs */}
      {/* Camera input for mobile - opens camera directly */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* File picker for desktop/gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      {/* Help text */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <span>
          First image is the main display. JPG/PNG only, max 5MB each. 
          Large photos are automatically optimized.
        </span>
      </div>
    </div>
  );
}
