import React from 'react';
import { Shield } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Shield className="h-5 w-5 mr-2" />
            <span className="text-sm">SecurePrint © {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-xs text-gray-400">
                Secured with AES-256 Encryption & IPFS Storage
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400 text-center">
          <p>All documents are encrypted end-to-end and automatically deleted after viewing or expiration.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;