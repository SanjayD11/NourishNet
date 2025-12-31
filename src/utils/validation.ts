// Validation utilities for NourishNet app

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Address validation
export const validateAddress = (address: string): ValidationResult => {
  if (!address || address.trim().length === 0) {
    return {
      isValid: false,
      error: 'Address is required'
    };
  }

  if (address.trim().length < 5) {
    return {
      isValid: false,
      error: 'Please provide a more detailed address (minimum 5 characters)'
    };
  }

  // Check for meaningful address components
  const addressLower = address.toLowerCase().trim();
  const hasStreetIndicators = /\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|way|place|pl|court|ct|circle|cir|boulevard|blvd)\b/.test(addressLower);
  const hasNumbers = /\d/.test(address);
  const hasComma = address.includes(',');
  
  // Score the address quality
  let qualityScore = 0;
  if (hasStreetIndicators) qualityScore += 2;
  if (hasNumbers) qualityScore += 2;
  if (hasComma) qualityScore += 1;
  if (address.length > 15) qualityScore += 1;

  if (qualityScore < 2) {
    return {
      isValid: false,
      error: 'Please provide a more complete address (e.g., "123 Main St, City" or include nearby landmarks)'
    };
  }

  return {
    isValid: true
  };
};

// Location name validation for food posts
export const validateLocationName = (locationName: string): ValidationResult => {
  if (!locationName || locationName.trim().length === 0) {
    return {
      isValid: false,
      error: 'Pickup location is required'
    };
  }

  if (locationName.trim().length < 8) {
    return {
      isValid: false,
      error: 'Please provide a detailed pickup location (minimum 8 characters) including address or clear landmarks'
    };
  }

  // Check for generic/vague descriptions
  const vaguePhrases = [
    'my house', 'my place', 'here', 'near me', 'close by', 'around here', 
    'same place', 'usual spot', 'you know where'
  ];
  
  const locationLower = locationName.toLowerCase();
  if (vaguePhrases.some(phrase => locationLower.includes(phrase))) {
    return {
      isValid: false,
      error: 'Please provide a specific address or clear pickup instructions instead of vague descriptions'
    };
  }

  return {
    isValid: true
  };
};

// Coordinates validation
export const validateCoordinates = (lat: number, lng: number): ValidationResult => {
  if (lat === 0 && lng === 0) {
    return {
      isValid: false,
      error: 'Please set your location coordinates'
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      isValid: false,
      error: 'Latitude must be between -90 and 90 degrees'
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      isValid: false,
      error: 'Longitude must be between -180 and 180 degrees'
    };
  }

  return {
    isValid: true
  };
};

// Phone number validation
export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return {
      isValid: true // Phone is optional
    };
  }

  // Remove spaces, dashes, parentheses for validation
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (!/^[+]?[\d]{7,15}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (7-15 digits, + allowed for country code)'
    };
  }

  return {
    isValid: true
  };
};

// Profile validation
export const validateProfile = (profile: {
  name: string;
  location: string;
  phone_number?: string;
  whatsapp_number?: string;
}): { [key: string]: ValidationResult } => {
  const results: { [key: string]: ValidationResult } = {};

  // Validate name
  if (!profile.name || profile.name.trim().length === 0) {
    results.name = {
      isValid: false,
      error: 'Name is required'
    };
  } else if (profile.name.trim().length < 2) {
    results.name = {
      isValid: false,
      error: 'Name must be at least 2 characters long'
    };
  } else {
    results.name = { isValid: true };
  }

  // Validate location/address
  results.location = validateAddress(profile.location);

  // Validate phone numbers
  if (profile.phone_number) {
    results.phone_number = validatePhoneNumber(profile.phone_number);
  }
  
  if (profile.whatsapp_number) {
    results.whatsapp_number = validatePhoneNumber(profile.whatsapp_number);
  }

  return results;
};

// Food post validation
export const validateFoodPost = (post: {
  food_title: string;
  description: string;
  location_name: string;
  location_lat: number;
  location_long: number;
  food_category: string;
}): { [key: string]: ValidationResult } => {
  const results: { [key: string]: ValidationResult } = {};

  // Validate title
  if (!post.food_title || post.food_title.trim().length === 0) {
    results.food_title = {
      isValid: false,
      error: 'Food title is required'
    };
  } else if (post.food_title.trim().length < 3) {
    results.food_title = {
      isValid: false,
      error: 'Food title must be at least 3 characters long'
    };
  } else {
    results.food_title = { isValid: true };
  }

  // Validate description
  if (!post.description || post.description.trim().length === 0) {
    results.description = {
      isValid: false,
      error: 'Description is required'
    };
  } else if (post.description.trim().length < 10) {
    results.description = {
      isValid: false,
      error: 'Please provide a more detailed description (minimum 10 characters)'
    };
  } else {
    results.description = { isValid: true };
  }

  // Validate category
  if (!post.food_category) {
    results.food_category = {
      isValid: false,
      error: 'Food category is required'
    };
  } else {
    results.food_category = { isValid: true };
  }

  // Validate location
  results.location_name = validateLocationName(post.location_name);
  results.coordinates = validateCoordinates(post.location_lat, post.location_long);

  return results;
};