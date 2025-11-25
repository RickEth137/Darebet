'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Square, Play, Pause, Download, RotateCcw, Smartphone } from 'lucide-react';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob, url: string) => void;
  maxDuration?: number; // in seconds - max 60 seconds
  dareId: string;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  onVideoRecorded, 
  maxDuration = 60, // Max 60 seconds enforced
  dareId 
}) => {
  // Enforce maximum 60 second limit
  const enforcedMaxDuration = Math.min(maxDuration, 60);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect device type and capabilities
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    
    let device = 'Desktop';
    if (isIOS) device = 'iOS';
    else if (isAndroid) device = 'Android';
    else if (isMobile) device = 'Mobile';
    
    setDeviceInfo(device);
  }, []);

  // Get optimal video constraints based on device
  const getVideoConstraints = useCallback(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const baseConstraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: isMobile ? 720 : 1280 },
        height: { ideal: isMobile ? 1280 : 720 },
        frameRate: { ideal: 30, max: 60 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };

    // iOS-specific optimizations
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return {
        ...baseConstraints,
        video: {
          ...baseConstraints.video,
          width: { ideal: 720 },
          height: { ideal: 1280 }
        }
      };
    }

    return baseConstraints;
  }, [facingMode]);

  // Request camera permissions and start preview
  const startCamera = useCallback(async () => {
    try {
      const constraints = getVideoConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setMediaStream(stream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Prevent audio feedback during preview
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
    }
  }, [getVideoConstraints]);

  // Stop camera and clean up
  const stopCamera = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [mediaStream]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!mediaStream) return;

    try {
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus' // Fallback handled below
      };

      // Check for supported MIME types (better mobile compatibility)
      if (options.mimeType && !MediaRecorder.isTypeSupported(options.mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          options.mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options.mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          options.mimeType = 'video/mp4';
        }
      }

      const mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType || 'video/webm' 
        });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsPreviewMode(true);
        onVideoRecorded(blob, url);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= enforcedMaxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [mediaStream, maxDuration, onVideoRecorded]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // Reset recording
  const resetRecording = useCallback(() => {
    setRecordedVideoUrl(null);
    setIsPreviewMode(false);
    setIsPlaying(false);
    setRecordingTime(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Restart camera preview
    startCamera();
  }, [startCamera]);

  // Play/Pause video
  const togglePlayback = useCallback(() => {
    if (videoRef.current && isPreviewMode) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying, isPreviewMode]);

  // Toggle camera (front/back on mobile)
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    stopCamera();
    setTimeout(startCamera, 100); // Small delay to ensure camera is released
  }, [stopCamera, startCamera]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [stopCamera, recordedVideoUrl]);

  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Enter Dare</span>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {deviceInfo}
          </span>
        </div>
        
        {/* Timer */}
        <div className="text-white font-mono">
          {formatTime(recordingTime)} / {formatTime(enforcedMaxDuration)}
        </div>
      </div>

      {/* Video Container */}
      <div className="relative aspect-[9/16] bg-black">
        {hasPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>Enable Camera</span>
            </button>
          </div>
        )}

        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center text-white">
              <Camera className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium mb-2">Camera Access Required</p>
              <p className="text-sm text-gray-300 mb-4">
                Please allow camera access to record your proof video
              </p>
              <button
                onClick={startCamera}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {hasPermission && !isPreviewMode && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}

        {isPreviewMode && recordedVideoUrl && (
          <video
            ref={videoRef}
            src={recordedVideoUrl}
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            onPlay={() => {
              console.log('✅ Playback started');
              setIsPlaying(true);
            }}
            onPause={() => {
              console.log('⏸️ Playback paused');
              setIsPlaying(false);
            }}
            onEnded={() => {
              console.log('✅ Playback ended');
              setIsPlaying(false);
            }}
          />
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-anarchist-red px-3 py-2 rounded-full animate-pulse z-20">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span className="text-anarchist-black text-sm font-brutal font-bold uppercase">RECORDING</span>
          </div>
        )}

        {/* Camera flip button (mobile only) */}
        {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && hasPermission && !isPreviewMode && !isRecording && mediaStream && (
          <button
            onClick={toggleCamera}
            className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors z-20"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}

        {/* Watermark - Bottom Right Corner */}
        {(hasPermission && mediaStream) || isPreviewMode ? (
          <div className="absolute bottom-12 right-8 z-20 opacity-80 flex flex-col items-center gap-0">
            <img 
              src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq"
              alt="Watermark"
              className="w-24 h-auto"
            />
            <span className="text-white font-brutal text-sm -mt-1">darebet.fun</span>
          </div>
        ) : null}

        {/* Action Bar - Only show when camera is active or in preview mode */}
        {(hasPermission && mediaStream && !isPreviewMode) || isPreviewMode ? (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 z-20">
            <div className="flex items-center justify-center space-x-3">
              {!isPreviewMode ? (
                // Live Camera State
                <>
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={!hasPermission}
                      className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-2.5 rounded-lg disabled:bg-anarchist-gray disabled:cursor-not-allowed transition-all flex items-center space-x-2 font-brutal font-bold uppercase tracking-wider text-sm shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      <div className="w-3 h-3 bg-anarchist-black rounded-full" />
                      <span>Start Recording</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-2.5 rounded-lg transition-all flex items-center space-x-2 font-brutal font-bold uppercase tracking-wider text-sm shadow-lg hover:shadow-xl animate-pulse"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </button>
                  )}
                </>
              ) : (
                // Preview State
                <>
                  <button
                    onClick={togglePlayback}
                    className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-5 py-2.5 rounded-lg transition-all flex items-center space-x-2 font-brutal font-bold uppercase tracking-wider text-sm shadow-lg hover:shadow-xl"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetRecording}
                    className="bg-anarchist-gray hover:bg-gray-600 text-anarchist-offwhite px-5 py-2.5 rounded-lg transition-all flex items-center space-x-2 font-brutal font-bold uppercase tracking-wider text-sm shadow-lg hover:shadow-xl"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Re-record</span>
                  </button>

                  <div className="flex items-center space-x-2 bg-green-900/50 border border-green-500 text-green-400 px-5 py-2.5 rounded-lg shadow-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-brutal font-bold uppercase">Ready</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Timer Display */}
      <div className="mt-2 text-xs text-anarchist-gray text-center font-mono">
        {formatTime(recordingTime)} / {formatTime(enforcedMaxDuration)}
      </div>
    </div>
  );
};

export default VideoRecorder;