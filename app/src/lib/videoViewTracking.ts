// Utility function to track video views
export const trackVideoView = async (submissionId: string): Promise<void> => {
  try {
    await fetch(`/api/proof-submissions/${submissionId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to track video view:', error);
    // Don't throw error, just log it - view tracking shouldn't break UX
  }
};

// Hook to track views with debouncing
export const useVideoViewTracking = () => {
  const trackView = (submissionId: string) => {
    // Simple debouncing - only track one view per submission per session
    const viewedKey = `viewed_${submissionId}`;
    if (sessionStorage.getItem(viewedKey)) {
      return; // Already viewed in this session
    }
    
    trackVideoView(submissionId);
    sessionStorage.setItem(viewedKey, 'true');
  };

  return { trackView };
};