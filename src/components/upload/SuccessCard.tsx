import React, { useState } from 'react';
import { CheckCircle, Copy, Clock, RefreshCw } from 'lucide-react';

interface SuccessCardProps {
  accessCode: string;
  expiryTime: Date;
  resetUpload: () => void;
}

const SuccessCard: React.FC<SuccessCardProps> = ({
  accessCode,
  expiryTime,
  resetUpload
}) => {
  const [copied, setCopied] = useState(false);
  
  const copyAccessCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const formatExpiryTime = () => {
    return expiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const minutesRemaining = () => {
    const diff = expiryTime.getTime() - new Date().getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60)));
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Document Secured Successfully!
      </h2>
      
      <p className="text-gray-600 mb-6">
        Share the 6-digit access code with the recipient for one-time access
      </p>
      
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">Access Code</div>
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 rounded-md p-4 flex items-center space-x-1 text-2xl font-mono font-bold tracking-widest text-primary-800">
            {accessCode.split('').map((digit, index) => (
              <span key={index} className="bg-white rounded shadow-sm p-2">{digit}</span>
            ))}
          </div>
          
          <button 
            onClick={copyAccessCode} 
            className="ml-3 p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-md transition duration-200"
            aria-label="Copy access code"
          >
            {copied ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-center mb-8 text-sm text-gray-600">
        <Clock className="h-4 w-4 mr-1 text-accent-500" />
        <span>Expires at {formatExpiryTime()} ({minutesRemaining()} minutes remaining)</span>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> This document can only be accessed once and will be permanently deleted after viewing. The access code will expire in 15 minutes.
        </p>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={resetUpload}
          className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-200"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Upload Another Document
        </button>
      </div>
    </div>
  );
};

export default SuccessCard;