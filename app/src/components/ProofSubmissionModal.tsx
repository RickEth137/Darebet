'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, User, Calendar, Target } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import VideoRecorder from './VideoRecorder';
import DesktopRecorder from './DesktopRecorder';
import { detectDevice, isMobileDevice } from '@/utils/deviceDetection';
import { uploadToPinata, validateVideoBlob, formatFileSize } from '@/utils/pinataUpload';
import { balancedCompress } from '@/utils/videoCompression';
import { Dare } from '@/types';

interface ProofSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dare: Dare;
  onSubmissionComplete: () => void;
}

const DEFAULT_BANNER = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu';
const DEFAULT_PROFILE = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreihpfyvyryphyedr44zteziu3d3hbq47cekhre5c5zjjyn6w3ezttq';

// Helper function to parse description and rules
const parseDescriptionAndRules = (fullDescription: string) => {
  // Try different variations of the Rules separator
  let rulesIndex = fullDescription.indexOf('\n\nRules:\n');
  
  if (rulesIndex === -1) {
    rulesIndex = fullDescription.indexOf('\nRules:\n');
  }
  
  if (rulesIndex === -1) {
    rulesIndex = fullDescription.indexOf('Rules:');
  }
  
  if (rulesIndex === -1) {
    return {
      description: fullDescription,
      rules: null
    };
  }
  
  // Find where "Rules:" starts
  const rulesStartText = fullDescription.substring(rulesIndex);
  const rulesLabelEnd = rulesStartText.indexOf('\n') + 1;
  
  // Remove "Rules:" prefix from the rules text
  let rulesContent = rulesStartText.substring(rulesLabelEnd).trim();
  
  // Also remove "Rules:" if it appears at the start of the content
  if (rulesContent.startsWith('Rules:')) {
    rulesContent = rulesContent.substring(6).trim();
  }
  
  return {
    description: fullDescription.substring(0, rulesIndex).trim(),
    rules: rulesContent
  };
};

