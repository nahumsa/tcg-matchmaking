import { useLanguage } from '../i18n';

interface ReportMatchModalProps {
  isOpen: boolean;
  playerLabel: string;
  opponentLabel: string;
  presets: [number, number][];
  selectedPreset: [number, number] | null;
  isSubmitting: boolean;
  onSelectPreset: (preset: [number, number]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ReportMatchModal({
  isOpen,
  playerLabel,
  opponentLabel,
  presets,
  selectedPreset,
  isSubmitting,
  onSelectPreset,
  onClose,
  onSubmit,
}: ReportMatchModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">{t('tournamentReportScoreTitle')}</h3>
        <p className="text-gray-500 text-sm mb-6 font-medium">
          {t('tournamentReportScoreDescription', { name: opponentLabel })}
        </p>

        <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-lg md:text-xl font-bold uppercase tracking-wider text-gray-400">
            <span>{playerLabel}</span>
            <span>{opponentLabel}</span>
          </div>
        </div>

        <div className="grid gap-3 mb-8">
          {presets.map(([s1, s2]) => (
            (() => {
              const isSelected = selectedPreset?.[0] === s1 && selectedPreset?.[1] === s2;
              return (
            <button
              key={`${s1}-${s2}`}
              onClick={() => onSelectPreset([s1, s2])}
              className={`py-5 rounded-2xl border-2 font-black transition-all ${isSelected
                ? 'bg-blue-600 border-blue-600 text-white scale-[1.04] shadow-lg shadow-blue-200'
                : 'bg-white border-gray-100 text-gray-800 hover:border-blue-200'
                }`}
            >
              <div className="text-2xl">
                {s1} - {s2}
              </div>
            </button>
              );
            })()
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition"
          >
            {t('tournamentCancel')}
          </button>
          <button
            disabled={!selectedPreset || isSubmitting}
            onClick={onSubmit}
            className="flex-1 py-4 rounded-2xl font-black text-white bg-blue-600 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            {isSubmitting ? t('tournamentLoadingShort') : t('tournamentSubmitResult')}
          </button>
        </div>
      </div>
    </div>
  );
}
