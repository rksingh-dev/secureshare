import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { KeyRound, ArrowRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { retrieveDocument } from '../../services/documentService';
import { decryptData } from '../../utils/encryption';

interface AccessFormProps {
  onAccessSuccess: (data: any) => void;
  onAccessError: (error: Error) => void;
}

interface FormData {
  accessCode: string[];
}

const AccessForm: React.FC<AccessFormProps> = ({ onAccessSuccess, onAccessError }) => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      accessCode: Array(6).fill('')
    }
  });
  const { setIsLoading, setErrorMessage } = useAppContext();
  const [focusedInput, setFocusedInput] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  useEffect(() => {
    // Focus the first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digits
    if (!/^\d*$/.test(value)) return;
    
    setValue(`accessCode.${index}`, value);
    
    // If a digit was entered and there's a next input, focus it
    if (value && index < 5) {
      setFocusedInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - if current input is empty, focus previous
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      setFocusedInput(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle left arrow - focus previous input
    if (e.key === 'ArrowLeft' && index > 0) {
      setFocusedInput(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle right arrow - focus next input
    if (e.key === 'ArrowRight' && index < 5) {
      setFocusedInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const onSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data);
    try {
      setIsLoading(true);
      
      // Combine the digits into a single access code
      const accessCode = data.accessCode.join('');
      console.log('Combined access code:', accessCode);
      
      if (accessCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit access code');
      }
      
      console.log('Attempting to retrieve document...');
      // Retrieve the document using the access code
      const documentData = await retrieveDocument(accessCode);
      console.log('Document retrieved successfully:', documentData);
      
      console.log('Attempting to decrypt document...');
      // Decrypt the document
      const decryptedContent = await decryptData(
        documentData.encryptedContent, 
        documentData.encryptionKey
      );
      console.log('Document decrypted successfully');
      
      onAccessSuccess({
        documentUrl: documentData.documentUrl,
        fileName: documentData.fileName,
        mimeType: documentData.mimeType,
        decryptedContent,
      });
      
    } catch (error) {
      console.error('Error in onSubmit:', error);
      onAccessError(error instanceof Error ? error : new Error('Failed to access document'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-primary-700 mb-6">Enter Access Code</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter the 6-digit code provided by the sender
          </label>
          
          <div className="flex justify-center gap-2 mb-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                className={`w-12 h-14 text-center text-xl font-bold border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  focusedInput === index ? 'border-primary-500' : 'border-gray-300'
                }`}
                {...register(`accessCode.${index}`, { required: true })}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={() => setFocusedInput(index)}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
              />
            ))}
          </div>
          
          {errors.accessCode && (
            <p className="text-sm text-error-600 text-center">
              Please enter a valid 6-digit code
            </p>
          )}
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-primary-600 text-white py-3 px-8 rounded-md hover:bg-primary-700 transition duration-200 flex items-center justify-center"
          >
            <KeyRound className="h-5 w-5 mr-2" />
            Access Document
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccessForm;