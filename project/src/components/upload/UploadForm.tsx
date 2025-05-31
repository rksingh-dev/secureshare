import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, X, FileText, Info } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { encryptFile } from '../../utils/encryption';
import { uploadToIPFS, initializePinata } from '../../services/pinataService';
import { generateAccessCode } from '../../utils/securityUtils';

interface UploadFormProps {
  onUploadComplete: (result: any) => void;
  onUploadError: (error: Error) => void;
}

interface FormData {
  recipientName: string;
  notes: string;
}

const UploadForm: React.FC<UploadFormProps> = ({ 
  onUploadComplete, 
  onUploadError 
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const { setIsLoading, setErrorMessage } = useAppContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPinataInitialized, setIsPinataInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Pinata when component mounts
    const initPinata = async () => {
      try {
        initializePinata();
        setIsPinataInitialized(true);
      } catch (error) {
        console.error('Pinata initialization error:', error);
        setErrorMessage(
          'Failed to initialize Pinata. Please ensure you have created a .env file with your Pinata API credentials.'
        );
        setIsPinataInitialized(false);
      }
    };

    initPinata();
  }, [setErrorMessage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Invalid file type. Please upload a PDF, DOCX, JPEG, or PNG file.');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size exceeds 10MB limit.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    if (!isPinataInitialized) {
      setErrorMessage('Pinata is not initialized. Please check your environment variables and try again.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Generate a secure access code
      const accessCode = generateAccessCode();
      
      // Set expiry time (15 minutes from now)
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 15);
      
      // Encrypt file with AES-256
      const { encryptedData, encryptionKey } = await encryptFile(selectedFile);
      
      // Upload to IPFS
      const cid = await uploadToIPFS(encryptedData, {
        name: selectedFile.name,
        type: selectedFile.type,
        recipientName: data.recipientName,
        notes: data.notes,
        accessCode,
        expiryTime: expiryTime.toISOString(),
        usageCount: 1,
      });
      
      onUploadComplete({
        accessCode,
        expiryTime,
        cid,
        encryptionKey,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-primary-700 mb-6">Upload Document</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Upload
          </label>
          
          {!selectedFile ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx,.jpg,.jpeg,.png"
              />
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500 mb-1">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: PDF, DOCX, JPG, PNG (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={removeFile}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Name (Optional)
          </label>
          <input
            type="text"
            {...register('recipientName')}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter recipient name"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Add any additional notes"
            rows={3}
          />
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Your document will be encrypted before upload and can only be accessed once with a 6-digit code.
              </p>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 transition duration-200 flex items-center justify-center"
        >
          <Upload className="h-5 w-5 mr-2" />
          Encrypt & Upload Document
        </button>
      </form>
    </div>
  );
};

export default UploadForm;