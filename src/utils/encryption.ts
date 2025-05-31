import CryptoJS from 'crypto-js';

/**
 * Encrypts a file using AES-256 encryption
 * @param file The file to encrypt
 * @returns Promise with encrypted data and encryption key
 */
export const encryptFile = (file: File): Promise<{ encryptedData: ArrayBuffer, encryptionKey: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target || !event.target.result) {
          throw new Error('Failed to read file');
        }
        
        // Generate a random encryption key
        const encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
        
        // Convert file data to WordArray
        const wordArray = CryptoJS.lib.WordArray.create(
          new Uint8Array(event.target.result as ArrayBuffer) as any
        );
        
        // Encrypt the data
        const encrypted = CryptoJS.AES.encrypt(wordArray, encryptionKey);
        
        // Convert to string and then to ArrayBuffer for storage
        const encryptedString = encrypted.toString();
        const encryptedBuffer = new TextEncoder().encode(encryptedString).buffer;
        
        resolve({
          encryptedData: encryptedBuffer,
          encryptionKey,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Decrypts data using AES-256 decryption
 * @param encryptedData The encrypted data as ArrayBuffer
 * @param encryptionKey The encryption key
 * @returns Promise with decrypted data as ArrayBuffer
 */
export const decryptData = (encryptedData: ArrayBuffer, encryptionKey: string): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Convert ArrayBuffer to string
      const encryptedString = new TextDecoder().decode(encryptedData);
      
      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(encryptedString, encryptionKey);
      
      // Convert WordArray to ArrayBuffer
      const bytes = decrypted.toString(CryptoJS.enc.Base64);
      const binary = atob(bytes);
      const length = binary.length;
      const buffer = new ArrayBuffer(length);
      const view = new Uint8Array(buffer);
      
      for (let i = 0; i < length; i++) {
        view[i] = binary.charCodeAt(i);
      }
      
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
};