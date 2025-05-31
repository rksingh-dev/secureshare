import { retrieveFromIPFS, unpinFromIPFS, uploadToIPFS } from './pinataService';
import { recordAuditLog } from '../utils/securityUtils';

// Mock database for demo purposes
const accessCodeDatabase: Record<string, {
  cid: string;
  encryptionKey: string;
  fileName: string;
  mimeType: string;
  expiryTime: string;
  usageCount: number;
  used: boolean;
}> = {};

/**
 * Stores document information with an access code
 */
export const storeDocumentInfo = async (
  accessCode: string,
  documentInfo: {
    cid: string;
    encryptionKey: string;
    fileName: string;
    mimeType: string;
    expiryTime: string;
    usageCount: number;
  }
): Promise<void> => {
  accessCodeDatabase[accessCode] = {
    ...documentInfo,
    used: false,
  };
  
  await recordAuditLog('upload', {
    accessCode,
    cid: documentInfo.cid,
    expiryTime: documentInfo.expiryTime,
  });
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
  if (!accessCodeDatabase[accessCode]) {
    throw new Error('Invalid access code');
  }
  
  const documentInfo = accessCodeDatabase[accessCode];
  
  if (new Date(documentInfo.expiryTime) < new Date()) {
    throw new Error('This document has expired');
  }
  
  if (documentInfo.used) {
    throw new Error('This document has already been accessed');
  }
  
  const encryptedContent = await retrieveFromIPFS(documentInfo.cid);
  
  documentInfo.used = true;
  
  await recordAuditLog('access', {
    accessCode,
    cid: documentInfo.cid,
    timestamp: new Date().toISOString(),
  });
  
  return {
    documentUrl: `https://gateway.pinata.cloud/ipfs/${documentInfo.cid}`,
    fileName: documentInfo.fileName,
    mimeType: documentInfo.mimeType,
    encryptedContent,
    encryptionKey: documentInfo.encryptionKey,
  };
};

/**
 * Marks a document as printed and schedules deletion
 */
export const markDocumentPrinted = async (accessCode: string): Promise<void> => {
  if (!accessCodeDatabase[accessCode]) {
    throw new Error('Invalid access code');
  }
  
  const documentInfo = accessCodeDatabase[accessCode];
  
  await recordAuditLog('print', {
    accessCode,
    cid: documentInfo.cid,
    timestamp: new Date().toISOString(),
  });
  
  // Delete from IPFS
  await unpinFromIPFS(documentInfo.cid);
  
  // Remove from database
  delete accessCodeDatabase[accessCode];
  
  console.log('Document marked as printed and deleted:', accessCode);
};