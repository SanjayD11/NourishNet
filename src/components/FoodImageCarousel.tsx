import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface FoodImageCarouselProps {
  images?: string[];
  fallbackImage?: string;
  title: string;
  className?: string;
  showCounter?: boolean;
  aspectRatio?: string;
}

export default function FoodImageCarousel({
  images,
  fallbackImage,
  title,
  className = "",
  showCounter = true,
  aspectRatio = "aspect-[4/3]"
}: FoodImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const allImages = images && images.length > 0 ? images : (fallbackImage ? [fallbackImage] : []);

  useEffect(() => {
    if (!api) return;

    api.on('select', () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  if (allImages.length === 0) {
    return (
      <div className={`${aspectRatio} w-full bg-gradient-to-br from-primary/20 to-primary/40 rounded-xl shadow-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <MapPin className="w-16 h-16 fallback-text mx-auto mb-4" />
          <p className="fallback-text font-medium text-lg">No image available</p>
        </div>
      </div>
    );
  }

  if (allImages.length === 1) {
    return (
      <div className={`${aspectRatio} w-full overflow-hidden rounded-xl shadow-lg ${className}`}>
        <img
          src={allImages[0]}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Carousel 
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent>
          {allImages.map((imageUrl, index) => (
            <CarouselItem key={index}>
              <div className={`${aspectRatio} w-full overflow-hidden rounded-xl shadow-lg`}>
                <img
                  src={imageUrl}
                  alt={`${title} - Image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
      
      {/* Image Counter */}
      {showCounter && allImages.length > 1 && (
        <Badge className="absolute bottom-4 right-4 badge-overlay">
          {currentSlide + 1} / {allImages.length}
        </Badge>
      )}
    </div>
  );
}