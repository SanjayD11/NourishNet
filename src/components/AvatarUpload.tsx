import { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  fallbackText: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
  disabled?: boolean;
}

export function AvatarUpload({ 
  userId, 
  currentAvatarUrl, 
  fallbackText, 
  onAvatarUpdate,
  disabled = false 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): boolean => {
    // Validate file type (only jpg, jpeg, png)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, JPEG, or PNG image file.");
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, JPEG, or PNG image file.",
        variant: "destructive",
      });
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be smaller than 5MB.");
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    await uploadFile(file);
  };

  const uploadFile = async (file: File, retryAttempt: number = 0) => {
    try {
      // Remove old avatar if exists
      if (currentAvatarUrl && currentAvatarUrl.includes('profile_images/')) {
        const oldPath = currentAvatarUrl.split('/profile_images/')[1];
        if (oldPath) {
          await supabase.storage.from('profile_images').remove([oldPath]);
        }
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Create unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile_images/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          avatar_url: publicUrl
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(publicUrl);
      setPreviewUrl(null);
      
      toast({
        title: "Avatar updated successfully! ✅",
        description: "Your profile picture has been saved.",
      });

      // Trigger a page reload to update avatar across the app
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      
      // Retry logic for network errors
      if ((error?.message?.includes('network') || error?.status >= 500) && retryAttempt < 2) {
        setError(`Upload failed. Retrying... (${retryAttempt + 1}/3)`);
        setTimeout(() => {
          uploadFile(file, retryAttempt + 1);
        }, 2000);
        return;
      }

      const errorMessage = error?.message || "There was an error uploading your avatar.";
      setError(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage + " Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRetry = () => {
    if (fileInputRef.current?.files?.[0]) {
      setError(null);
      setUploading(true);
      uploadFile(fileInputRef.current.files[0]);
    } else {
      fileInputRef.current?.click();
    }
  };

  const cancelUpload = () => {
    setPreviewUrl(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative group space-y-4">
      {/* Main avatar display */}
      <div className="relative">
        <Avatar className="w-20 h-20 cursor-pointer transition-all duration-200 group-hover:shadow-lg">
          <AvatarImage src={previewUrl || currentAvatarUrl || ''} />
          <AvatarFallback className="text-xl bg-primary/10 text-primary">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay */}
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          onClick={handleFileSelect}
        >
          {uploading ? (
            <Upload className="w-6 h-6 text-primary animate-pulse" />
          ) : (
            <Camera className="w-6 h-6 text-primary" />
          )}
        </div>

        {/* Upload button for mobile/accessibility */}
        <Button
          size="sm"
          variant="outline"
          className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full shadow-md"
          onClick={handleFileSelect}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Upload className="w-4 h-4 animate-pulse" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </Button>

        {/* Cancel preview button */}
        {previewUrl && !uploading && (
          <Button
            size="sm"
            variant="outline"
            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full shadow-md"
            onClick={cancelUpload}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="w-full max-w-[200px]">
          <Progress value={uploadProgress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
          </div>
        </div>
      )}

      {/* Error message with retry */}
      {error && (
        <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
          <div className="text-sm text-destructive mb-2">{error}</div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Upload
          </Button>
        </div>
      )}

      {/* Preview controls */}
      {previewUrl && !uploading && !error && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (fileInputRef.current?.files?.[0]) {
                setUploading(true);
                uploadFile(fileInputRef.current.files[0]);
              }
            }}
          >
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={cancelUpload}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}