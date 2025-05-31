import { retrieveFromIPFS, unpinFromIPFS, uploadToIPFS, getPinataHeaders } from './pinataService';
import { recordAuditLog } from '../utils/securityUtils';
import axios from 'axios';

const PINATA_API_URL = 'https://api.pinata.cloud';

// Storage key for access codes
const STORAGE_KEY = 'secure_document_access_codes';

interface DocumentInfo {
  cid: string;
  encryptionKey: string;
  fileName: string;
  mimeType: string;
  expiryTime: string;
  usageCount: number;
  used: boolean;
}

interface AccessCodeDatabase {
  [key: string]: DocumentInfo;
}

// Helper functions for localStorage
const getAccessCodeDatabase = (): AccessCodeDatabase => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('No existing access codes found in localStorage');
      return {};
    }
    const database = JSON.parse(stored);
    console.log('Retrieved access codes from localStorage:', database);
    return database;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return {};
  }
};

const saveAccessCodeDatabase = (database: AccessCodeDatabase): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    console.log('Successfully saved access codes to localStorage:', database);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw new Error('Failed to save document information');
  }
};

/**
 * Stores document information with an access code
 */
export const storeDocumentInfo = async (
  accessCode: string,
  documentInfo: Omit<DocumentInfo, 'used'>
): Promise<void> => {
  try {
    console.log('Storing document info for access code:', accessCode);
    
    // Document info is already stored in Pinata metadata during upload
    await recordAuditLog('upload', {
      accessCode,
      cid: documentInfo.cid,
      expiryTime: documentInfo.expiryTime,
    });
    
    console.log('Document info stored successfully');
  } catch (error) {
    console.error('Error storing document info:', error);
    throw new Error('Failed to store document information');
  }
};

/**
 * Retrieves a document using an access code
 */
export const retrieveDocument = async (accessCode: string): Promise<{
  documentUrl: string;
  fileName: string;
  mimeType: string;
  encryptedContent: ArrayBuffer;
  encryptionKey: string;
}> => {
  try {
    console.log('Attempting to retrieve document with access code:', accessCode);
    
    // Search for document by access code in Pinata
    const response = await axios.get(
      `${PINATA_API_URL}/data/pinList?metadata[keyvalues][accessCode]={"value":"${accessCode}","op":"eq"}`,
      {
        headers: getPinataHeaders()
      }
    );
    
    if (!response.data.count || response.data.count === 0) {
      console.error('Access code not found in Pinata');
      throw new Error('Invalid access code');
    }
    
    const pinData = response.data.rows[0];
    const metadata = pinData.metadata.keyvalues;
    
    // Check if document has been used
    if (metadata.used === 'true') {
      console.error('Document has already been accessed');
      throw new Error('This document has already been accessed');
    }
    
    // Check expiry
    const expiryTime = new Date(metadata.expiryTime);
    const now = new Date();
    if (expiryTime < now) {
      console.error('Document has expired');
      throw new Error('This document has expired');
    }
    
    console.log('Retrieving document from IPFS...');
    const encryptedContent = await retrieveFromIPFS(pinData.ipfs_pin_hash);
    console.log('Document retrieved from IPFS successfully');
    
    // Mark document as used in Pinata metadata
    await axios.put(
      `${PINATA_API_URL}/pinning/hashMetadata`,
      {
        ipfsPinHash: pinData.ipfs_pin_hash,
        name: pinData.metadata.name,
        keyvalues: {
          ...metadata,
          used: 'true'
        }
      },
      {
        headers: getPinataHeaders()
      }
    );
    
    await recordAuditLog('access', {
      accessCode,
      cid: pinData.ipfs_pin_hash,
      timestamp: new Date().toISOString(),
    });
    
    return {
      documentUrl: `https://gateway.pinata.cloud/ipfs/${pinData.ipfs_pin_hash}`,
      fileName: pinData.metadata.name.replace('_encrypted', ''),
      mimeType: metadata.type,
      encryptedContent,
      encryptionKey: metadata.encryptionKey,
    };
  } catch (error) {
    console.error('Error retrieving document:', error);
    throw error instanceof Error ? error : new Error('Failed to retrieve document');
  }
};

/**
 * Marks a document as printed and schedules deletion
 */
export const markDocumentPrinted = async (accessCode: string): Promise<void> => {
  try {
    console.log('Marking document as printed:', accessCode);
    
    // Search for document by access code in Pinata
    const response = await axios.get(
      `${PINATA_API_URL}/data/pinList?metadata[keyvalues][accessCode]={"value":"${accessCode}","op":"eq"}`,
      {
        headers: getPinataHeaders()
      }
    );
    
    if (!response.data.count || response.data.count === 0) {
      console.error('Access code not found in Pinata');
      throw new Error('Invalid access code');
    }
    
    const pinData = response.data.rows[0];
    
    await recordAuditLog('print', {
      accessCode,
      cid: pinData.ipfs_pin_hash,
      timestamp: new Date().toISOString(),
    });
    
    // Delete from IPFS
    await unpinFromIPFS(pinData.ipfs_pin_hash);
    
    console.log('Document marked as printed and deleted:', accessCode);
  } catch (error) {
    console.error('Error marking document as printed:', error);
    throw error instanceof Error ? error : new Error('Failed to mark document as printed');
  }
};