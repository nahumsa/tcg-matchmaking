import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-gray-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-8 text-center sm:mb-12">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-indigo-700 sm:mb-4 sm:text-4xl">
          {t('landingWelcome')}
        </h1>
        <p className="mx-auto max-w-md text-base text-gray-600 sm:text-lg">
          {t('landingRolePrompt')}
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">
        <button
          onClick={() => navigate('/admin')}
          className="group flex flex-col items-center rounded-2xl border-2 border-transparent bg-white p-6 shadow-lg transition-all hover:border-indigo-500 hover:scale-[1.02] sm:p-8 md:p-10"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 transition-colors group-hover:bg-indigo-600 sm:mb-6 sm:h-20 sm:w-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 group-hover:text-white sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">{t('landingAdminRole')}</h2>
          <p className="text-gray-500 text-center">{t('landingAdminDescription')}</p>
        </button>

        <button
          onClick={() => navigate('/join')}
          className="group flex flex-col items-center rounded-2xl border-2 border-transparent bg-white p-6 shadow-lg transition-all hover:border-green-500 hover:scale-[1.02] sm:p-8 md:p-10"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 transition-colors group-hover:bg-green-600 sm:mb-6 sm:h-20 sm:w-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 group-hover:text-white sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">{t('landingPlayerRole')}</h2>
          <p className="text-gray-500 text-center">{t('landingPlayerDescription')}</p>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
