import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-gray-50">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4 tracking-tight">
          {t('landingWelcome')}
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          {t('landingRolePrompt')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        <button
          onClick={() => navigate('/admin')}
          className="group flex flex-col items-center p-10 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-indigo-500 transition-all hover:scale-105"
        >
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('landingAdminRole')}</h2>
          <p className="text-gray-500 text-center">{t('landingAdminDescription')}</p>
        </button>

        <button
          onClick={() => navigate('/join')}
          className="group flex flex-col items-center p-10 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-green-500 transition-all hover:scale-105"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('landingPlayerRole')}</h2>
          <p className="text-gray-500 text-center">{t('landingPlayerDescription')}</p>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
