import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { generateVocabularyCard, recognizeHandwriting } from './services/geminiService';

const firebaseConfig = {
  apiKey: "AIzaSyCzZQYJxGr9shN4sDD0YlYd4hI_SB3foGo",
  authDomain: "gen-lang-client-0896315118.firebaseapp.com",
  projectId: "gen-lang-client-0896315118",
  storageBucket: "gen-lang-client-0896315118.firebasestorage.app",
  messagingSenderId: "275198874465",
  appId: "1:275198874465:web:39421356f1b57ce42e2b20",
  measurementId: "G-57JL1GEYD0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
import { CardView } from './components/CardView';
import { ReviewMode } from './components/ReviewMode';
import { HandwritingInput } from './components/HandwritingInput';
import { Navigation } from './components/Navigation';
import { SearchIcon, RefreshIcon, TrashIcon, MicIcon, PlusIcon, ArrowRightIcon, PenIcon, BookIcon, LibraryIcon, GraduationCapIcon, XIcon, BrainIcon, SparklesIcon } from './components/Icons';
import { VocabularyCard, CardStatus, SearchState, Deck, Language } from './types';
import { APP_NAME, MOCK_CARDS_KEY, DECKS_KEY, DEFAULT_DECK_ID_EN, DEFAULT_DECK_ID_KR } from './constants';

const App: React.FC = () => {
  // Tabs: Search(AI), Decks, Review, History
  const [activeTab, setActiveTab] = useState<'search' | 'decks' | 'review' | 'history'>('search');
  
  // Data State
  const [history, setHistory] = useState<VocabularyCard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  // Search Tab State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchState, setSearchState] = useState<SearchState>({ isLoading: false, error: null });
  const [currentResult, setCurrentResult] = useState<VocabularyCard | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isHandwritingOpen, setIsHandwritingOpen] = useState(false);
  const [isHandwritingLoading, setIsHandwritingLoading] = useState(false);

  // Decks Tab State
  const [newDeckName, setNewDeckName] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Review Tab State
  const [reviewDeckId, setReviewDeckId] = useState<string | null>(null);

  // History Tab State
  const [historyFilter, setHistoryFilter] = useState('');

  // Initialize Data
  useEffect(() => {
    const savedCards = localStorage.getItem(MOCK_CARDS_KEY);
    const savedDecks = localStorage.getItem(DECKS_KEY);

    let loadedDecks: Deck[] = [];
    if (savedDecks) {
      try {
        loadedDecks = JSON.parse(savedDecks);
      } catch (e) { console.error(e); }
    }
    
    // Ensure English and Korean default decks exist
    if (!loadedDecks.find(d => d.id === DEFAULT_DECK_ID_EN)) {
        loadedDecks.unshift({ id: DEFAULT_DECK_ID_EN, name: 'English', createdAt: 0 });
    }
    if (!loadedDecks.find(d => d.id === DEFAULT_DECK_ID_KR)) {
        const enIndex = loadedDecks.findIndex(d => d.id === DEFAULT_DECK_ID_EN);
        loadedDecks.splice(enIndex + 1, 0, { id: DEFAULT_DECK_ID_KR, name: 'Korean', createdAt: 0 });
    }

    setDecks(loadedDecks);

    if (savedCards) {
      try {
        setHistory(JSON.parse(savedCards));
      } catch (e) { console.error(e); }
    }
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem(MOCK_CARDS_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  }, [decks]);

  // --- SAVING LOGIC ---
  const saveCardToDeck = (card: VocabularyCard, targetDeckId: string | null) => {
    const isKoreanContext = card.meanings[0]?.contextType.toLowerCase().includes('korean') || card.detectedLanguage === Language.KR;
    const masterDeckId = isKoreanContext ? DEFAULT_DECK_ID_KR : DEFAULT_DECK_ID_EN;

    setHistory(prev => {
        const newHistory = [...prev];
        const existsIn = (dId: string) => prev.some(c => 
            c.deckId === dId && 
            c.term.toLowerCase() === card.term.toLowerCase() && 
            c.meanings[0].definition === card.meanings[0].definition
        );

        if (targetDeckId && !existsIn(targetDeckId)) {
             const userCard = { ...card, id: crypto.randomUUID(), deckId: targetDeckId };
             newHistory.unshift(userCard);
        }

        if (masterDeckId && !existsIn(masterDeckId)) {
             const masterCard = { ...card, id: crypto.randomUUID(), deckId: masterDeckId };
             newHistory.unshift(masterCard);
        }
        return newHistory;
    });
  };

  // --- AI SEARCH HANDLERS ---
  const handleAiSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearchState({ isLoading: true, error: null });
    setCurrentResult(null);

    try {
      const card = await generateVocabularyCard(searchTerm);
      setCurrentResult(card);
      if (card.detectedLanguage === Language.EN || card.detectedLanguage === Language.KR) {
          saveCardToDeck(card, null);
      }
    } catch (err: any) {
      setSearchState({ isLoading: false, error: err.message || "Error generating card" });
    } finally {
      setSearchState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleVoiceInput = () => {
    if (isListening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Browser not supported"); return; }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ja-JP'; 
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => setSearchTerm(event.results[0][0].transcript);
    recognition.start();
  };

  const handleHandwritingComplete = async (imageData: string) => {
    setIsHandwritingLoading(true);
    try {
        const text = await recognizeHandwriting(imageData);
        if (text) {
            setSearchTerm(text);
            setIsHandwritingOpen(false);
        } else {
            alert("Could not recognize text. Please try again.");
        }
    } catch (e) {
        alert("Error during recognition.");
    } finally {
        setIsHandwritingLoading(false);
    }
  };

  const createNewDeck = (name: string): string => {
      const id = crypto.randomUUID();
      const newDeck: Deck = {
          id,
          name: name.trim(),
          createdAt: Date.now()
      };
      setDecks(prev => [...prev, newDeck]);
      return id;
  };

  const handleCreateDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    createNewDeck(newDeckName);
    setNewDeckName('');
  };

  const deleteCard = (id: string) => {
    if(confirm("Delete this card?")) {
      setHistory(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateCardStatus = (id: string, status: CardStatus) => {
    setHistory(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  // Helper: Get Filtered History (Deep Search / Nuance Search)
  const getFilteredHistory = () => {
    if (!historyFilter.trim()) return history;
    const q = historyFilter.toLowerCase();
    
    return history.filter(card => {
        // 1. Check Term
        if (card.term.toLowerCase().includes(q)) return true;
        // 2. Check Pronunciation
        if (card.pronunciation && card.pronunciation.toLowerCase().includes(q)) return true;
        // 3. Deep Check Meanings (Definition, Nuance, Translation)
        return card.meanings.some(m => 
            m.definition.toLowerCase().includes(q) || 
            m.nuance.toLowerCase().includes(q) ||
            m.example.original.toLowerCase().includes(q) ||
            m.example.translation.toLowerCase().includes(q)
        );
    });
  };

  const filteredHistoryList = getFilteredHistory();


  // Helper: List Item (Clean, Geometric)
  const renderCardItem = (card: VocabularyCard) => (
    <div key={card.id} className="group bg-white rounded-2xl p-5 mb-3 shadow-sm border border-transparent hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-bold text-lg text-gray-900">{card.term}</h3>
            {card.pronunciation && <span className="text-gray-400 text-xs font-medium">{card.pronunciation}</span>}
          </div>
          <p className="text-sm text-gray-600 line-clamp-1 font-medium">{card.meanings[0].definition}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-lg ${card.status === CardStatus.MASTERED ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-gray-100 text-gray-500'}`}>
                {card.status === CardStatus.NEW ? 'NEW' : card.status}
            </span>
             <button onClick={() => deleteCard(card.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
      </div>
      <div className="mt-3 flex gap-2 items-center">
         <span className="w-2 h-2 rounded-full bg-[#1967D2]"></span>
         <span className="text-xs text-gray-500 font-medium">
             {decks.find(d => d.id === card.deckId)?.name || 'Unsorted'}
         </span>
      </div>
    </div>
  );

  const getSavedDeckIds = () => {
      if (!currentResult) return [];
      return history
          .filter(h => h.term === currentResult.term && h.meanings[0].definition === currentResult.meanings[0].definition)
          .map(h => h.deckId || '');
  };

  return (
    <div className="min-h-screen pb-24 text-[#1F1F1F] font-sans selection:bg-[#D2E3FC] bg-red-200 border-4 border-blue-500">
      
      {/* Header - Transparent/Minimal */}
      {activeTab !== 'search' && (
        <header className="glass sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F]">
            {APP_NAME}
            </h1>
            <div className="px-3 py-1 bg-[#F1F3F4] rounded-full text-xs font-semibold text-gray-600">
            {history.length}
            </div>
        </header>
      )}

      <main className="max-w-md mx-auto p-4 md:p-6">
        
        {/* --- SEARCH TAB (AI Dictionary) --- */}
        {activeTab === 'search' && (
          <div className={`transition-all duration-500 ${!currentResult ? 'pt-[15vh]' : 'pt-2'}`}>
            
            {!currentResult && (
                <div className="text-center mb-10 animate-fade-in">
                    <div className="relative w-20 h-20 bg-gradient-to-br from-white to-[#F0F4F9] rounded-[24px] shadow-float mx-auto mb-6 flex items-center justify-center border border-white">
                        <BrainIcon className="w-10 h-10 text-[#1967D2]" strokeWidth={1.5} />
                        <div className="absolute -top-2 -right-2 bg-white p-1.5 rounded-xl shadow-sm">
                            <SparklesIcon className="w-4 h-4 text-[#F9AB00]" fill="currentColor" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-semibold text-[#1F1F1F] mb-3">STOCKSK</h1>
                    <p className="text-gray-500 text-sm font-medium">Stock knowledge. Invest in yourself.</p>
                </div>
            )}

            <div className={`relative bg-white rounded-[28px] shadow-float transition-all duration-300 ${currentResult ? 'mb-6 shadow-none border border-gray-100' : 'mb-12'}`}>
              <form onSubmit={handleAiSearch} className="relative z-10">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type a word..."
                  className="w-full text-xl pl-6 pr-32 py-5 bg-transparent rounded-[28px] border-none focus:ring-0 placeholder:text-gray-400 text-gray-900 font-medium"
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setIsHandwritingOpen(true)}
                        className="p-3 text-gray-500 hover:text-[#1967D2] hover:bg-[#E8F0FE] rounded-full transition-all"
                    >
                        <PenIcon className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleVoiceInput}
                        className={`p-3 rounded-full transition-all ${
                            isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-500 hover:text-[#1967D2] hover:bg-[#E8F0FE]'
                        }`}
                    >
                        <MicIcon className="w-5 h-5" />
                    </button>
                    <button 
                        type="submit"
                        disabled={searchState.isLoading || !searchTerm.trim()}
                        className="p-3 bg-[#1967D2] text-white rounded-full hover:bg-[#185ABC] transition-colors disabled:bg-gray-200 disabled:text-gray-400 m-1"
                    >
                        {searchState.isLoading ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
                    </button>
                </div>
              </form>
            </div>

            {searchState.error && <div className="p-4 bg-[#FCE8E6] text-[#C5221F] text-sm rounded-2xl text-center mb-6 font-medium">{searchState.error}</div>}

            {currentResult && (
              <div className="animate-slide-up">
                 <CardView 
                    card={currentResult} 
                    decks={decks}
                    onSave={saveCardToDeck} 
                    onCreateDeck={createNewDeck}
                    savedDeckIds={getSavedDeckIds()} 
                 />
              </div>
            )}
          </div>
        )}

        {/* --- DECKS TAB (Management) --- */}
        {activeTab === 'decks' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* New Deck Input */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
                 <div className="w-10 h-10 flex items-center justify-center bg-[#F1F3F4] rounded-xl">
                    <PlusIcon className="w-5 h-5 text-gray-500" />
                 </div>
                 <form onSubmit={handleCreateDeckSubmit} className="flex-1 flex">
                    <input 
                    type="text" 
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Create new library..."
                    className="flex-1 bg-transparent px-2 py-2 outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                    <button type="submit" disabled={!newDeckName.trim()} className="text-[#1967D2] font-bold text-sm px-4 disabled:text-gray-300">
                    CREATE
                    </button>
                 </form>
            </div>

            {/* Deck List */}
            {!selectedDeckId ? (
              <div className="grid grid-cols-2 gap-4">
                 {decks.map(deck => {
                   const count = history.filter(c => c.deckId === deck.id).length;
                   const isDefault = deck.id === DEFAULT_DECK_ID_EN || deck.id === DEFAULT_DECK_ID_KR;
                   
                   return (
                     <button 
                       key={deck.id}
                       onClick={() => setSelectedDeckId(deck.id)}
                       className={`aspect-[4/3] p-5 rounded-[24px] transition-all text-left flex flex-col justify-between group ${
                           isDefault 
                           ? 'bg-[#E8F0FE] text-[#1967D2]' 
                           : 'bg-white hover:bg-[#F8F9FA] shadow-sm'
                       }`}
                     >
                        {/* Changed to LibraryIcon for "Library" tab consistency */}
                        <LibraryIcon className={`w-8 h-8 ${isDefault ? 'text-[#1967D2]' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={2} />
                        <div>
                            <h3 className={`font-bold text-lg leading-tight mb-1 ${isDefault ? 'text-[#1967D2]' : 'text-gray-900'}`}>{deck.name}</h3>
                            <p className={`text-xs font-semibold ${isDefault ? 'text-[#8AB4F8]' : 'text-gray-400'}`}>{count} cards</p>
                        </div>
                     </button>
                   );
                 })}
              </div>
            ) : (
              <div className="animate-fade-in">
                 <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => setSelectedDeckId(null)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowRightIcon className="w-5 h-5 rotate-180 text-gray-600" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">
                    {decks.find(d => d.id === selectedDeckId)?.name}
                    </h2>
                 </div>

                 <div className="space-y-2">
                    {history.filter(c => c.deckId === selectedDeckId).length === 0 ? (
                       <div className="py-20 text-center">
                            <BookIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-400 font-medium">No cards yet</p>
                       </div>
                    ) : (
                       history.filter(c => c.deckId === selectedDeckId).map(renderCardItem)
                    )}
                 </div>
              </div>
            )}
          </div>
        )}

        {/* --- REVIEW TAB --- */}
        {activeTab === 'review' && (
          <div className="h-full">
            {!reviewDeckId ? (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider pl-1">Review Sessions</h2>
                {decks.map(deck => {
                  const deckCards = history.filter(c => c.deckId === deck.id);
                  const masteredCount = deckCards.filter(c => c.status === CardStatus.MASTERED).length;
                  const percent = deckCards.length > 0 ? Math.round((masteredCount / deckCards.length) * 100) : 0;
                  
                  return (
                    <button
                      key={deck.id}
                      onClick={() => setReviewDeckId(deck.id)}
                      className="w-full bg-white px-5 py-5 rounded-[20px] shadow-sm hover:shadow-md transition-all text-left group flex items-center justify-between border border-transparent hover:border-gray-100"
                    >
                       <div className="flex items-center gap-4">
                            {/* Changed to GraduationCap for "Review" tab consistency */}
                            <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1967D2] flex items-center justify-center">
                                <GraduationCapIcon className="w-6 h-6" />
                            </div>
                            <div>
                               <h3 className="font-bold text-lg text-gray-900">{deck.name}</h3>
                               <p className="text-xs text-gray-500 font-semibold mt-0.5">{deckCards.length} cards · {percent}% Mastered</p>
                            </div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#1967D2] group-hover:text-white transition-colors">
                           <ArrowRightIcon className="w-4 h-4" />
                       </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <ReviewMode 
                cards={history.filter(c => c.deckId === reviewDeckId)} 
                onUpdateStatus={updateCardStatus}
                onExit={() => setReviewDeckId(null)}
              />
            )}
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
             <div className="flex items-center justify-between pl-1 mb-2">
                 <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent</h2>
             </div>
             
             {/* History Search Bar (Nuance Search) */}
             <div className="relative mb-4">
                <input 
                    type="text" 
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    placeholder="Search history (e.g., '笑い', 'business')..."
                    className="w-full bg-white border-none py-3 pl-10 pr-10 rounded-xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-[#1967D2]/20"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {historyFilter && (
                    <button onClick={() => setHistoryFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <XIcon className="w-4 h-4" />
                    </button>
                )}
             </div>

            {history.length === 0 ? (
              <div className="text-center py-20 text-gray-300 font-medium">No recent activity.</div>
            ) : filteredHistoryList.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium text-sm">No matches found for "{historyFilter}"</div>
            ) : (
              filteredHistoryList.sort((a,b) => b.createdAt - a.createdAt).map(renderCardItem)
            )}
          </div>
        )}

      </main>
      
      {/* Handwriting Overlay */}
      {isHandwritingOpen && (
        <HandwritingInput 
            onClose={() => setIsHandwritingOpen(false)}
            onComplete={handleHandwritingComplete}
            isLoading={isHandwritingLoading}
        />
      )}

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;