const ProofSubmissionModal: React.FC<ProofSubmissionModalProps> = ({
  isOpen,
  onClose,
  dare,
  onSubmissionComplete
}) => {
  const { publicKey } = useWallet();
  const [recordedVideo, setRecordedVideo] = useState<{
    blob: Blob;
    url: string;
  } | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadPercentage, setUploadPercentage] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<string>('');

  // Detect device type on mount
  useEffect(() => {
    const device = detectDevice();
    setIsMobile(device.isMobile || device.isTablet);
    setDeviceInfo(`${device.deviceType} - ${device.os}`);
    console.log('Device detected:', device);
  }, []);

  const handleVideoRecorded = (blob: Blob, url: string) => {
    setRecordedVideo({ blob, url });
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!recordedVideo) {
      setSubmitError('Please record a video first');
      return;
    }

    if (!description.trim()) {
      setSubmitError('Please add a description');
      return;
    }

    // Validate video blob
    const validation = validateVideoBlob(recordedVideo.blob);
    if (!validation.valid) {
      setSubmitError(validation.error || 'Invalid video file');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setUploadProgress(`Preparing video (${formatFileSize(recordedVideo.blob.size)})...`);
    setUploadPercentage(0);

    try {
      // Compress video before uploading
      setUploadProgress('Compressing video...');
      const compressedBlob = await balancedCompress(recordedVideo.blob, (progress) => {
        setUploadPercentage(Math.round(progress / 2)); // 0-50% for compression
        setUploadProgress(`Compressing video: ${progress}%`);
      });
      
      const originalSize = recordedVideo.blob.size;
      const compressedSize = compressedBlob.size;
      const savedSpace = Math.round((1 - (compressedSize / originalSize)) * 100);
      
      console.log(`Video compressed: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${savedSpace}% reduction)`);
      
      // Upload to Pinata IPFS
      setUploadProgress('Uploading to IPFS via Pinata...');
      
      const result = await uploadToPinata(
        compressedBlob,
        {
          dareId: dare.publicKey.toString(),
          description: description.trim(),
          recordedAt: new Date().toISOString(),
        },
        (progress) => {
          const uploadProgress = 50 + Math.round(progress.percentage / 2); // 50-100%
          setUploadPercentage(uploadProgress);
          setUploadProgress(
            `Uploading to IPFS: ${progress.percentage}% (${formatFileSize(progress.loaded)} / ${formatFileSize(progress.total)})`
          );
        }
      );

      console.log('Upload to Pinata successful:', result);

      // Get IPFS hash from result (handle both IpfsHash and ipfsHash)
      const ipfsHash = (result as any).IpfsHash || (result as any).ipfsHash;
      const gatewayUrl = (result as any).gatewayUrl || `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      
      if (!ipfsHash) {
        throw new Error('Failed to get IPFS hash from upload response');
      }

      // Save to database
      setUploadProgress('Saving proof to database...');
      
      const walletAddress = publicKey?.toString();
      console.log('[ProofSubmission] Wallet address:', walletAddress);
      console.log('[ProofSubmission] Dare ID:', dare.publicKey.toString());
      console.log('[ProofSubmission] IPFS Hash:', ipfsHash);
      
      if (!walletAddress) {
        console.warn('No wallet connected, skipping database save');
      } else {
        try {
          const dbPayload = {
            dareId: dare.publicKey.toString(),
            description: description.trim(),
            ipfsHash,
            mediaUrl: gatewayUrl,
            walletAddress,
          };
          console.log('[ProofSubmission] Sending to database:', dbPayload);
          
          const dbResponse = await fetch('/api/proof-submissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-wallet-address': walletAddress,
            },
            body: JSON.stringify(dbPayload),
          });

          if (!dbResponse.ok) {
            const errorText = await dbResponse.text();
            console.error('[ProofSubmission] Failed to save to database:', errorText);
            // Don't fail the whole submission if DB save fails
          } else {
            const dbResult = await dbResponse.json();
            console.log('[ProofSubmission] Saved to database successfully:', dbResult);
          }
        } catch (dbError) {
          console.error('[ProofSubmission] Error saving to database:', dbError);
          // Don't fail the whole submission if DB save fails
        }
      }

      setUploadProgress(`Upload complete! Video stored on IPFS: ${ipfsHash.slice(0, 10)}...`);
      setSubmitSuccess(true);
      
      // Close modal after delay
      setTimeout(() => {
        onSubmissionComplete();
        onClose();
        resetModal();
      }, 2500);

    } catch (error) {
      console.error('Error submitting proof:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit proof. Please try again.');
      setUploadProgress('');
      setUploadPercentage(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setRecordedVideo(null);
    setDescription('');
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(false);
    setUploadProgress('');
    setUploadPercentage(0);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className={`bg-anarchist-black rounded-lg w-full max-h-[92vh] overflow-hidden border-2 border-anarchist-red ${
        isMobile ? 'max-w-md' : 'max-w-7xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-anarchist-black">
          <div>
            <h2 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider">Submit Proof</h2>
            <p className="text-xs text-anarchist-offwhite truncate">{dare.account.title}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-anarchist-gray hover:text-anarchist-red disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-3 bg-anarchist-charcoal max-h-[calc(92vh-60px)] overflow-y-auto">
          {submitSuccess ? (
            // Success State - Compact
            <div className="text-center py-6">
              <img 
                src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreihpfyvyryphyedr44zteziu3d3hbq47cekhre5c5zjjyn6w3ezttq"
                alt="Darebet Logo"
                className="w-12 h-12 mx-auto mb-3"
              />
              <h3 className="text-base font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-1">
                Dare Entry Submitted Successfully!
              </h3>
              <p className="text-sm text-green-400 font-brutal font-bold uppercase tracking-wide">
                Look at you fearless king!!
              </p>
              {uploadProgress && (
                <p className="text-xs text-anarchist-gray mt-2 font-mono">
                  {uploadProgress}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Two-Column Layout for Desktop, Stacked for Mobile */}
              <div className={`${isMobile ? 'space-y-3' : 'grid grid-cols-[30%_70%] gap-4'}`}>
                {/* Left Column: Dare Details */}
                <div className="space-y-3 flex flex-col h-full">
                  {/* Dare Info Card */}
                  <div className="bg-anarchist-black border-2 border-anarchist-red rounded-lg overflow-hidden flex-1 flex flex-col">
                    {/* Banner with Profile Picture Overlay */}
                    <div className="relative h-32 flex-shrink-0">
                      <img 
                        src={dare.account.bannerUrl || DEFAULT_BANNER} 
                        alt="Dare banner"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_BANNER;
                        }}
                      />
                      
                      {/* Profile Picture - Bottom Left Corner */}
                      <div className="absolute -bottom-5 left-3">
                        <img 
                          src={dare.account.logoUrl || DEFAULT_PROFILE} 
                          alt="Creator"
                          className="w-12 h-12 rounded-full object-cover border-3 border-anarchist-red shadow-lg bg-anarchist-black"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_PROFILE;
                          }}
                        />
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      {(() => {
                        const { description: parsedDescription, rules: parsedRules } = parseDescriptionAndRules(dare.account.description);
                        
                        return (
                          <>
                            <div className="space-y-3">
                              {/* Creator Name */}
                              <div className="pt-2">
                                <p className="text-xs font-brutal font-bold text-anarchist-red uppercase tracking-wider">Created By</p>
                                <p className="text-[10px] text-anarchist-gray truncate font-mono">
                                  {dare.account.creator.toString().slice(0, 6)}...{dare.account.creator.toString().slice(-4)}
                                </p>
                              </div>

                              {/* Dare Title */}
                              <div className="pb-2 border-b border-anarchist-gray">
                                <p className="text-xs font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-1">Dare Challenge</p>
                                <h3 className="text-base font-brutal font-bold text-anarchist-offwhite leading-tight">
                                  {dare.account.title}
                                </h3>
                              </div>

                              {/* Dare Description */}
                              <div>
                                <p className="text-xs font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-1.5">Description</p>
                                <p className="text-sm text-anarchist-offwhite leading-relaxed whitespace-pre-line">
                                  {parsedDescription}
                                </p>
                              </div>

                              {/* Rules Section */}
                              {parsedRules && (
                                <div className="pt-3 border-t border-anarchist-gray pb-3 border-b border-anarchist-gray mb-0">
                                  <p className="text-xs font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-1.5">Rules & Requirements</p>
                                  <p className="text-sm text-anarchist-offwhite leading-relaxed whitespace-pre-line">
                                    {parsedRules}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Dare Stats - Pushed to bottom */}
                            <div className="mt-auto space-y-0">
                              {/* Betting Sides */}
                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="bg-anarchist-charcoal rounded p-2">
                                  <p className="text-[10px] font-brutal font-bold text-green-500 uppercase mb-1">Will Do</p>
                                  <p className="text-xs text-anarchist-offwhite font-mono">
                                    {(dare.account.willDoPool / 1e9).toFixed(2)} SOL
                                  </p>
                                </div>
                                <div className="bg-anarchist-charcoal rounded p-2">
                                  <p className="text-[10px] font-brutal font-bold text-anarchist-red uppercase mb-1">Won't Do</p>
                                  <p className="text-xs text-anarchist-offwhite font-mono">
                                    {(dare.account.wontDoPool / 1e9).toFixed(2)} SOL
                                  </p>
                                </div>
                              </div>

                              {/* Time & Pool Stats */}
                              <div className="grid grid-cols-2 gap-2 pt-2 pb-2 border-b border-anarchist-gray">
                                <div className="bg-anarchist-charcoal rounded p-2">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <Calendar className="w-3 h-3 text-anarchist-red" />
                                    <p className="text-[10px] font-brutal font-bold text-anarchist-red uppercase">Deadline</p>
                                  </div>
                                  <p className="text-[10px] text-anarchist-offwhite font-mono">
                                    {new Date(dare.account.deadline * 1000).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="bg-anarchist-charcoal rounded p-2">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <Target className="w-3 h-3 text-anarchist-red" />
                                    <p className="text-[10px] font-brutal font-bold text-anarchist-red uppercase">Total Pool</p>
                                  </div>
                                  <p className="text-[10px] text-anarchist-offwhite font-mono">
                                    {(dare.account.totalPool / 1e9).toFixed(2)} SOL
                                  </p>
                                </div>
                              </div>

                              {/* Social Links */}
                              <div className="flex items-center justify-center space-x-4 pt-2">
                                <a
                                  href="https://x.com/darebetdotfun"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-70 hover:opacity-100 transition-opacity"
                                >
                                  <img
                                    src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreibnnykiwhp7zif76mlmxsrf3lrzwqhuyk5i7jio7dakk57u6dfjou"
                                    alt="X (Twitter)"
                                    className="w-5 h-5 object-contain"
                                  />
                                </a>
                                <a
                                  href="#"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-70 hover:opacity-100 transition-opacity"
                                >
                                  <img
                                    src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreicll5cnrcorgp27fkgmc45uxnkgvev46763e2gbj6jnqxyizkhxbe"
                                    alt="GMGN"
                                    className="w-6 h-6 object-contain"
                                  />
                                </a>
                                <a
                                  href="#"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-70 hover:opacity-100 transition-opacity"
                                >
                                  <img
                                    src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreic6go73466no6tq7ybuozixsxclw7z3z73qgkavos4ux7hfgermuy"
                                    alt="Docs"
                                    className="w-6 h-6 object-contain"
                                  />
                                </a>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right Column: Recording Interface */}
                <div className="space-y-3">
                  {/* Security Notice */}
                  <div className="bg-anarchist-black border-2 border-anarchist-red rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-anarchist-red mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-1">Live Recording Required</p>
                        <p className="text-anarchist-offwhite">
                          {isMobile 
                            ? 'Record your proof video live using your camera.'
                            : 'Record yourself live using your webcam to capture your dare completion.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Video Recorder - Device-specific */}
                  {isMobile ? (
                    <VideoRecorder
                      onVideoRecorded={handleVideoRecorded}
                      maxDuration={60}
                      dareId={dare.publicKey.toString()}
                    />
                  ) : (
                    <DesktopRecorder
                      onVideoRecorded={handleVideoRecorded}
                      maxDuration={60}
                      dareId={dare.publicKey.toString()}
                    />
                  )}

                  {/* Description Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="description" className="block text-xs font-medium text-anarchist-offwhite">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe how you completed the dare..."
                      rows={2}
                      maxLength={280}
                      className="w-full px-3 py-2 bg-anarchist-black border border-anarchist-gray text-anarchist-offwhite text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-anarchist-red focus:border-anarchist-red resize-none placeholder-anarchist-gray"
                    />
                    <div className="flex justify-between text-[10px] text-anarchist-gray">
                      <span>Required for submission</span>
                      <span>{description.length}/280</span>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {isSubmitting && uploadProgress && (
                    <div className="bg-anarchist-black border-2 border-anarchist-red rounded-lg p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-anarchist-red"></div>
                            <span className="text-xs text-anarchist-offwhite font-brutal font-bold uppercase tracking-wider">{uploadProgress}</span>
                          </div>
                          {uploadPercentage > 0 && (
                            <span className="text-sm text-anarchist-red font-brutal font-bold">{uploadPercentage}%</span>
                          )}
                        </div>
                        {uploadPercentage > 0 && (
                          <div className="w-full bg-anarchist-charcoal rounded-full h-2 border border-anarchist-gray">
                            <div 
                              className="bg-anarchist-red h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadPercentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {submitError && (
                    <div className="bg-anarchist-black border-2 border-red-600 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-400 font-brutal font-bold">{submitError}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!recordedVideo || !description.trim() || isSubmitting}
                    className="w-full bg-anarchist-red hover:bg-red-700 text-anarchist-black py-2.5 px-4 rounded-lg font-brutal font-bold text-sm uppercase tracking-wider disabled:bg-anarchist-gray disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-anarchist-black"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Submit Proof</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProofSubmissionModal;