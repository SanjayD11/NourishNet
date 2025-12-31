import React, { useState, useEffect, useCallback } from "react";
import { MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationMapPreviewProps {
  latitude: number;
  longitude: number;
  onChangeCoords?: (lat: number, lng: number) => void;
  locationName?: string;
}

const LocationMapPreview: React.FC<LocationMapPreviewProps> = ({ 
  latitude, 
  longitude, 
  onChangeCoords,
  locationName 
}) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);

  // Validate coordinates
  const isValidCoordinates = !isNaN(latitude) && !isNaN(longitude) && 
    latitude >= -90 && latitude <= 90 && 
    longitude >= -180 && longitude <= 180 &&
    (latitude !== 0 || longitude !== 0);

  // Generate Google Maps embed URL with marker
  const getMapUrl = useCallback(() => {
    if (!isValidCoordinates) return '';
    
    // Using Google Maps Embed API - free tier, no API key required for basic embed
    // The 'place' mode shows a marker at the specified location
    const query = encodeURIComponent(`${latitude},${longitude}`);
    return `https://www.google.com/maps?q=${query}&z=16&output=embed`;
  }, [latitude, longitude, isValidCoordinates]);

  // Reset loading state when coordinates change
  useEffect(() => {
    if (isValidCoordinates) {
      setIsLoading(true);
      setMapError(false);
      setKey(prev => prev + 1);
    }
  }, [latitude, longitude, isValidCoordinates]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setMapError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setMapError(true);
  };

  const handleRetry = () => {
    setMapError(false);
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  if (!isValidCoordinates) {
    return (
      <div className="space-y-1">
        <div className="h-48 w-full rounded-lg border border-border/40 bg-muted/30 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Set location to see map preview</p>
          </div>
        </div>
      </div>
    );
  }

  // Static map fallback using OpenStreetMap tiles
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=16&size=400x200&markers=${latitude},${longitude},red-marker`;

  return (
    <div className="space-y-2">
      <div className="relative h-48 w-full rounded-lg border border-border/40 overflow-hidden bg-muted/20">
        {/* Loading overlay */}
        {isLoading && !mapError && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Loading map...</span>
            </div>
          </div>
        )}

        {/* Error state with static fallback */}
        {mapError ? (
          <div className="h-full w-full flex flex-col">
            {/* Static map fallback */}
            <div className="flex-1 relative">
              <img 
                src={staticMapUrl}
                alt={`Map showing location at ${latitude}, ${longitude}`}
                className="w-full h-full object-cover"
                onError={() => {
                  // If static map also fails, show placeholder
                }}
              />
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <div className="text-center p-4">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mb-2">
                    Interactive map unavailable
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                    className="text-xs h-7"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Google Maps iframe embed */
          <iframe
            key={key}
            src={getMapUrl()}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Location Map Preview"
            allowFullScreen
          />
        )}
      </div>

      {/* Location info */}
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {locationName && (
            <p className="text-xs text-foreground truncate">{locationName}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Preview of the pickup location. Use "Get Current Location" or update coordinates manually.
      </p>
    </div>
  );
};

export default LocationMapPreview;
