import React, { useState, useEffect } from 'react';
import { VocabularyCard, CardStatus, Language } from '../types';
import { RefreshIcon, CheckIcon, XIcon, ArrowRightIcon, VolumeIcon } from './Icons';

interface ReviewModeProps {
  cards: VocabularyCard[];
  onUpdateStatus: (id: string, status: CardStatus) => void;
  onExit: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ cards, onUpdateStatus, onExit }) => {
  const [queue, setQueue] = useState<VocabularyCard[]>([]);
  const [currentCard, setCurrentCard] = useState<VocabularyCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    let reviewQueue = cards.filter(c => c.status !== CardStatus.MASTERED);
    if (reviewQueue.length === 0 && cards.length > 0) {
       reviewQueue = [...cards]; 
    }
    const shuffled = [...reviewQueue].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setProgress({ current: 0, total: shuffled.length });
  }, [cards]);

  useEffect(() => {
    if (queue.length > 0 && !currentCard) {
      setCurrentCard(queue[0]);
    }
  }, [queue, currentCard]);

  const handleNext = (newStatus: CardStatus) => {
    if (!currentCard) return;
    onUpdateStatus(currentCard.id, newStatus);
    setIsFlipped(false);
    setProgress(p => ({ ...p, current: p.current + 1 }));
    const newQueue = queue.slice(1);
    setQueue(newQueue);
    setCurrentCard(null);
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentCard.term);
    switch (currentCard.detectedLanguage) {
      case Language.KR: utterance.lang = 'ko-KR'; break;
      case Language.JP: utterance.lang = 'ja-JP'; break;
      case Language.EN: default: utterance.lang = 'en-US'; break;
    }
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 text-gray-500 animate-fade-in">
        <p className="font-medium text-xl text-gray-400 mb-4">Silence...</p>
        <p className="text-sm">No cards in this deck.</p>
        <button onClick={onExit} className="mt-6 text-[#1967D2] font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  if (!currentCard && progress.total > 0 && queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 animate-slide-up">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Well Done.</h2>
        <p className="text-gray-500 mb-10 font-medium">Session complete.</p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={onExit} className="w-full py-4 bg-[#1967D2] text-white rounded-xl font-bold shadow-lg hover:bg-[#185ABC] transition-all">Back to Library</button>
          <button 
             onClick={() => {
               const allCards = [...cards].sort(() => Math.random() - 0.5);
               setQueue(allCards);
               setProgress({ current: 0, total: allCards.length });
               setCurrentCard(null);
             }}
             className="w-full py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Review Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const primaryMeaning = currentCard.meanings.find(m => m.contextType === 'General') || currentCard.meanings[0];
  const otherMeanings = currentCard.meanings.filter(m => m !== primaryMeaning);
  const progressPercent = (progress.current / progress.total) * 100;

  return (
    <div className="max-w-md mx-auto h-full flex flex-col pt-2 pb-6">
      
      {/* Progress Line */}
      <div className="flex items-center gap-4 mb-6 px-2">
        <button onClick={onExit} className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><XIcon className="w-6 h-6" /></button>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#1967D2] rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col justify-center perspective-1000 relative min-h-[450px]">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`
            relative w-full h-full min-h-[480px] bg-white rounded-[32px] shadow-sm border border-gray-100
            flex flex-col p-8 cursor-pointer transition-all duration-500 transform-style-3d
            ${isFlipped ? 'overflow-y-auto no-scrollbar' : 'items-center justify-center text-center hover:shadow-md'}
          `}
        >
          {!isFlipped ? (
            <div className="animate-fade-in flex flex-col items-center w-full">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Tap to Flip</span>
              <div className="flex flex-col items-center gap-4 mb-8 w-full">
                <h2 className="text-5xl md:text-6xl font-bold text-[#1F1F1F] break-words leading-tight">{currentCard.term}</h2>
                <button onClick={handlePlayAudio} className="p-3 text-[#1967D2] bg-[#E8F0FE] rounded-full hover:bg-[#D2E3FC] transition-colors"><VolumeIcon className="w-6 h-6" /></button>
              </div>
              {currentCard.pronunciation && <p className="font-medium text-gray-500 text-xl">{currentCard.pronunciation}</p>}
            </div>
          ) : (
            <div className="w-full text-left animate-fade-in space-y-8 pb-12">
               {/* Primary Definition */}
               <div className="border-b border-gray-100 pb-8">
                  <span className="text-xs font-bold text-[#1967D2] bg-[#E8F0FE] px-2 py-1 rounded-md uppercase tracking-wide block mb-3 w-fit">Primary Meaning</span>
                  <p className="text-3xl font-bold text-gray-900 leading-tight mb-4">{primaryMeaning.definition}</p>
                  <p className="text-lg text-gray-600 font-medium">"{primaryMeaning.example.original}"</p>
               </div>
               
               {/* Contexts */}
               {otherMeanings.length > 0 && (
                 <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Nuances</span>
                    <div className="space-y-6">
                      {otherMeanings.map((m, idx) => (
                        <div key={idx} className="pl-4 border-l-4 border-[#E8F0FE]">
                           <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-500 uppercase">{m.contextType}</span>
                           </div>
                           <p className="font-bold text-gray-800 text-lg mb-1">{m.definition}</p>
                           <p className="text-sm text-gray-500">{m.nuance}</p>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {isFlipped && (
        <div className="flex gap-4 mt-8 animate-slide-up px-2">
          <button onClick={() => handleNext(CardStatus.LEARNING)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-full font-bold hover:bg-gray-50 transition-colors">Again</button>
          <button onClick={() => handleNext(CardStatus.MASTERED)} className="flex-1 py-4 bg-[#1967D2] text-white rounded-full font-bold shadow-lg hover:bg-[#185ABC] transition-colors">Mastered</button>
        </div>
      )}
    </div>
  );
};