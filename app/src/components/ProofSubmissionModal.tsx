'use client';

import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import VideoRecorder from './VideoRecorder';

interface ProofSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dareId: string;
  dareTitle: string;
  onSubmissionComplete: () => void;
}

const ProofSubmissionModal: React.FC<ProofSubmissionModalProps> = ({
  isOpen,
  onClose,
  dareId,
  dareTitle,
  onSubmissionComplete
}) => {
  const [recordedVideo, setRecordedVideo] = useState<{
    blob: Blob;
    url: string;
  } | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

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

    setIsSubmitting(true);
    setSubmitError(null);
    setUploadProgress('Preparing video for upload...');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('video', recordedVideo.blob, `proof-${dareId}-${Date.now()}.webm`);
      formData.append('dareId', dareId);
      formData.append('description', description.trim());
      formData.append('recordedAt', new Date().toISOString());

      setUploadProgress('Uploading to IPFS via Pinata...');

      // Upload to your backend
      const response = await fetch('/api/proof-submissions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit proof');
      }

      const result = await response.json();
      console.log('Proof submitted successfully:', result);

      setUploadProgress('Upload complete! Video stored on IPFS.');
      setSubmitSuccess(true);
      
      // Close modal after delay
      setTimeout(() => {
        onSubmissionComplete();
        onClose();
        resetModal();
      }, 2000);

    } catch (error) {
      console.error('Error submitting proof:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit proof');
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
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Submit Proof</h2>
            <p className="text-sm text-gray-600 mt-1 truncate">{dareTitle}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {submitSuccess ? (
            // Success State
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Proof Submitted Successfully!
              </h3>
              <p className="text-gray-600 mb-2">
                Your video proof has been recorded and uploaded to IPFS.
              </p>
              {uploadProgress && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ {uploadProgress}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Live Recording Required</p>
                    <p className="text-blue-700 mt-1">
                      You must record your proof video live to prevent cheating. 
                      No pre-recorded videos allowed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Recorder */}
              <VideoRecorder
                onVideoRecorded={handleVideoRecorded}
                maxDuration={60}
                dareId={dareId}
              />

              {/* Description Input */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe how you completed the dare..."
                  rows={3}
                  maxLength={280}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Required for submission</span>
                  <span>{description.length}/280</span>
                </div>
              </div>

              {/* Upload Progress */}
              {isSubmitting && uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-700 font-medium">{uploadProgress}</span>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!recordedVideo || !description.trim() || isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading to IPFS...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Submit to IPFS & Blockchain</span>
                  </>
                )}
              </button>

              {/* Info Text */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>• Video will be uploaded to IPFS via Pinata for decentralized storage</p>
                <p>• Submission is recorded on Solana blockchain</p>
                <p>• Winners selected by admin based on likes, timing & rules</p>
                <p>• Your proof is permanently stored and cannot be tampered with</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProofSubmissionModal;