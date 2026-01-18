import React, { useState, useEffect } from 'react';
import { VocabularyCard, Language, Deck } from '../types';
import { DEFAULT_DECK_ID_EN, DEFAULT_DECK_ID_KR } from '../constants';
import { CheckIcon, VolumeIcon, PlusIcon, FolderIcon, ArrowRightIcon } from './Icons';

interface CardViewProps {
  card: VocabularyCard;
  decks?: Deck[];
  onSave?: (card: VocabularyCard, deckId: string) => void;
  onCreateDeck?: (name: string) => string;
  savedDeckIds?: string[];
}

export const CardView: React.FC<CardViewProps> = ({ card, decks = [], onSave, onCreateDeck, savedDeckIds = [] }) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [targetLangTab, setTargetLangTab] = useState<'English' | 'Korean'>('English');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  const isJapanese = card.detectedLanguage === Language.JP;
  const filteredMeanings = isJapanese 
    ? card.meanings.filter(m => m.contextType.toLowerCase().includes(targetLangTab.toLowerCase()))
    : card.meanings;
  const displayedMeanings = (isJapanese && filteredMeanings.length === 0 && card.meanings.length > 0) 
    ? card.meanings 
    : filteredMeanings;

  useEffect(() => {
    let targetDeckId = '';
    if (isJapanese) {
        targetDeckId = targetLangTab === 'English' ? DEFAULT_DECK_ID_EN : DEFAULT_DECK_ID_KR;
    } else {
        if (card.detectedLanguage === Language.EN) {
            targetDeckId = DEFAULT_DECK_ID_EN;
        } else if (card.detectedLanguage === Language.KR) {
            targetDeckId = DEFAULT_DECK_ID_KR;
        } else {
            targetDeckId = decks.length > 0 ? decks[0].id : '';
        }
    }
    if (decks.some(d => d.id === targetDeckId)) {
        setSelectedDeckId(targetDeckId);
    } else if (decks.length > 0 && !selectedDeckId) {
        setSelectedDeckId(decks[0].id);
    }
  }, [card.detectedLanguage, targetLangTab, decks, isJapanese]); 

  const handlePlayAudio = (e: React.MouseEvent, text: string = card.term) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    let langToSpeak = 'en-US';
    if (text === card.term) {
        if (isJapanese) langToSpeak = 'ja-JP';
        else if (card.detectedLanguage === Language.KR) langToSpeak = 'ko-KR';
    } else {
        if (/[가-힣]/.test(text)) langToSpeak = 'ko-KR';
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langToSpeak;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (!onSave || !selectedDeckId) return;
    if (!isJapanese) {
        onSave(card, selectedDeckId);
    } else {
        const specificCard: VocabularyCard = { ...card, id: crypto.randomUUID(), meanings: displayedMeanings };
        onSave(specificCard, selectedDeckId);
    }
  };

  const handleCreateDeck = () => {
      if (!onCreateDeck || !newDeckName.trim()) return;
      const newId = onCreateDeck(newDeckName);
      setSelectedDeckId(newId);
      setIsCreatingDeck(false);
      setNewDeckName('');
  };

  const isSelectedDeckSaved = savedDeckIds.includes(selectedDeckId);

  // Helper: Get distinct theme colors for contexts
  const getTheme = (contextType: string) => {
      const c = contextType.toLowerCase();
      
      // Business / Economics / Formal -> Green/Teal
      if(c.includes('business') || c.includes('formal') || c.includes('econom')) {
          return { bg: 'bg-[#E6F4EA]', border: 'border-[#137333]', text: 'text-[#137333]', pill: 'bg-[#CEEAD6]' };
      }
      // Slang / Casual -> Purple/Pink
      if(c.includes('slang') || c.includes('casual') || c.includes('internet')) {
          return { bg: 'bg-[#F3E8FD]', border: 'border-[#9334E6]', text: 'text-[#9334E6]', pill: 'bg-[#E9D2FD]' };
      }
      // Academic / Medical / Science -> Blue/Cyan
      if(c.includes('academic') || c.includes('medical') || c.includes('science')) {
          return { bg: 'bg-[#E8F0FE]', border: 'border-[#1967D2]', text: 'text-[#1967D2]', pill: 'bg-[#D2E3FC]' };
      }
      // General / Daily -> Orange/Yellow (Warm)
      if(c.includes('daily') || c.includes('general')) {
          return { bg: 'bg-[#FEF7E0]', border: 'border-[#EA8600]', text: 'text-[#EA8600]', pill: 'bg-[#FEEFC3]' };
      }
      // Fallback -> Gray
      return { bg: 'bg-[#F1F3F4]', border: 'border-[#5F6368]', text: 'text-[#5F6368]', pill: 'bg-[#E8EAED]' };
  };

  return (
    <div className="bg-white rounded-[28px] shadow-sm mb-10 overflow-hidden animate-slide-up">
      
      {/* 1. Hero Section */}
      <div className="pt-10 pb-8 px-8 relative">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase bg-gray-100 px-3 py-1 rounded-full">
                 {card.detectedLanguage}
            </span>
             <button 
                onClick={(e) => handlePlayAudio(e)} 
                className="p-3 bg-[#E8F0FE] text-[#1967D2] rounded-full hover:bg-[#D2E3FC] transition-colors"
            >
                <VolumeIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="mt-2">
            <h2 className="text-5xl md:text-6xl font-semibold text-[#1F1F1F] tracking-tight leading-none mb-3">
                {card.term}
            </h2>
            {card.pronunciation && (
                <p className="text-xl text-gray-500 font-normal">{card.pronunciation}</p>
            )}
        </div>
        
        {!isJapanese && card.crossRefTerm && (
           <div className="mt-6 flex items-center gap-2 text-gray-500">
             <span className="font-medium text-sm bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                ≈ {card.crossRefTerm}
             </span>
           </div>
        )}
      </div>

      {/* 2. Japanese Language Toggle */}
      {isJapanese && (
        <div className="px-8 pb-4">
            <div className="bg-[#F1F3F4] p-1 rounded-full flex relative">
                <button 
                    onClick={() => setTargetLangTab('English')}
                    className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all z-10 ${
                        targetLangTab === 'English' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    English
                </button>
                <button 
                    onClick={() => setTargetLangTab('Korean')}
                    className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all z-10 ${
                        targetLangTab === 'Korean' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Korean
                </button>
            </div>
        </div>
      )}

      {/* 3. Meaning Blocks (Color Coded) */}
      <div className="px-4 pb-8 space-y-4">
        {displayedMeanings.map((meaning, idx) => {
            const theme = getTheme(meaning.contextType);
            
            return (
                <div key={idx} className={`relative p-5 rounded-2xl ${theme.bg} overflow-hidden transition-all hover:scale-[1.01]`}>
                    {/* Colored Left Border Accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${theme.border}`}></div>
                    
                    <div className="pl-3">
                        {/* Context Pill */}
                        <div className="flex justify-between items-start mb-2">
                             <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${theme.pill} ${theme.text}`}>
                                {meaning.contextType}
                             </span>
                        </div>

                        {/* Definition */}
                        <div className="mb-2">
                            <p className="text-2xl font-semibold text-gray-900 leading-tight">
                                {meaning.definition}
                            </p>
                        </div>

                        {/* Nuance */}
                        <p className="text-sm text-gray-600 mb-4 font-medium leading-relaxed">
                            {meaning.nuance}
                        </p>

                        {/* Example */}
                        <div className="bg-white/60 rounded-xl p-3 border border-white/40">
                            <p className="text-base text-gray-800 mb-1">"{meaning.example.original}"</p>
                            <p className="text-xs text-gray-500 font-medium">{meaning.example.translation}</p>
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      {/* 4. Action Bar (Gemini Style) */}
      {onSave && (
        <div className="bg-white px-6 py-6 border-t border-gray-100">
            <div className="flex flex-col gap-4">
                {/* Deck Selector */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#F1F3F4] rounded-xl relative hover:bg-[#E8EAED] transition-colors">
                         {isCreatingDeck ? (
                             <div className="flex items-center px-2 py-1">
                                <input 
                                    autoFocus
                                    className="w-full bg-transparent border-none focus:ring-0 p-2 text-sm font-medium"
                                    placeholder="Deck Name"
                                    value={newDeckName}
                                    onChange={e => setNewDeckName(e.target.value)}
                                />
                                <button onClick={handleCreateDeck} className="p-2 text-green-600"><CheckIcon className="w-5 h-5"/></button>
                             </div>
                         ) : (
                             <select 
                                value={selectedDeckId}
                                onChange={(e) => setSelectedDeckId(e.target.value)}
                                className="w-full bg-transparent border-none py-4 pl-4 pr-10 text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer appearance-none"
                            >
                                {decks.map(deck => (
                                    <option key={deck.id} value={deck.id}>
                                        {deck.name} {savedDeckIds.includes(deck.id) ? '(Saved)' : ''}
                                    </option>
                                ))}
                            </select>
                         )}
                         {!isCreatingDeck && <FolderIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
                    </div>
                    
                    {!isCreatingDeck && (
                        <button 
                            onClick={() => setIsCreatingDeck(true)}
                            className="p-4 bg-[#F1F3F4] rounded-xl text-gray-600 hover:bg-[#E8EAED] transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Main Save Button - Big and Bold */}
                <button 
                    onClick={handleSave}
                    disabled={isSelectedDeckSaved}
                    className={`w-full py-4 rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isSelectedDeckSaved
                            ? 'bg-[#E6F4EA] text-[#137333] cursor-default'
                            : 'bg-[#1967D2] text-white shadow-lg hover:shadow-xl hover:bg-[#185ABC]'
                    }`}
                >
                    {isSelectedDeckSaved ? (
                        <>
                            <CheckIcon className="w-5 h-5" />
                            <span>Saved to Library</span>
                        </>
                    ) : (
                        <>
                            <span>Save Card</span>
                            <ArrowRightIcon className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};