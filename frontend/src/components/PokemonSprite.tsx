interface PokemonSpriteProps {
  pokemonId: string | number | null | undefined;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PokemonSprite({ pokemonId, name, size = 'md', className = '' }: PokemonSpriteProps) {
  if (!pokemonId) return null;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

  return (
    <img
      src={spriteUrl}
      alt={name || `Pokemon ${pokemonId}`}
      className={`${sizeClasses[size]} ${className} object-contain`}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
