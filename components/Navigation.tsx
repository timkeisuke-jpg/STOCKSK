import React from 'react';
import { HistoryIcon, SearchIcon, LibraryIcon, GraduationCapIcon } from './Icons';

interface NavigationProps {
  activeTab: 'search' | 'decks' | 'review' | 'history';
  onTabChange: (tab: 'search' | 'decks' | 'review' | 'history') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const getButtonClass = (tab: string) => 
    `flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${
      activeTab === tab 
        ? 'text-[#1967D2]' 
        : 'text-gray-500 hover:text-gray-900'
    }`;
  
  const getLabelClass = (tab: string) =>
    `text-[10px] font-bold mt-1 tracking-wide ${
        activeTab === tab ? 'text-[#1967D2]' : 'text-gray-400'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-100 pb-safe z-50">
      <div className="flex justify-around items-end max-w-md mx-auto h-20 pb-4">
        <button onClick={() => onTabChange('search')} className={getButtonClass('search')}>
          <SearchIcon className="w-6 h-6" strokeWidth={activeTab === 'search' ? 2.5 : 2} />
          <span className={getLabelClass('search')}>Search</span>
        </button>
        <button onClick={() => onTabChange('decks')} className={getButtonClass('decks')}>
          <LibraryIcon className="w-6 h-6" strokeWidth={activeTab === 'decks' ? 2.5 : 2} />
          <span className={getLabelClass('decks')}>Library</span>
        </button>
        <button onClick={() => onTabChange('review')} className={getButtonClass('review')}>
          <GraduationCapIcon className="w-6 h-6" strokeWidth={activeTab === 'review' ? 2.5 : 2} />
          <span className={getLabelClass('review')}>Review</span>
        </button>
        <button onClick={() => onTabChange('history')} className={getButtonClass('history')}>
          <HistoryIcon className="w-6 h-6" strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          <span className={getLabelClass('history')}>History</span>
        </button>
      </div>
    </nav>
  );
};