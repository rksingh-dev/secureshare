import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyRound, Printer, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import AccessForm from '../components/access/AccessForm';
import DocumentPreview from '../components/access/DocumentPreview';
import { retrieveDocument } from '../services/documentService';
import { decryptData } from '../utils/encryption';

interface DocumentData {
  documentUrl: string;
  fileName: string;
  mimeType: string;
  decryptedContent: ArrayBuffer;
}

const AccessPage: React.FC = () => {
  const { setIsLoading, setErrorMessage } = useAppContext();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isWatermarking, setIsWatermarking] = useState(false);

  const handleAccessSuccess = (data: DocumentData) => {
    setDocumentData(data);
    setIsLoading(false);
  };

  const handleAccessError = (error: Error) => {
    setErrorMessage(error.message || 'Failed to access document');
    setIsLoading(false);
  };

  const resetAccess = () => {
    setDocumentData(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800 mb-4">Access Secure Document</h1>
          <p className="text-gray-600">
            Enter your 6-digit access code to view and print the document
          </p>
        </div>

        {!documentData ? (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-5 w-5 text-accent-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Important Information</h2>
              </div>
              
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="inline-block h-5 w-5 rounded-full bg-primary-100 text-primary-800 text-center mr-2 flex-shrink-0">1</span>
                  <span>This document can only be accessed <strong>once</strong> and will be permanently deleted after viewing</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block h-5 w-5 rounded-full bg-primary-100 text-primary-800 text-center mr-2 flex-shrink-0">2</span>
                  <span>The document will have a security watermark with your device information</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block h-5 w-5 rounded-full bg-primary-100 text-primary-800 text-center mr-2 flex-shrink-0">3</span>
                  <span>The access code expires after 10-20 minutes from generation</span>
                </li>
              </ul>
            </div>
            
            <AccessForm 
              onAccessSuccess={handleAccessSuccess}
              onAccessError={handleAccessError}
            />
          </>
        ) : (
          <DocumentPreview 
            documentData={documentData}
            onClose={resetAccess}
            isWatermarking={isWatermarking}
          />
        )}
      </div>
    </div>
  );
};

export default AccessPage;