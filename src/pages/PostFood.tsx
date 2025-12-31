import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Navigation, Plus, Loader2, CalendarIcon, Clock, Tag, AlertTriangle, ShieldCheck, UserCircle, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { validateLocationName, validateCoordinates } from '@/utils/validation';
import LocationMapPreview from '@/components/LocationMapPreview';
import SmartImageCapture from '@/components/SmartImageCapture';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

interface ImageData {
  file: File;
  preview: string;
  source: 'camera' | 'upload';
}

export default function PostFood() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isComplete: profileComplete, isLoading: profileLoading, missingFields } = useProfileCompletion();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [smartImages, setSmartImages] = useState<ImageData[]>([]);
  const [formData, setFormData] = useState({
    food_title: '',
    description: '',
    location_lat: 0,
    location_long: 0,
    food_category: '',
    cuisine_type: '',
    location_name: '',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bestBefore, setBestBefore] = useState<Date | undefined>();
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [safetyChecklist, setSafetyChecklist] = useState({
    coveredDuringStorage: null as boolean | null,
    storedProperly: null as boolean | null,
    preparedRecently: null as boolean | null,
    packedSafely: null as boolean | null,
  });
  const [safetyConfirmation, setSafetyConfirmation] = useState(false);
  // Dropdown options
  const foodCategories = ['Veg', 'Non-Veg', 'Vegan', 'Snacks', 'Drinks', 'Others'];
  const cuisineTypes = ['South Indian', 'North Indian', 'Chinese', 'Fast Food', 'Desserts', 'Others'];
  const availableTags = ['Spicy', 'Healthy', 'Homemade', 'Breakfast', 'Lunch', 'Dinner', 'Sweet', 'Savory'];

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('location')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.location) {
          setFormData(prev => ({ ...prev, location_name: profile.location }));
        }
      }
    };
    loadUserProfile();
  }, [user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    // Real-time validation for location name
    if (name === 'location_name') {
      const locationValidation = validateLocationName(value);
      if (!locationValidation.isValid && value.length > 3) {
        setValidationErrors((prev) => ({
          ...prev,
          location_name: locationValidation.error || 'Invalid location',
        }));
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCoordinateChange = (name: 'location_lat' | 'location_long', value: string) => {
    const numericValue = value === '' ? NaN : parseFloat(value);
    const prev = formData;

    setFormData((prevState) => ({
      ...prevState,
      [name]: numericValue,
    }));

    if (!isNaN(numericValue)) {
      const coordValidation = validateCoordinates(
        name === 'location_lat' ? numericValue : prev.location_lat,
        name === 'location_long' ? numericValue : prev.location_long,
      );

      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        location_lat: coordValidation.isValid ? '' : coordValidation.error || prevErrors.location_lat,
        location_long: coordValidation.isValid ? '' : coordValidation.error || prevErrors.location_long,
      }));
    }
  };
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Image upload is now handled by SmartImageCapture component

  const uploadImagesToStorage = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file, index) => {
      try {
        if (!user?.id) throw new Error("User not authenticated");
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const timestamp = Date.now();
        // Store in a user-specific folder to satisfy RLS: first folder must equal auth.uid()
        const filePath = `${user.id}/${timestamp}_${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('food-images')
          .getPublicUrl(filePath);

        return data.publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!('geolocation' in navigator)) {
      setLocationLoading(false);
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation. Please enter your location manually.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setFormData(prev => ({
          ...prev,
          location_lat: lat,
          location_long: lng,
        }));

        // Try to get a readable address using Nominatim (free, no API key required)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              }
            }
          );
          const data = await response.json();
          const locationName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setFormData(prev => ({ ...prev, location_name: locationName }));
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          setFormData(prev => ({ ...prev, location_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }));
          console.error('Error getting address:', error);
        }
        
        setLocationLoading(false);
        toast({
          title: "Location obtained",
          description: "Your current location has been set for this food post.",
        });
      },
      (error) => {
        setLocationLoading(false);
        
        let errorMessage = "Unable to fetch location. Please try again.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please try again or enter manually.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive",
        });
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Don't use cached positions
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation only on submit for required fields
    const errors: { [key: string]: string } = {};

    // Required text fields
    if (!formData.food_title.trim()) {
      errors.food_title = 'Food title is required.';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required.';
    }

    if (!formData.food_category.trim()) {
      errors.food_category = 'Food category is required.';
    }

    // Pickup location: require address and valid coordinates
    if (!formData.location_name || !formData.location_name.trim()) {
      errors.location_name = 'Pickup location is required.';
    }
    
    const lat = Number(formData.location_lat);
    const lng = Number(formData.location_long);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.location_lat = 'Valid latitude is required (-90 to 90).';
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.location_long = 'Valid longitude is required (-180 to 180).';
    }
    
    // Check if coordinates are likely the default (0, 0) which is invalid for food sharing
    if (lat === 0 && lng === 0) {
      errors.location_lat = 'Please use "Get Current Location" or enter valid coordinates.';
      errors.location_long = 'Please use "Get Current Location" or enter valid coordinates.';
    }
    
    // Best before is required for safety
    if (!bestBefore) {
      errors.best_before = 'Best before date and time is required.';
    }

    // Safety Shield: all checklist questions answered + final confirmation
    if (Object.values(safetyChecklist).some((value) => value === null)) {
      errors.safety_checklist = 'Please answer all Safety Shield checklist questions.';
    }

    if (!safetyConfirmation) {
      errors.safety_confirmation = 'Please confirm that you believe this food is safe to share.';
    }
    if (Object.keys(errors).length > 0) {
      console.log('ShareFood validation errors', errors);
      setValidationErrors(errors);
      toast({
        title: 'Please complete all required fields',
        description: 'Check the highlighted sections and safety questions.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setImageUploading(true);
    
    try {
      // Upload images if selected, but do not block post creation if upload fails
      let imageUrls: string[] = [];
      const filesToUpload = smartImages.map(img => img.file);
      if (filesToUpload.length > 0) {
        const uploaded = await uploadImagesToStorage(filesToUpload);
        if (uploaded.length === 0) {
          console.warn('Image upload failed, proceeding without images');
          toast({
            title: "Image upload issue",
            description: "We couldn't upload your images, but your food post will still be created.",
            variant: "destructive",
          });
        } else {
          imageUrls = uploaded;
        }
      }

    // Safety Shield is purely client-side; no safety metadata is stored in the database

    // Prepare insert payload with only existing DB columns (no safety or UI-only fields)
    const insertPayload = {
      food_title: formData.food_title.trim(),
      description: formData.description.trim(),
      location_lat: Number(formData.location_lat),
      location_long: Number(formData.location_long),
      location_name: formData.location_name.trim(),
      food_category: formData.food_category.toLowerCase(),
      cuisine_type: formData.cuisine_type ? formData.cuisine_type : null,
      user_id: user?.id,
      images: imageUrls.length > 0 ? imageUrls : [],
      image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      best_before: bestBefore ? bestBefore.toISOString() : null,
      tags: selectedTags.length > 0 ? selectedTags : [],
      status: 'available',
    } as const;

      console.log('Attempting to insert food post:', JSON.stringify(insertPayload, null, 2));

      const { data, error } = await supabase
        .from('food_posts')
        .insert(insertPayload)
        .select();

      if (error) {
        console.error('Supabase insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('Food post created successfully:', data);

      toast({
        title: "Food post created successfully! 🎉",
        description: "Your food is now available for the community.",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error creating food post:', error);
      
      const errorMessage = error?.message || 'Unknown error occurred';
      const errorDetails = error?.details || '';
      const errorHint = error?.hint || '';
      
      toast({
        title: "Error creating post",
        description: `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}${errorHint ? ` Hint: ${errorHint}` : ''}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };


  // Show profile completion required screen
  if (!profileLoading && !profileComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <Card className="glass-card overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <UserCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Complete Your Profile First
              </h1>
              <p className="text-muted-foreground max-w-md mb-6">
                Please complete your profile before sharing food. This helps the community trust you and ensures smooth pickup coordination.
              </p>

              {/* Missing fields */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {missingFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-destructive/10 text-destructive"
                  >
                    {field}
                  </span>
                ))}
              </div>

              <Button
                onClick={() => navigate('/profile')}
                size="lg"
                className="gap-2"
              >
                Complete Profile
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="glass-card p-6">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-4"
          >
            <Plus className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Share Food</h1>
          <p className="text-muted-foreground">
            Help reduce food waste by sharing with your community
          </p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Food Details</CardTitle>
          <CardDescription>
            Provide information about the food you want to share
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="food_title">Food Title *</Label>
              <Input
                id="food_title"
                name="food_title"
                type="text"
                placeholder="e.g., Fresh vegetables, Homemade pasta, Leftover pizza"
                value={formData.food_title}
                onChange={handleInputChange}
                className={validationErrors.food_title ? 'border-destructive focus:border-destructive' : ''}
                required
              />
              {validationErrors.food_title && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{validationErrors.food_title}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the food, quantity, expiry date, any special instructions... (e.g., 'Fresh homemade lasagna, serves 4-6 people, made this morning, vegetarian')"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={validationErrors.description ? 'border-destructive focus:border-destructive' : ''}
                required
              />
              {validationErrors.description && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{validationErrors.description}</span>
                </div>
              )}
            </div>

            {/* Food Category */}
            <div className="space-y-2">
              <Label>Food Category *</Label>
              <Select 
                value={formData.food_category} 
                onValueChange={(value) => {
                  handleSelectChange('food_category', value);
                  // Clear validation error when user selects
                  if (validationErrors.food_category) {
                    setValidationErrors(prev => {
                      const updated = { ...prev };
                      delete updated.food_category;
                      return updated;
                    });
                  }
                }}
              >
                <SelectTrigger className={validationErrors.food_category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select food category" />
                </SelectTrigger>
                <SelectContent>
                  {foodCategories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '_')}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.food_category && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{validationErrors.food_category}</span>
                </div>
              )}
            </div>

            {/* Cuisine Type */}
            <div className="space-y-2">
              <Label>Cuisine Type</Label>
              <Select value={formData.cuisine_type} onValueChange={(value) => handleSelectChange('cuisine_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cuisine type" />
                </SelectTrigger>
                <SelectContent>
                  {cuisineTypes.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine.toLowerCase().replace(/\s+/g, '_')}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pickup Location */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label htmlFor="location_name">Pickup Location *</Label>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <Input
                    id="location_name"
                    name="location_name"
                    type="text"
                    placeholder="Enter pickup address or landmark"
                    value={formData.location_name}
                    onChange={handleInputChange}
                    className={validationErrors.location_name ? 'border-destructive focus:border-destructive' : ''}
                    required
                  />
                  {!isNaN(formData.location_lat) && !isNaN(formData.location_long) && (
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {formData.location_lat.toFixed(5)}, {formData.location_long.toFixed(5)}
                    </p>
                  )}
                  {validationErrors.location_name && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationErrors.location_name}</span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto inline-flex items-center justify-center"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <Navigation className="mr-2 h-4 w-4" />
                      Use Current Location
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="location_lat" className="text-xs text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    id="location_lat"
                    type="number"
                    step="0.00001"
                    value={Number.isNaN(formData.location_lat) ? '' : formData.location_lat}
                    onChange={(e) => handleCoordinateChange('location_lat', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="location_long" className="text-xs text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    id="location_long"
                    type="number"
                    step="0.00001"
                    value={Number.isNaN(formData.location_long) ? '' : formData.location_long}
                    onChange={(e) => handleCoordinateChange('location_long', e.target.value)}
                  />
                </div>
              </div>
              {(validationErrors.location_lat || validationErrors.location_long) && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{validationErrors.location_lat || validationErrors.location_long}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Use your current location or enter a detailed pickup address. Coordinates are stored for precise matching.
              </p>
            </div>

            {/* Location Map Preview - Google Maps */}
            {!isNaN(formData.location_lat) && !isNaN(formData.location_long) && (
              <LocationMapPreview
                latitude={formData.location_lat}
                longitude={formData.location_long}
                locationName={formData.location_name}
              />
            )}

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="text-xs"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select tags that describe your food
              </p>
            </div>

            {/* Image Upload - Smart Capture */}
            <div className="space-y-4">
              <Label>Food Images (Up to 3 images)</Label>
              <SmartImageCapture
                images={smartImages}
                onImagesChange={setSmartImages}
                maxImages={3}
                maxSizeMB={5}
                maxResolution={1920}
              />
            </div>


            {/* Best Before Date Time */}
            <div className="space-y-2">
              <Label>Food is best before... *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !bestBefore && "text-muted-foreground",
                      validationErrors.best_before && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bestBefore ? (
                      format(bestBefore, "PPP 'at' p")
                    ) : (
                      <span>Select date and time</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={bestBefore}
                    onSelect={(date) => {
                      if (date) {
                        const now = new Date();
                        const newDate = new Date(date);
                        if (!bestBefore) {
                          newDate.setHours(now.getHours(), now.getMinutes());
                        } else {
                          newDate.setHours(bestBefore.getHours(), bestBefore.getMinutes());
                        }
                        setBestBefore(newDate);
                        if (validationErrors.best_before) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.best_before;
                            return updated;
                          });
                        }
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                  {bestBefore && (
                    <div className="p-3 border-t">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <Label htmlFor="time">Time:</Label>
                        <Input
                          id="time"
                          type="time"
                          value={format(bestBefore, "HH:mm")}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":");
                            const newDate = new Date(bestBefore);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setBestBefore(newDate);
                            if (validationErrors.best_before) {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.best_before;
                                return updated;
                              });
                            }
                          }}
                          className="w-auto"
                        />
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {validationErrors.best_before && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{validationErrors.best_before}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                When is this food best consumed by?
              </p>
            </div>

            {/* Safety Shield System - new implementation */}
            <div className="mt-6 space-y-4 rounded-xl border bg-background/60 p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-success" />
                    <h3 className="text-sm font-semibold leading-none">Safety Shield Checklist *</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Answer these quick safety questions to help receivers understand how this food was handled.
                  </p>
                </div>
              </div>

              {(validationErrors.safety_checklist || validationErrors.safety_confirmation) && (
                <div className="mt-2 flex flex-col gap-1 text-xs text-destructive">
                  {validationErrors.safety_checklist && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationErrors.safety_checklist}</span>
                    </div>
                  )}
                  {validationErrors.safety_confirmation && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationErrors.safety_confirmation}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 space-y-4">
                {/* Covered during storage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      Was the food covered/protected during storage?
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyChecklist.coveredDuringStorage === true ? 'default' : 'outline'}
                        onClick={() => {
                          setSafetyChecklist((prev) => ({ ...prev, coveredDuringStorage: true }));
                          if (validationErrors.safety_checklist) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.safety_checklist;
                              return updated;
                            });
                          }
                        }}
                        className="px-3 text-xs"
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyChecklist.coveredDuringStorage === false ? 'destructive' : 'outline'}
                        onClick={() => {
                          setSafetyChecklist((prev) => ({ ...prev, coveredDuringStorage: false }));
                          if (validationErrors.safety_checklist) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.safety_checklist;
                              return updated;
                            });
                          }
                        }}
                        className="px-3 text-xs"
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Proper storage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      Was the food stored in proper conditions (e.g. refrigerated if needed)?
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyChecklist.storedProperly === true ? 'default' : 'outline'}
                        onClick={() => {
                          setSafetyChecklist((prev) => ({ ...prev, storedProperly: true }));
                          if (validationErrors.safety_checklist) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.safety_checklist;
                              return updated;
                            });
                          }
                        }}
                        className="px-3 text-xs"
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyChecklist.storedProperly === false ? 'destructive' : 'outline'}
                        onClick={() => {
                          setSafetyChecklist((prev) => ({ ...prev, storedProperly: false }));
                          if (validationErrors.safety_checklist) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.safety_checklist;
                              return updated;
                            });
                          }
                        }}
                        className="px-3 text-xs"
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Prepared recently */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      Was this food prepared today or yesterday?
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyChecklist.preparedRecently === true ? 'default' : 'outline'}
                        onClick={() => {
                          setSafetyChecklist((prev) => ({ ...prev, preparedRecently: true }));
                          if (validationErrors.safety_checklist) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.safety_checklist;
                              return updated;
                            });
                          }
                        }}
                        className="px-3 text-xs"
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyChecklist.preparedRecently === false ? 'destructive' : 'outline'}
                        onClick={() => {
                          setSafetyChecklist((prev) => ({ ...prev, preparedRecently: false }));
                          if (validationErrors.safety_checklist) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.safety_checklist;
                              return updated;
                            });
                          }
                        }}
                        className="px-3 text-xs"
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Packed safely */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      Is the food properly packed/sealed for safe transport?
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyChecklist.packedSafely === true ? 'default' : 'outline'}
                        onClick={() => {
                          setSafetyChecklist((prev) => ({ ...prev, packedSafely: true }));
                          if (validationErrors.safety_checklist) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.safety_checklist;
                              return updated;
                            });
                          }
                        }}
                        className="px-3 text-xs"
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={safetyChecklist.packedSafely === false ? 'destructive' : 'outline'}
                        onClick={() => {
                          setSafetyChecklist((prev) => ({ ...prev, packedSafely: false }));
                          if (validationErrors.safety_checklist) {
                            setValidationErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.safety_checklist;
                              return updated;
                            });
                          }
                        }}
                        className="px-3 text-xs"
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Final confirmation */}
                <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/40 p-3">
                  <Input
                    id="safety_confirmation"
                    type="checkbox"
                    checked={safetyConfirmation}
                    onChange={(e) => {
                      setSafetyConfirmation(e.target.checked);
                      if (validationErrors.safety_confirmation) {
                        setValidationErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.safety_confirmation;
                          return updated;
                        });
                      }
                    }}
                    className="mt-1 h-4 w-4"
                  />
                  <Label htmlFor="safety_confirmation" className="text-xs leading-snug">
                    I confirm that, to the best of my knowledge, this food has been handled safely and I would be
                    comfortable eating it myself.
                  </Label>
                </div>
              </div>
            </div>

            {/* Share button is controlled by Safety Shield completeness and loading state */}
            <Button
              type="submit"
              className="w-full"
              disabled={!Object.values(safetyChecklist).every((value) => value === true) || !safetyConfirmation || loading || imageUploading}
            >

              {loading || imageUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {imageUploading ? 'Uploading image...' : 'Creating post...'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Share Food
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}