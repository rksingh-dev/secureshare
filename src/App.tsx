import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import UploadPage from './pages/UploadPage';
import AccessPage from './pages/AccessPage';
import NotFoundPage from './pages/NotFoundPage';
import { AppProvider } from './context/AppContext';

function App() {
  //load
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/access" element={<AccessPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}

export default App;
