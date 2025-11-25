/**
 * Device detection utilities for determining device type and capabilities
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
}

export const detectDevice = (): DeviceInfo => {
  // Check if running in browser
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      hasTouch: false,
      screenWidth: 1920,
      screenHeight: 1080,
      deviceType: 'desktop',
      os: 'unknown'
    };
  }

  const userAgent = navigator.userAgent;
  const platform = (navigator as any).userAgentData?.platform || navigator.platform;
  
  // Mobile detection
  const isMobileUA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTabletUA = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
  
  // Touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // OS detection
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isWindows = /Win/i.test(platform);
  const isMacOS = /Mac/i.test(platform) && !isIOS;
  const isLinux = /Linux/i.test(platform) && !isAndroid;
  
  // Screen dimensions
  const screenWidth = window.innerWidth || screen.width;
  const screenHeight = window.innerHeight || screen.height;
  
  // Determine device type
  let deviceType: 'mobile' | 'tablet' | 'desktop';
  if (isMobileUA && !isTabletUA) {
    deviceType = 'mobile';
  } else if (isTabletUA) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }
  
  // Determine OS
  let os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  if (isIOS) {
    os = 'ios';
  } else if (isAndroid) {
    os = 'android';
  } else if (isWindows) {
    os = 'windows';
  } else if (isMacOS) {
    os = 'macos';
  } else if (isLinux) {
    os = 'linux';
  } else {
    os = 'unknown';
  }

  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isIOS,
    isAndroid,
    hasTouch,
    screenWidth,
    screenHeight,
    deviceType,
    os
  };
};

export const isMobileDevice = (): boolean => {
  const device = detectDevice();
  return device.isMobile || device.isTablet;
};

export const isDesktopDevice = (): boolean => {
  const device = detectDevice();
  return device.isDesktop;
};

export const supportsMediaRecorder = (): boolean => {
  return typeof MediaRecorder !== 'undefined';
};

export const supportsDisplayMedia = (): boolean => {
  return typeof navigator !== 'undefined' && 
         typeof navigator.mediaDevices !== 'undefined' &&
         typeof navigator.mediaDevices.getDisplayMedia === 'function';
};

export const supportsUserMedia = (): boolean => {
  return typeof navigator !== 'undefined' && 
         typeof navigator.mediaDevices !== 'undefined' &&
         typeof navigator.mediaDevices.getUserMedia === 'function';
};
