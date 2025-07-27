/**
 * Device detection utilities for determining interaction methods
 * Focuses on touch capability rather than screen size
 */

/**
 * Check if the device has touch screen capability
 * @returns boolean - True if device supports touch
 */
export const hasTouchScreen = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Check if device is likely a mobile device based on user agent
 * @returns boolean - True if mobile device detected
 */
export const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if device is likely a tablet based on user agent and screen size
 * @returns boolean - True if tablet detected
 */
export const isTabletDevice = (): boolean => {
  const isTabletUserAgent = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  const hasTabletScreenSize = window.innerWidth >= 768 && window.innerWidth <= 1024;
  return isTabletUserAgent || (hasTouchScreen() && hasTabletScreenSize);
};

/**
 * Determine if touch-based interactions should be used
 * This includes phones and tablets but excludes desktop touchscreens
 * @returns boolean - True if touch interactions should be primary
 */
export const shouldUseTouchInteractions = (): boolean => {
  // If it's clearly a mobile or tablet device, use touch interactions
  if (isMobileDevice() || isTabletDevice()) {
    return true;
  }
  
  // For touch-capable devices, check screen size to distinguish 
  // mobile/tablet from desktop touchscreens
  if (hasTouchScreen()) {
    // Assume devices under 1200px width are mobile/tablet
    return window.innerWidth < 1200;
  }
  
  return false;
};

/**
 * Get device type string for debugging/logging
 * @returns string - Device type description
 */
export const getDeviceType = (): string => {
  if (isMobileDevice()) {
    if (isTabletDevice()) {
      return 'tablet';
    }
    return 'mobile';
  }
  
  if (hasTouchScreen()) {
    return 'desktop-touch';
  }
  
  return 'desktop';
};

/**
 * React hook for touch interaction detection with window resize handling
 */
import { useState, useEffect } from 'react';

export const useTouchInteractions = (): boolean => {
  const [shouldUseTouch, setShouldUseTouch] = useState(() => shouldUseTouchInteractions());
  
  useEffect(() => {
    const handleResize = () => {
      setShouldUseTouch(shouldUseTouchInteractions());
    };
    
    // Check immediately and on resize
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return shouldUseTouch;
};