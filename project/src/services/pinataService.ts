import axios from 'axios';
import FormData from 'form-data';
import { PINATA_CONFIG } from '../config/pinata';

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs';

interface PinataConfig {
  apiKey: string;
  apiSecret: string;
}

let pinataConfig: PinataConfig | null = null;

export const initializePinata = () => {
  const { apiKey, apiSecret } = PINATA_CONFIG;

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Pinata API credentials not configured. Please update the credentials in src/config/pinata.ts'
    );
  }

  pinataConfig = {
    apiKey,
    apiSecret,
  };

  console.log('Pinata initialized successfully');
};

export const getPinataHeaders = () => {
  if (!pinataConfig) {
    // Try to initialize if not already initialized
    try {
      initializePinata();
    } catch (error) {
      console.error('Pinata initialization error:', error);
      throw new Error(
        'Pinata not initialized. Please check your Pinata configuration.'
      );
    }
  }

  return {
    'pinata_api_key': pinataConfig!.apiKey,
    'pinata_secret_api_key': pinataConfig!.apiSecret
  };
};

/**
 * Uploads encrypted data to IPFS via Pinata
 * @param encryptedData The encrypted data to upload
 * @param metadata Additional metadata to store with the document
 * @returns Promise that resolves with the IPFS CID
 */
export const uploadToIPFS = async (
  encryptedData: ArrayBuffer,
  metadata: {
    name: string;
    type: string;
    recipientName?: string;
    notes?: string;
    accessCode: string;
    expiryTime: string;
    usageCount: number;
    encryptionKey: string;
  }
): Promise<string> => {
  try {
    const formData = new FormData();
    
    // Convert ArrayBuffer to Blob for browser compatibility
    const blob = new Blob([encryptedData], { type: metadata.type });
    formData.append('file', blob, metadata.name);
    
    // Add metadata with access code and encryption info
    formData.append('pinataMetadata', JSON.stringify({
      name: `${metadata.name}_encrypted`,
      keyvalues: {
        accessCode: metadata.accessCode,
        type: metadata.type,
        expiryTime: metadata.expiryTime,
        usageCount: metadata.usageCount.toString(),
        used: 'false',
        recipientName: metadata.recipientName || '',
        notes: metadata.notes || '',
        encryptionKey: metadata.encryptionKey,
      }
    }));
    
    // Add pinata options
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false,
      customPinPolicy: {
        regions: [
          {
            id: 'FRA1',
            desiredReplicationCount: 1
          },
          {
            id: 'NYC1',
            desiredReplicationCount: 1
          }
        ]
      }
    }));
    
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          ...getPinataHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        maxBodyLength: Infinity,
      }
    );
    
    if (!response.data.IpfsHash) {
      throw new Error('Failed to get IPFS hash from Pinata');
    }
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw new Error('Failed to upload document to IPFS');
  }
};

/**
 * Retrieves a file from IPFS using the Pinata gateway
 */
export const retrieveFromIPFS = async (cid: string): Promise<ArrayBuffer> => {
  try {
    console.log('Retrieving file from IPFS:', cid);
    
    // Use the public gateway URL
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    
    // For public gateway access, we don't need authentication headers
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': '*/*',
      },
    });
    
    console.log('File retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw new Error('Failed to retrieve document from IPFS');
  }
};

/**
 * Unpins (deletes) data from IPFS via Pinata
 * @param cid The IPFS CID to unpin
 * @returns Promise that resolves when the unpin is complete
 */
export const unpinFromIPFS = async (cid: string): Promise<void> => {
  try {
    await axios.delete(
      `${PINATA_API_URL}/pinning/unpin/${cid}`,
      {
        headers: getPinataHeaders(),
      }
    );
  } catch (error) {
    console.error('Error unpinning from IPFS:', error);
    throw new Error('Failed to unpin document from IPFS');
  }
};

/**
 * Tests the Pinata connection
 * @returns Promise that resolves if connection is successful
 */
export const testPinataConnection = async (): Promise<void> => {
  try {
    const response = await axios.get(`${PINATA_API_URL}/data/testAuthentication`, {
      headers: getPinataHeaders()
    });
    console.log('Pinata test response:', response.data);
  } catch (error) {
    console.error('Error testing Pinata connection:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw new Error('Failed to connect to Pinata');
  }
};