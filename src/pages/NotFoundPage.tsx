import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <AlertOctagon className="h-16 w-16 text-error-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/"
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-200"
          >
            Upload Document
          </Link>
          <Link
            to="/access"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200"
          >
            Access Document
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;