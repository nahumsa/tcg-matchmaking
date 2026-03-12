import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n';

const NavigationBar: React.FC = () => {
  const lastCode = localStorage.getItem('last_tournament_code');
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="bg-indigo-600 text-white shadow-md p-4 flex flex-wrap justify-between items-center gap-3">
      <div className="flex items-center space-x-4 sm:space-x-6">
        <Link to="/" className="text-xl font-bold hover:text-indigo-100 transition">TCG Matchmaking</Link>

        <div className="flex items-center space-x-3 sm:space-x-4 border-l border-indigo-500 pl-4 sm:pl-6">
          <Link to="/admin" className="text-sm font-medium hover:text-indigo-100 transition">{t('navDashboard')}</Link>
          <Link to="/join" className="text-sm font-medium hover:text-indigo-100 transition">{t('navJoin')}</Link>
          {lastCode && (
            <Link to={`/${lastCode}`} target="_blank" className="text-sm font-medium hover:text-indigo-100 transition">{t('navStandings')}</Link>
          )}
        </div>
      </div>

      <div className="text-xs sm:text-sm font-medium flex items-center gap-2" role="group" aria-label={t('navSelectLanguage')}>
        <span>{t('navLanguage')}:</span>
        <button
          type="button"
          onClick={() => setLanguage('pt-BR')}
          aria-label={t('navPortugueseBrazil')}
          aria-pressed={language === 'pt-BR'}
          className={`px-2 py-1 rounded border transition ${language === 'pt-BR' ? 'bg-white text-indigo-700 border-white' : 'bg-indigo-500 border-indigo-400 hover:bg-indigo-400'}`}
        >
          🇧🇷
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          aria-label={t('navEnglish')}
          aria-pressed={language === 'en'}
          className={`px-2 py-1 rounded border transition ${language === 'en' ? 'bg-white text-indigo-700 border-white' : 'bg-indigo-500 border-indigo-400 hover:bg-indigo-400'}`}
        >
          🇺🇸
        </button>
      </div>
    </nav>
  );
};

export default NavigationBar;
