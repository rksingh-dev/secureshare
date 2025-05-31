import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-primary-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <LockKeyhole className="h-8 w-8" />
          <span className="text-xl font-bold">SecurePrint</span>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link 
                to="/" 
                className="px-4 py-2 rounded hover:bg-primary-700 transition duration-200"
              >
                Upload
              </Link>
            </li>
            <li>
              <Link 
                to="/access" 
                className="px-4 py-2 rounded hover:bg-primary-700 transition duration-200"
              >
                Access Document
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;