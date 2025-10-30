'use client';

import { useState } from 'react';
import PinataService from '@/lib/pinata';
import toast from 'react-hot-toast';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validation = PinataService.validateProofFile(selectedFile);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await PinataService.uploadFile(file);
      setUploadResult(result);
      toast.success('File uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Test IPFS Upload</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File to Test Upload
          </label>
          <input
            type="file"
            onChange={handleFileSelect}
            accept="video/*,image/*,audio/*,.pdf"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported: Images, Videos, Audio, PDF (max 100MB)
          </p>
        </div>

        {file && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Selected File:</h3>
            <p className="text-sm text-anarchist-white">Name: {file.name}</p>
            <p className="text-sm text-anarchist-white">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p className="text-sm text-anarchist-white">Type: {file.type}</p>
            <p className="text-sm text-anarchist-white">Media Type: {PinataService.getMediaType(file.type)}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload to IPFS'}
        </button>

        {uploadResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">Upload Successful!</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-green-700">IPFS Hash:</span>
                <p className="text-green-600 font-mono break-all">{uploadResult.ipfsHash}</p>
              </div>
              <div>
                <span className="font-medium text-green-700">Gateway URL:</span>
                <p className="text-green-600 break-all">
                  <a 
                    href={uploadResult.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-green-800"
                  >
                    {uploadResult.url}
                  </a>
                </p>
              </div>
              <div>
                <span className="font-medium text-green-700">File Size:</span>
                <p className="text-green-600">{uploadResult.size} bytes</p>
              </div>
            </div>
            
            {uploadResult.url && (
              <div className="mt-4">
                <h4 className="font-medium text-green-800 mb-2">Preview:</h4>
                {file?.type.startsWith('image/') && (
                  <img 
                    src={uploadResult.url} 
                    alt="Uploaded preview" 
                    className="max-w-full max-h-64 rounded-lg border"
                  />
                )}
                {file?.type.startsWith('video/') && (
                  <video 
                    src={uploadResult.url} 
                    controls 
                    className="max-w-full max-h-64 rounded-lg border"
                  />
                )}
                {file?.type.startsWith('audio/') && (
                  <audio 
                    src={uploadResult.url} 
                    controls 
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
