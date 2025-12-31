import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { translateText } from '@/hooks/useTranslation';

export type Language = 'en' | 'ta' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translateDynamic: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.requests': 'Requests',
    'nav.addFood': 'Add Food',
    'nav.managePosts': 'Manage Posts',
    'nav.profile': 'Show Profile',
    'nav.logout': 'Log Out',
    
    // Homepage
    'home.badge': 'Reducing Food Waste Together',
    'home.title': 'NourishNet',
    'home.subtitle': 'Connect with your community to share surplus food, reduce waste, and nourish those in need. Every meal shared is a step towards a more sustainable future.',
    'home.getStarted': 'Get Started',
    'home.viewDashboard': 'View Dashboard',
    'home.learnMore': 'Learn More',
    'home.shareFoodNow': 'Share Food Now',
    'home.whyNourishNet': 'Why NourishNet?',
    'home.joinMovement': 'Join the Movement Today',
    'home.joinSubtitle': 'Be part of a community that\'s making a difference. Share food, reduce waste, and help nourish your neighbors.',
    
    // Stats
    'stats.communityMembers': 'Community Members',
    'stats.foodItemsShared': 'Food Items Shared',
    'stats.mealsRescued': 'Meals Rescued',
    'stats.requestsFulfilled': 'Requests Fulfilled',
    'stats.impact': 'Making a Real Impact',
    'stats.impactSubtitle': 'Our community is actively working together to reduce food waste and help those in need.',
    
    // Features
    'features.howItWorks': 'How NourishNet Works',
    'features.howItWorksSubtitle': 'Simple, secure, and sustainable food sharing in your community.',
    'features.locationBased': 'Location-Based Sharing',
    'features.locationBasedDesc': 'Find and share food in your immediate neighborhood with precise location tracking.',
    'features.communityNetwork': 'Community Network',
    'features.communityNetworkDesc': 'Connect with verified community members who care about reducing food waste.',
    'features.smartMatching': 'Smart Matching',
    'features.smartMatchingDesc': 'Advanced filters help you find exactly what you need or share what you have.',
    
    // Problem Section
    'problem.title': 'The Problem – Food Waste is a Global Crisis',
    'problem.subtitle': 'Every year, billions of tons of perfectly good food ends up in landfills while millions go hungry. This waste contributes to climate change and economic loss.',
    
    // Solution Section
    'solution.title': 'The Solution',
    'solution.subtitle': 'NourishNet connects food donors with people in need through a community-driven platform.',
    'solution.postSurplus': 'Post Surplus Food',
    'solution.postSurplusDesc': 'Share excess food from homes, restaurants, or events.',
    'solution.requestConnect': 'Request & Connect',
    'solution.requestConnectDesc': 'Find nearby food and chat securely for pickup.',
    'solution.trackImpact': 'Track Impact',
    'solution.trackImpactDesc': 'View meals saved and waste reduced.',
    
    // Platform Features
    'platform.title': 'Platform Features',
    'platform.subtitle': 'Built with modern technology for safe and impactful food sharing.',
    'platform.locationDiscovery': 'Location-Based Discovery',
    'platform.locationDiscoveryDesc': 'GPS-powered nearby food search.',
    'platform.verifiedCommunity': 'Verified Community',
    'platform.verifiedCommunityDesc': 'Ratings and reviews for trust.',
    'platform.sustainabilityTracking': 'Sustainability Tracking',
    'platform.sustainabilityTrackingDesc': 'Monitor meals saved and impact.',
    
    // Requests
    'requests.incoming': 'Incoming Requests',
    'requests.outgoing': 'My Requests',
    'requests.pending': 'Pending',
    'requests.accepted': 'Accepted',
    'requests.declined': 'Declined',
    'requests.completed': 'Collected',
    'requests.cancelled': 'Cancelled',
    'requests.expired': 'Expired',
    'requests.markCollected': 'Mark as Collected',
    'requests.markedClaimed': 'Marked as Claimed',
    'requests.finished': 'Finished',
    'requests.awaitingPickup': 'Awaiting Pickup',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.noResults': 'No results found',
    'common.backToTop': 'Back to Top',
    
    // Dashboard
    'dashboard.title': 'Food Near You',
    'dashboard.subtitle': 'Discover available food in your community',
    'dashboard.searchPlaceholder': 'Search food, location...',
    'dashboard.filters': 'Filters',
    'dashboard.clearAll': 'Clear All',
    'dashboard.noFoodAvailable': 'No food available nearby',
    'dashboard.noFoodMatchingFilters': 'No food items match your filters',
    'dashboard.viewDetails': 'Details',
    'dashboard.requestFood': 'Request',
    'dashboard.newest': 'Newest',
    'dashboard.nearest': 'Nearest',
    'dashboard.allCategories': 'All Categories',
    'dashboard.allCuisines': 'All Cuisines',
    'dashboard.allTags': 'All Tags',
    
    // Footer
    'footer.tagline': 'Share food, reduce waste, nourish community.',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.contact': 'Contact',
    'footer.rights': 'All rights reserved.',
    
    // Language
    'language.english': 'English',
    'language.tamil': 'தமிழ்',
    'language.hindi': 'हिंदी',
    'language.select': 'Select Language',
  },
  ta: {
    // Navigation
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.requests': 'கோரிக்கைகள்',
    'nav.addFood': 'உணவு சேர்க்க',
    'nav.managePosts': 'பதிவுகளை நிர்வகி',
    'nav.profile': 'சுயவிவரம் காட்டு',
    'nav.logout': 'வெளியேறு',
    
    // Homepage
    'home.badge': 'உணவு வீணாவதை குறைக்கிறோம்',
    'home.title': 'நரிஷ்நெட்',
    'home.subtitle': 'உங்கள் சமூகத்துடன் இணைந்து உபரி உணவைப் பகிர்ந்து, வீணாவதைக் குறைத்து, தேவையானவர்களுக்கு உணவளிக்கவும். பகிரப்படும் ஒவ்வொரு உணவும் நிலையான எதிர்காலத்தை நோக்கிய ஒரு படி.',
    'home.getStarted': 'தொடங்கு',
    'home.viewDashboard': 'டாஷ்போர்டு காண்க',
    'home.learnMore': 'மேலும் அறிய',
    'home.shareFoodNow': 'இப்போதே உணவு பகிரு',
    'home.whyNourishNet': 'ஏன் நரிஷ்நெட்?',
    'home.joinMovement': 'இன்றே இயக்கத்தில் சேருங்கள்',
    'home.joinSubtitle': 'மாற்றத்தை உருவாக்கும் சமூகத்தின் ஒரு பகுதியாக இருங்கள். உணவைப் பகிர்ந்து, வீணாவதைக் குறைத்து, உங்கள் அண்டை வீட்டாருக்கு உதவுங்கள்.',
    
    // Stats
    'stats.communityMembers': 'சமூக உறுப்பினர்கள்',
    'stats.foodItemsShared': 'பகிரப்பட்ட உணவுகள்',
    'stats.mealsRescued': 'காப்பாற்றப்பட்ட உணவுகள்',
    'stats.requestsFulfilled': 'நிறைவேற்றப்பட்ட கோரிக்கைகள்',
    'stats.impact': 'உண்மையான தாக்கத்தை உருவாக்குகிறோம்',
    'stats.impactSubtitle': 'உணவு வீணாவதைக் குறைக்கவும் தேவையானவர்களுக்கு உதவவும் எங்கள் சமூகம் தீவிரமாக ஒன்றிணைந்து செயல்படுகிறது.',
    
    // Features
    'features.howItWorks': 'நரிஷ்நெட் எப்படி செயல்படுகிறது',
    'features.howItWorksSubtitle': 'உங்கள் சமூகத்தில் எளிய, பாதுகாப்பான மற்றும் நிலையான உணவு பகிர்வு.',
    'features.locationBased': 'இடம் சார்ந்த பகிர்வு',
    'features.locationBasedDesc': 'துல்லியமான இருப்பிட கண்காணிப்புடன் உங்கள் அண்டை பகுதியில் உணவைக் கண்டறிந்து பகிரவும்.',
    'features.communityNetwork': 'சமூக நெட்வொர்க்',
    'features.communityNetworkDesc': 'உணவு வீணாவதைக் குறைக்க அக்கறை கொள்ளும் சரிபார்க்கப்பட்ட சமூக உறுப்பினர்களுடன் இணையுங்கள்.',
    'features.smartMatching': 'ஸ்மார்ட் பொருத்தம்',
    'features.smartMatchingDesc': 'மேம்பட்ட வடிகட்டிகள் உங்களுக்குத் தேவையானதைக் கண்டறிய அல்லது நீங்கள் வைத்திருப்பதைப் பகிர உதவுகின்றன.',
    
    // Problem Section
    'problem.title': 'பிரச்சனை – உணவு வீணாக்கம் ஒரு உலகளாவிய நெருக்கடி',
    'problem.subtitle': 'ஒவ்வொரு ஆண்டும், பில்லியன் கணக்கான டன் நல்ல உணவு குப்பைத் தொட்டியில் முடிகிறது, மில்லியன் கணக்கானோர் பசியுடன் இருக்கிறார்கள்.',
    
    // Solution Section
    'solution.title': 'தீர்வு',
    'solution.subtitle': 'நரிஷ்நெட் சமூகம் இயக்கும் தளத்தின் மூலம் உணவு நன்கொடையாளர்களை தேவையானவர்களுடன் இணைக்கிறது.',
    'solution.postSurplus': 'உபரி உணவைப் பதிவு செய்',
    'solution.postSurplusDesc': 'வீடுகள், உணவகங்கள் அல்லது நிகழ்வுகளிலிருந்து அதிகப்படியான உணவைப் பகிரவும்.',
    'solution.requestConnect': 'கோரிக்கை & இணைப்பு',
    'solution.requestConnectDesc': 'அருகிலுள்ள உணவைக் கண்டுபிடித்து பாதுகாப்பாக தொடர்பு கொள்ளுங்கள்.',
    'solution.trackImpact': 'தாக்கத்தைக் கண்காணி',
    'solution.trackImpactDesc': 'சேமிக்கப்பட்ட உணவுகள் மற்றும் குறைக்கப்பட்ட வீணாக்கத்தைப் பாருங்கள்.',
    
    // Platform Features
    'platform.title': 'தள அம்சங்கள்',
    'platform.subtitle': 'பாதுகாப்பான மற்றும் தாக்கமான உணவு பகிர்வுக்கு நவீன தொழில்நுட்பத்துடன் கட்டப்பட்டது.',
    'platform.locationDiscovery': 'இட அடிப்படையிலான கண்டுபிடிப்பு',
    'platform.locationDiscoveryDesc': 'GPS-இயக்கப்படும் அருகிலுள்ள உணவு தேடல்.',
    'platform.verifiedCommunity': 'சரிபார்க்கப்பட்ட சமூகம்',
    'platform.verifiedCommunityDesc': 'நம்பிக்கைக்கான மதிப்பீடுகள் மற்றும் விமர்சனங்கள்.',
    'platform.sustainabilityTracking': 'நிலைத்தன்மை கண்காணிப்பு',
    'platform.sustainabilityTrackingDesc': 'சேமிக்கப்பட்ட உணவுகள் மற்றும் தாக்கத்தைக் கண்காணிக்கவும்.',
    
    // Requests
    'requests.incoming': 'வரும் கோரிக்கைகள்',
    'requests.outgoing': 'எனது கோரிக்கைகள்',
    'requests.pending': 'நிலுவையில்',
    'requests.accepted': 'ஏற்றுக்கொள்ளப்பட்டது',
    'requests.declined': 'நிராகரிக்கப்பட்டது',
    'requests.completed': 'சேகரிக்கப்பட்டது',
    'requests.cancelled': 'ரத்துசெய்யப்பட்டது',
    'requests.expired': 'காலாவதியானது',
    'requests.markCollected': 'சேகரிக்கப்பட்டதாக குறி',
    'requests.markedClaimed': 'உரிமை கோரப்பட்டது',
    'requests.finished': 'முடிந்தது',
    'requests.awaitingPickup': 'எடுக்க காத்திருக்கிறது',
    
    // Common
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'பிழை',
    'common.success': 'வெற்றி',
    'common.cancel': 'ரத்துசெய்',
    'common.confirm': 'உறுதிப்படுத்து',
    'common.save': 'சேமி',
    'common.delete': 'நீக்கு',
    'common.edit': 'திருத்து',
    'common.back': 'பின்செல்',
    'common.next': 'அடுத்து',
    'common.previous': 'முந்தைய',
    'common.search': 'தேடு',
    'common.filter': 'வடிகட்டு',
    'common.sort': 'வரிசைப்படுத்து',
    'common.noResults': 'முடிவுகள் இல்லை',
    'common.backToTop': 'மேலே செல்',
    
    // Dashboard
    'dashboard.title': 'உங்கள் அருகிலுள்ள உணவு',
    'dashboard.subtitle': 'உங்கள் சமூகத்தில் கிடைக்கும் உணவைக் கண்டறியுங்கள்',
    'dashboard.searchPlaceholder': 'உணவு, இடம் தேடுங்கள்...',
    'dashboard.filters': 'வடிகட்டிகள்',
    'dashboard.clearAll': 'அனைத்தையும் அழி',
    'dashboard.noFoodAvailable': 'அருகில் உணவு இல்லை',
    'dashboard.noFoodMatchingFilters': 'உங்கள் வடிகட்டிகளுக்கு பொருந்தும் உணவு இல்லை',
    'dashboard.viewDetails': 'விவரங்கள்',
    'dashboard.requestFood': 'கோரிக்கை',
    'dashboard.newest': 'புதியது',
    'dashboard.nearest': 'அருகில்',
    'dashboard.allCategories': 'அனைத்து வகைகள்',
    'dashboard.allCuisines': 'அனைத்து உணவு வகைகள்',
    'dashboard.allTags': 'அனைத்து குறிச்சொற்கள்',
    
    // Footer
    'footer.tagline': 'உணவைப் பகிர், வீணாக்கத்தைக் குறை, சமூகத்தை ஊட்டு.',
    'footer.privacy': 'தனியுரிமை',
    'footer.terms': 'விதிமுறைகள்',
    'footer.contact': 'தொடர்பு',
    'footer.rights': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    
    // Language
    'language.english': 'English',
    'language.tamil': 'தமிழ்',
    'language.hindi': 'हिंदी',
    'language.select': 'மொழியைத் தேர்ந்தெடு',
  },
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.requests': 'अनुरोध',
    'nav.addFood': 'भोजन जोड़ें',
    'nav.managePosts': 'पोस्ट प्रबंधित करें',
    'nav.profile': 'प्रोफाइल दिखाएं',
    'nav.logout': 'लॉग आउट',
    
    // Homepage
    'home.badge': 'मिलकर भोजन की बर्बादी कम करें',
    'home.title': 'नरिशनेट',
    'home.subtitle': 'अपने समुदाय से जुड़कर अतिरिक्त भोजन साझा करें, बर्बादी कम करें और जरूरतमंदों को पोषण दें। साझा किया गया हर भोजन एक टिकाऊ भविष्य की ओर कदम है।',
    'home.getStarted': 'शुरू करें',
    'home.viewDashboard': 'डैशबोर्ड देखें',
    'home.learnMore': 'और जानें',
    'home.shareFoodNow': 'अभी भोजन साझा करें',
    'home.whyNourishNet': 'नरिशनेट क्यों?',
    'home.joinMovement': 'आज ही आंदोलन में शामिल हों',
    'home.joinSubtitle': 'बदलाव लाने वाले समुदाय का हिस्सा बनें। भोजन साझा करें, बर्बादी कम करें और अपने पड़ोसियों की मदद करें।',
    
    // Stats
    'stats.communityMembers': 'समुदाय के सदस्य',
    'stats.foodItemsShared': 'साझा किए गए भोजन',
    'stats.mealsRescued': 'बचाए गए भोजन',
    'stats.requestsFulfilled': 'पूर्ण किए गए अनुरोध',
    'stats.impact': 'वास्तविक प्रभाव बना रहे हैं',
    'stats.impactSubtitle': 'हमारा समुदाय भोजन की बर्बादी कम करने और जरूरतमंदों की मदद के लिए सक्रिय रूप से मिलकर काम कर रहा है।',
    
    // Features
    'features.howItWorks': 'नरिशनेट कैसे काम करता है',
    'features.howItWorksSubtitle': 'आपके समुदाय में सरल, सुरक्षित और टिकाऊ भोजन साझाकरण।',
    'features.locationBased': 'स्थान-आधारित साझाकरण',
    'features.locationBasedDesc': 'सटीक स्थान ट्रैकिंग के साथ अपने पड़ोस में भोजन खोजें और साझा करें।',
    'features.communityNetwork': 'सामुदायिक नेटवर्क',
    'features.communityNetworkDesc': 'भोजन की बर्बादी कम करने की परवाह करने वाले सत्यापित समुदाय सदस्यों से जुड़ें।',
    'features.smartMatching': 'स्मार्ट मिलान',
    'features.smartMatchingDesc': 'उन्नत फ़िल्टर आपको वह खोजने में मदद करते हैं जो आपको चाहिए या जो आपके पास है उसे साझा करने में।',
    
    // Problem Section
    'problem.title': 'समस्या – भोजन की बर्बादी एक वैश्विक संकट है',
    'problem.subtitle': 'हर साल, अरबों टन अच्छा भोजन कूड़ेदान में जाता है जबकि लाखों लोग भूखे रहते हैं।',
    
    // Solution Section
    'solution.title': 'समाधान',
    'solution.subtitle': 'नरिशनेट समुदाय-संचालित मंच के माध्यम से भोजन दाताओं को जरूरतमंदों से जोड़ता है।',
    'solution.postSurplus': 'अतिरिक्त भोजन पोस्ट करें',
    'solution.postSurplusDesc': 'घरों, रेस्तरां या कार्यक्रमों से अतिरिक्त भोजन साझा करें।',
    'solution.requestConnect': 'अनुरोध और जुड़ें',
    'solution.requestConnectDesc': 'पास का भोजन खोजें और सुरक्षित रूप से संपर्क करें।',
    'solution.trackImpact': 'प्रभाव ट्रैक करें',
    'solution.trackImpactDesc': 'बचाए गए भोजन और कम हुई बर्बादी देखें।',
    
    // Platform Features
    'platform.title': 'प्लेटफॉर्म सुविधाएं',
    'platform.subtitle': 'सुरक्षित और प्रभावी भोजन साझाकरण के लिए आधुनिक तकनीक से निर्मित।',
    'platform.locationDiscovery': 'स्थान-आधारित खोज',
    'platform.locationDiscoveryDesc': 'GPS-संचालित पास का भोजन खोज।',
    'platform.verifiedCommunity': 'सत्यापित समुदाय',
    'platform.verifiedCommunityDesc': 'विश्वास के लिए रेटिंग और समीक्षाएं।',
    'platform.sustainabilityTracking': 'स्थिरता ट्रैकिंग',
    'platform.sustainabilityTrackingDesc': 'बचाए गए भोजन और प्रभाव की निगरानी करें।',
    
    // Requests
    'requests.incoming': 'आने वाले अनुरोध',
    'requests.outgoing': 'मेरे अनुरोध',
    'requests.pending': 'लंबित',
    'requests.accepted': 'स्वीकृत',
    'requests.declined': 'अस्वीकृत',
    'requests.completed': 'एकत्रित',
    'requests.cancelled': 'रद्द',
    'requests.expired': 'समाप्त',
    'requests.markCollected': 'एकत्रित के रूप में चिह्नित करें',
    'requests.markedClaimed': 'दावा किया गया',
    'requests.finished': 'समाप्त',
    'requests.awaitingPickup': 'पिकअप की प्रतीक्षा',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.save': 'सहेजें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.back': 'वापस',
    'common.next': 'अगला',
    'common.previous': 'पिछला',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.sort': 'क्रमबद्ध',
    'common.noResults': 'कोई परिणाम नहीं मिला',
    'common.backToTop': 'ऊपर जाएं',
    
    // Dashboard
    'dashboard.title': 'आपके पास का भोजन',
    'dashboard.subtitle': 'अपने समुदाय में उपलब्ध भोजन खोजें',
    'dashboard.searchPlaceholder': 'भोजन, स्थान खोजें...',
    'dashboard.filters': 'फ़िल्टर',
    'dashboard.clearAll': 'सब साफ करें',
    'dashboard.noFoodAvailable': 'पास में कोई भोजन उपलब्ध नहीं',
    'dashboard.noFoodMatchingFilters': 'आपके फ़िल्टर से कोई भोजन मेल नहीं खाता',
    'dashboard.viewDetails': 'विवरण',
    'dashboard.requestFood': 'अनुरोध',
    'dashboard.newest': 'नवीनतम',
    'dashboard.nearest': 'निकटतम',
    'dashboard.allCategories': 'सभी श्रेणियां',
    'dashboard.allCuisines': 'सभी व्यंजन',
    'dashboard.allTags': 'सभी टैग',
    
    // Footer
    'footer.tagline': 'भोजन साझा करें, बर्बादी कम करें, समुदाय को पोषण दें।',
    'footer.privacy': 'गोपनीयता',
    'footer.terms': 'शर्तें',
    'footer.contact': 'संपर्क',
    'footer.rights': 'सर्वाधिकार सुरक्षित।',
    
    // Language
    'language.english': 'English',
    'language.tamil': 'தமிழ்',
    'language.hindi': 'हिंदी',
    'language.select': 'भाषा चुनें',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      // First check localStorage for guest preference
      const storedLang = localStorage.getItem('nourishnet_language') as Language;
      
      if (user) {
        // For logged-in users, try to get from profile
        try {
          const { data } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (data?.preferred_language) {
            setLanguageState(data.preferred_language as Language);
            localStorage.setItem('nourishnet_language', data.preferred_language);
          } else if (storedLang && ['en', 'ta', 'hi'].includes(storedLang)) {
            setLanguageState(storedLang);
          }
        } catch (error) {
          // Fallback to localStorage
          if (storedLang && ['en', 'ta', 'hi'].includes(storedLang)) {
            setLanguageState(storedLang);
          }
        }
      } else if (storedLang && ['en', 'ta', 'hi'].includes(storedLang)) {
        setLanguageState(storedLang);
      }
      
      setIsInitialized(true);
    };
    
    loadLanguage();
  }, [user]);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nourishnet_language', lang);
    
    // If user is logged in, save to profile
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  }, [user]);

  const t = useCallback((key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  }, [language]);

  const translateDynamic = useCallback(async (text: string): Promise<string> => {
    if (!text || language === 'en') return text;
    return translateText(text, language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateDynamic }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
