import React, { useState, useEffect } from 'react';
import { Printer, Download, X, AlertTriangle } from 'lucide-react';
import { addWatermark } from '../../utils/watermark';

interface DocumentPreviewProps {
  documentData: {
    documentUrl: string;
    fileName: string;
    mimeType: string;
    decryptedContent: ArrayBuffer;
  };
  onClose: () => void;
  isWatermarking: boolean;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentData,
  onClose,
  isWatermarking
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [watermarkProgress, setWatermarkProgress] = useState(0);
  const [isWatermarkComplete, setIsWatermarkComplete] = useState(false);
  
  useEffect(() => {
    // Convert ArrayBuffer to Blob and create object URL
    const processDocument = async () => {
      try {
        // Apply watermark (simulation)
        setWatermarkProgress(10);
        
        // Get user device info for watermarking
        const deviceInfo = {
          browser: navigator.userAgent,
          time: new Date().toISOString(),
          ip: '192.168.x.x' // In a real app, this would be the actual IP
        };
        
        // Simulate watermarking process
        const watermarkInterval = setInterval(() => {
          setWatermarkProgress(prev => {
            if (prev >= 90) {
              clearInterval(watermarkInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 300);
        
        // Apply watermark (in a real app, this would modify the document)
        const watermarkedContent = await addWatermark(
          documentData.decryptedContent,
          documentData.mimeType,
          deviceInfo
        );
        
        // Create object URL for preview
        const blob = new Blob([watermarkedContent], { type: documentData.mimeType });
        const url = URL.createObjectURL(blob);
        
        setObjectUrl(url);
        setWatermarkProgress(100);
        setIsWatermarkComplete(true);
        
        // In a real app, this would call an API to mark the document as accessed
        
        // Cleanup function
        return () => {
          URL.revokeObjectURL(url);
          clearInterval(watermarkInterval);
        };
      } catch (error) {
        console.error('Error processing document:', error);
      }
    };
    
    processDocument();
  }, [documentData]);
  
  const handlePrint = () => {
    if (objectUrl) {
      // Open a new window and print the document
      const printWindow = window.open(objectUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // After printing, in a real app we would call an API to mark the document as printed
        };
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-100 p-4 flex justify-between items-center border-b">
        <div>
          <h3 className="font-medium text-gray-800">{documentData.fileName}</h3>
          <p className="text-xs text-gray-500">
            Secure one-time access document
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isWatermarkComplete && (
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition duration-200"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Document
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {!isWatermarkComplete ? (
        <div className="p-8 text-center">
          <div className="mb-4">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${watermarkProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Applying security watermark... {watermarkProgress}%
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Please wait while we prepare your document with security watermarks...
          </p>
        </div>
      ) : (
        <div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Security Notice:</strong> This document can only be viewed once and contains a watermark with your device information.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 h-[500px] overflow-auto">
            {objectUrl ? (
              documentData.mimeType.includes('image') ? (
                <img 
                  src={objectUrl} 
                  alt="Document preview" 
                  className="max-w-full h-auto mx-auto"
                />
              ) : documentData.mimeType === 'application/pdf' ? (
                <iframe 
                  src={objectUrl} 
                  title="PDF Document" 
                  className="w-full h-full border-0"
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Download className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      This document type cannot be previewed
                    </p>
                    <button
                      onClick={handlePrint}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded mx-auto hover:bg-primary-700 transition duration-200"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Document
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading document preview...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;