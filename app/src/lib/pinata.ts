// Utility for uploading videos to Pinata IPFS
export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface PinataMetadata {
  name: string;
  keyvalues?: Record<string, string>;
}

export interface UploadResult {
  ipfsHash: string;
  url: string;
  size: number;
}

export class PinataService {
  private static readonly PINATA_JWT = process.env.PINATA_JWT || '';
  private static readonly PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';

  /**
   * Upload a video blob to Pinata IPFS (for recorded videos)
   */
  static async uploadVideoBlob(
    videoBlob: Blob, 
    dareId: string, 
    submitter: string,
    description: string
  ): Promise<UploadResult> {
    if (!this.PINATA_JWT) {
      throw new Error('PINATA_JWT environment variable not configured');
    }

    const timestamp = Date.now();
    const filename = `proof_${dareId}_${submitter}_${timestamp}.webm`;
    
    const formData = new FormData();
    
    // Convert Blob to File for better metadata
    const file = new File([videoBlob], filename, { type: 'video/webm' });
    formData.append('file', file);

    // Add metadata
    const pinataMetadata = {
      name: filename,
      keyvalues: {
        type: 'video',
        platform: 'devils-due',
        dareId,
        submitter,
        description: description.substring(0, 100),
        recordedAt: new Date().toISOString(),
        fileType: 'video/webm',
        purpose: 'dare_proof'
      }
    };
    
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    // Add options for better organization
    const pinataOptions = {
      cidVersion: 1,
      wrapWithDirectory: false
    };
    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
      }

      const result: PinataUploadResponse = await response.json();
      
      return {
        ipfsHash: result.IpfsHash,
        url: `${this.PINATA_GATEWAY}/ipfs/${result.IpfsHash}`,
        size: result.PinSize,
      };
    } catch (error) {
      console.error('Error uploading video to Pinata:', error);
      throw new Error('Failed to upload video to IPFS');
    }
  }

  /**
   * Upload any file to Pinata IPFS (legacy support)
   */
  static async uploadFile(file: File): Promise<UploadResult> {
    if (!this.PINATA_JWT) {
      throw new Error('PINATA_JWT environment variable not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const pinataMetadata = {
      name: file.name,
      keyvalues: {
        type: this.getMediaType(file.type).toLowerCase(),
        platform: 'devils-due',
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        originalSize: file.size.toString()
      }
    };
    
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
      }

      const result: PinataUploadResponse = await response.json();
      
      return {
        ipfsHash: result.IpfsHash,
        url: `${this.PINATA_GATEWAY}/ipfs/${result.IpfsHash}`,
        size: result.PinSize,
      };
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  /**
   * Upload JSON metadata to Pinata
   */
  static async uploadJSON(data: object, name: string): Promise<UploadResult> {
    if (!this.PINATA_JWT) {
      throw new Error('PINATA_JWT environment variable not configured');
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name,
            keyvalues: {
              type: 'json',
              platform: 'devils-due',
              uploadedAt: new Date().toISOString()
            }
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata JSON upload failed: ${response.status} - ${errorText}`);
      }

      const result: PinataUploadResponse = await response.json();
      
      return {
        ipfsHash: result.IpfsHash,
        url: `${this.PINATA_GATEWAY}/ipfs/${result.IpfsHash}`,
        size: result.PinSize,
      };
    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      throw new Error('Failed to upload JSON to IPFS');
    }
  }

  /**
   * Test Pinata connection
   */
  static async testConnection(): Promise<boolean> {
    if (!this.PINATA_JWT) {
      return false;
    }

    try {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.PINATA_JWT}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Pinata connection test failed:', error);
      return false;
    }
  }

  /**
   * Get IPFS URL from hash
   */
  static getIpfsUrl(hash: string): string {
    return `${this.PINATA_GATEWAY}/ipfs/${hash}`;
  }

  /**
   * Validate file type and size for proof submissions
   */
  static validateProofFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 100MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Please use video, image, audio, or PDF files.' };
    }

    return { valid: true };
  }

  /**
   * Get media type from file MIME type
   */
  static getMediaType(mimeType: string): 'VIDEO' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' {
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }
}

export default PinataService;