'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDareProgram } from '@/hooks/useDareProgram';
import PinataService from '@/lib/pinata';
import { Dare } from '@/types';
import toast from 'react-hot-toast';

interface ProofUploadModalProps {
  dare: Dare;
  onClose: () => void;
  onProofSubmitted: () => void;
}

export const ProofUploadModal: React.FC<ProofUploadModalProps> = ({ 
  dare, 
  onClose, 
  onProofSubmitted 
}) => {
  const { publicKey } = useWallet();
  const { submitProof } = useDareProgram();
  
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    const validation = PinataService.validateProofFile(selectedFile);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    setFile(selectedFile);

    // Create preview for images and videos
    if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !description || !publicKey) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Pinata
      setUploadProgress(25);
      toast.loading('Uploading proof to IPFS...');
      
      const uploadResult = await PinataService.uploadFile(file);
      setUploadProgress(75);
      
      // Submit proof to blockchain
      toast.dismiss();
      toast.loading('Submitting proof to blockchain...');
      
      const success = await submitProof({
        darePublicKey: dare.publicKey,
        proofHash: uploadResult.ipfsHash,
        proofDescription: description,
      });

      if (success) {
        setUploadProgress(100);
        toast.dismiss();
        toast.success('Proof submitted successfully!');
        
        // Save to database via API
        try {
          await fetch('/api/proof-submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dareOnChainId: dare.publicKey.toString(),
              submitter: publicKey.toString(),
              mediaUrl: uploadResult.url,
              description,
              mediaType: PinataService.getMediaType(file.type),
              ipfsHash: uploadResult.ipfsHash,
            }),
          });
        } catch (dbError) {
          console.error('Failed to save to database:', dbError);
        }
        
        onProofSubmitted();
      }
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      toast.dismiss();
      toast.error('Failed to submit proof');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Enter Dare</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-anarchist-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Dare: {dare.account.title}</h3>
          <p className="text-blue-700 text-sm">{dare.account.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Proof File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {!file ? (
                <div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="video/*,image/*,audio/*,.pdf"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-lg font-medium mb-2">Click to upload proof</p>
                      <p className="text-sm">Video, Image, Audio, or PDF (max 100MB)</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div>
                  {/* File Preview */}
                  {previewUrl && (
                    <div className="mb-4">
                      {file.type.startsWith('image/') && (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="mx-auto max-h-48 rounded-lg"
                        />
                      )}
                      {file.type.startsWith('video/') && (
                        <video 
                          src={previewUrl} 
                          controls 
                          className="mx-auto max-h-48 rounded-lg"
                        />
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm text-anarchist-white">
                    <p className="font-medium">{file.name}</p>
                    <p>{formatFileSize(file.size)}</p>
                    <p className="text-green-600">✓ File ready for upload</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proof Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
              placeholder="Describe your proof. Explain how this demonstrates completion of the dare..."
              required
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm text-anarchist-white mb-2">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-success-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Proof Guidelines:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Provide clear, unedited evidence of dare completion</li>
              <li>• Include your face or identifying information if required</li>
              <li>• Ensure video/audio quality is sufficient for verification</li>
              <li>• First valid proof submission wins the completion reward</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || !description}
              className="flex-1 bg-success-600 hover:bg-success-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {isUploading ? 'Recording...' : 'Enter Dare'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
