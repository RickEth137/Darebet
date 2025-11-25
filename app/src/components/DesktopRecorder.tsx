'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Square, RotateCcw, AlertCircle, Play, Pause } from 'lucide-react';

interface DesktopRecorderProps {
  onVideoRecorded: (blob: Blob, url: string) => void;
  maxDuration?: number;
  dareId: string;
}

const DesktopRecorder: React.FC<DesktopRecorderProps> = ({
  onVideoRecorded,
  maxDuration = 60,
  dareId
}) => {
  const enforcedMaxDuration = Math.min(maxDuration, 60);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Request webcam permission (desktop version with higher quality)
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('🎥 Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('✅ Camera access granted');
      console.log('Stream:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      console.log('Audio tracks:', stream.getAudioTracks());

      setMediaStream(stream);
      setHasPermission(true);

      // Wait a bit for the component to be ready
      setTimeout(() => {
        if (videoRef.current) {
          console.log('📹 Setting video source...');
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          
          // Try to play
          videoRef.current.play()
            .then(() => console.log('✅ Video playing'))
            .catch(err => console.error('❌ Play error:', err));
        }
      }, 100);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
      
      setHasPermission(false);
    }
  }, []);

  // Stop camera
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
      setError(null);
      
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsPreviewMode(true);
        onVideoRecorded(blob, url);
        stopCamera();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

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
      setError('Failed to start recording. Please try again.');
    }
  }, [mediaStream, enforcedMaxDuration, onVideoRecorded, stopCamera]);

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
    setHasPermission(null);
    setError(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

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

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup
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
    <div className="w-full mx-auto bg-anarchist-black rounded-lg overflow-hidden border-2 border-anarchist-red">
      {/* Header */}
      <div className="bg-anarchist-charcoal p-3 flex items-center justify-between border-b-2 border-anarchist-red">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-anarchist-red" />
          <span className="text-anarchist-offwhite font-brutal font-bold uppercase tracking-wider text-sm">Enter Dare</span>
          <span className="text-xs text-anarchist-gray bg-anarchist-black px-2 py-1 rounded">
            Desktop Webcam
          </span>
        </div>

        {/* Timer */}
        <div className="text-anarchist-red font-mono font-bold text-lg">
          {formatTime(recordingTime)} / {formatTime(enforcedMaxDuration)}
        </div>
      </div>

      {/* Video Container - HORIZONTAL/LANDSCAPE */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        {hasPermission === null && !error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-anarchist-black bg-opacity-95 z-10">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-anarchist-red" />
              <h3 className="text-anarchist-offwhite text-lg font-brutal font-bold mb-2 uppercase tracking-wider">
                Webcam Recording Required
              </h3>
              <p className="text-anarchist-gray text-sm mb-6 max-w-md">
                Click below to enable your webcam and record yourself completing the dare.
                This ensures your proof is recorded live.
              </p>
              <button
                onClick={startCamera}
                className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors mx-auto font-brutal font-bold uppercase tracking-wider"
              >
                <Camera className="w-5 h-5" />
                <span>Enable Webcam</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-anarchist-black bg-opacity-95 z-10">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-anarchist-red" />
              <p className="text-anarchist-red text-sm mb-4 font-bold">{error}</p>
              <button
                onClick={startCamera}
                className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-4 py-2 rounded-lg transition-colors font-brutal font-bold uppercase tracking-wider"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Show Enable Webcam button if permission granted but no video showing */}
        {hasPermission && !mediaStream && !isPreviewMode && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-anarchist-black bg-opacity-95 z-10">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-anarchist-red animate-pulse" />
              <h3 className="text-anarchist-offwhite text-lg font-brutal font-bold mb-2 uppercase tracking-wider">
                Camera Not Active
              </h3>
              <p className="text-anarchist-gray text-sm mb-6 max-w-md">
                Camera permission granted but stream not started. Click below to activate.
              </p>
              <button
                onClick={startCamera}
                className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors mx-auto font-brutal font-bold uppercase tracking-wider"
              >
                <Camera className="w-5 h-5" />
                <span>Enable Webcam</span>
              </button>
            </div>
          </div>
        )}

        {/* Video element for live camera or playback */}
        {!isPreviewMode ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover bg-black"
            style={{ transform: 'scaleX(-1)' }}
            onLoadedMetadata={(e) => {
              console.log('✅ Video metadata loaded', e.currentTarget.videoWidth, 'x', e.currentTarget.videoHeight);
            }}
            onPlay={() => console.log('✅ Video is playing')}
            onError={(e) => console.error('❌ Video error:', e)}
          />
        ) : (
          <video
            ref={videoRef}
            src={recordedVideoUrl || undefined}
            playsInline
            className="w-full h-full object-cover bg-black"
            style={{ transform: 'scaleX(-1)' }}
            onLoadedMetadata={() => console.log('✅ Playback video loaded')}
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

        {/* Debug overlay */}
        {mediaStream && !isPreviewMode && (
          <div className="absolute top-2 right-2 bg-green-500 text-black text-xs px-2 py-1 rounded font-bold z-20">
            CAMERA ACTIVE
          </div>
        )}

        {/* Preview mode indicator */}
        {isPreviewMode && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded font-bold z-20">
            PREVIEW MODE
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-anarchist-red px-3 py-2 rounded-full animate-pulse z-20">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span className="text-anarchist-black text-sm font-brutal font-bold uppercase">RECORDING</span>
          </div>
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
                      disabled={!hasPermission || !mediaStream}
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
    </div>
  );
};

export default DesktopRecorder;
