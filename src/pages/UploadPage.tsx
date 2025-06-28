import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, File, Clock, Shield, Share2 } from 'lucide-react';
import UploadForm from '../components/upload/UploadForm';
import SuccessCard from '../components/upload/SuccessCard';
import { useAppContext } from '../context/AppContext';
import { encryptFile } from '../utils/encryption';
import { uploadToIPFS } from '../services/pinataService';
import { generateAccessCode } from '../utils/securityUtils';

interface UploadResult {
  accessCode: string;
  expiryTime: Date;
  cid: string;
}

const UploadPage: React.FC = () => {
  const { setIsLoading, setErrorMessage } = useAppContext();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
    setIsLoading(false);
  };

  const handleUploadError = (error: Error) => {
    setErrorMessage(error.message || 'Failed to upload document');
    setIsLoading(false);
  };

  const resetUpload = () => {
    setUploadResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800 mb-4">Secure Document Sharing(by Rahul)</h1>
          <p className="text-gray-600">
            Upload your document for secure, one-time viewing and printing
          </p>
        </div>

        {!uploadResult ? (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-primary-700 mb-4">
                How It Works
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4">
                    <Shield className="h-6 w-6 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">End-to-End Encryption</h3>
                    <p className="text-sm text-gray-600">
                      Your document is encrypted with AES-256 before leaving your browser
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4">
                    <File className="h-6 w-6 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Secure Storage</h3>
                    <p className="text-sm text-gray-600">
                      Encrypted documents are stored on IPFS via Pinata
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4">
                    <Clock className="h-6 w-6 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Limited Access</h3>
                    <p className="text-sm text-gray-600">
                      Documents expire after 10-20 minutes and can only be viewed once
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4">
                    <Share2 className="h-6 w-6 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">6-Digit Access</h3>
                    <p className="text-sm text-gray-600">
                      Recipients need only a 6-digit code to access the document
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <UploadForm 
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </>
        ) : (
          <SuccessCard 
            accessCode={uploadResult.accessCode}
            expiryTime={uploadResult.expiryTime}
            resetUpload={resetUpload}
          />
        )}
      </div>
    </div>
  );
};

export default UploadPage;
