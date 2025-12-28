import React from 'react';
import { CHARACTERS } from '../constants';
import { CharacterName } from '../types';

interface CharacterSelectorProps {
  selected: CharacterName;
  onSelect: (char: CharacterName) => void;
  disabled: boolean;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({ selected, onSelect, disabled }) => {
  return (
    <div className="mb-8">
      <label className="block text-cn-red-light font-serif font-bold text-lg mb-4 text-center">
        选择您的合影伙伴 / Select Partner
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {CHARACTERS.map((char) => {
          const isSelected = selected === char.id;
          return (
            <button
              key={char.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(char.id)}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-300
                ${isSelected 
                  ? 'border-cn-gold bg-cn-gold/10 scale-105 shadow-md' 
                  : 'border-gray-200 hover:border-cn-red-light/50 bg-transparent'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-2
                 ${isSelected ? 'bg-cn-red text-cn-gold' : 'bg-gray-100 text-gray-500'}
              `}>
                {char.label[0]}
              </div>
              <span className={`font-serif font-bold text-sm ${isSelected ? 'text-cn-red' : 'text-gray-600'}`}>
                {char.label}
              </span>
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-cn-gold text-white text-xs rounded-full px-1.5 py-0.5 shadow-sm">
                  ✔
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
