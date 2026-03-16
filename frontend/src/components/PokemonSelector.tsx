import { useMemo, useState } from 'react';
import { useLanguage } from '../i18n';
import { type Pokemon } from '../hooks/usePokemonList';

interface PokemonSelectorProps {
  label: string;
  selected: string | null;
  excluded?: string | null;
  onSelect: (pokemonId: string | null) => void;
  pokemonList: Pokemon[];
  theme?: 'green' | 'blue';
}

export default function PokemonSelector({
  label,
  selected,
  excluded = null,
  onSelect,
  pokemonList,
  theme = 'green',
}: PokemonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  const selectedPokemon = useMemo(
    () => pokemonList.find((p) => p.id.toString() === selected),
    [selected, pokemonList]
  );

  const filteredOptions = useMemo(() => {
    const term = search.toLowerCase();
    return pokemonList
      .filter(
        (p) =>
          (p.id.toString() !== excluded || p.id.toString() === selected)
          && p.name.toLowerCase().includes(term)
      )
      .slice(0, 50);
  }, [pokemonList, search, excluded, selected]);

  const focusRingClass = theme === 'blue' ? 'focus:ring-2 focus:ring-blue-500' : 'focus:ring-2 focus:ring-green-500';
  const optionHoverClass = theme === 'blue' ? 'hover:bg-blue-50' : 'hover:bg-green-50';

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full p-2.5 border border-gray-300 rounded-lg bg-white text-left transition outline-none flex items-center justify-between ${focusRingClass}`}
        >
          {selectedPokemon ? (
            <span className="flex items-center gap-2">
              <img src={selectedPokemon.sprite} alt={selectedPokemon.name} className="w-8 h-8" />
              <span className="font-medium capitalize">{selectedPokemon.name}</span>
            </span>
          ) : (
            <span className="text-gray-400">{t('joinChoosePokemon')}</span>
          )}
          <span className="text-gray-400">▾</span>
        </button>

        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 flex flex-col overflow-hidden">
            <div className="p-2 border-b">
              <input
                type="text"
                autoFocus
                placeholder={t('joinSearchPokemon')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full p-2 text-sm border border-gray-200 rounded outline-none focus:ring-1 ${theme === 'blue' ? 'focus:ring-blue-500' : 'focus:ring-green-500'}`}
              />
            </div>
            <div className="overflow-y-auto">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                onClick={() => {
                  onSelect(null);
                  setSearch('');
                  setIsOpen(false);
                }}
              >
                {t('commonNone')}
              </button>
              {filteredOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 ${optionHoverClass}`}
                  onClick={() => {
                    onSelect(option.id.toString());
                    setSearch('');
                    setIsOpen(false);
                  }}
                >
                  <img src={option.sprite} alt={option.name} className="w-8 h-8" loading="lazy" />
                  <span className="capitalize">{option.name}</span>
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  {t('joinNoPokemonFound')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
