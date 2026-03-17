import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PokemonSelector from './PokemonSelector';
import { LanguageProvider } from '../i18n';

describe('PokemonSelector', () => {
  const pokemonList = [
    {
      id: 6,
      name: 'charizard',
      url: 'https://pokeapi.co/api/v2/pokemon/6/',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
      displayName: 'Charizard',
    },
    {
      id: 10033,
      name: 'charizard-mega-x',
      url: 'https://pokeapi.co/api/v2/pokemon/10033/',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10033.png',
      displayName: 'Mega Charizard X',
    },
  ];

  beforeEach(() => {
    localStorage.setItem('app_language', 'en');
  });

  it('allows searching and selecting Mega forms by display name', () => {
    const handleSelect = vi.fn();

    render(
      <LanguageProvider>
        <PokemonSelector
          label="Pokemon"
          selected={null}
          onSelect={handleSelect}
          pokemonList={pokemonList}
        />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /choose a pokémon/i }));
    fireEvent.change(screen.getByPlaceholderText(/search pokémon/i), { target: { value: 'mega' } });

    const megaOption = screen.getByRole('button', { name: /mega charizard x/i });
    fireEvent.click(megaOption);

    expect(handleSelect).toHaveBeenCalledWith('10033');
  });
});
