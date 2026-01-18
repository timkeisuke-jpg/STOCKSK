export enum Language {
  EN = 'English',
  KR = 'Korean',
  JP = 'Japanese',
  UNKNOWN = 'Unknown'
}

export enum CardStatus {
  NEW = 'New',
  LEARNING = 'Learning',
  MASTERED = 'Mastered'
}

export interface ExampleSentence {
  original: string;
  translation: string;
}

export interface ContextDefinition {
  contextType: string; // e.g., "General", "Economics", "Slang", "Medical"
  definition: string;
  nuance: string; // The "Nani?" vibe check
  example: ExampleSentence;
}

export interface Deck {
  id: string;
  name: string;
  createdAt: number;
}

export interface VocabularyCard {
  id: string;
  term: string;
  detectedLanguage: Language;
  pronunciation?: string; // For Korean or complex English
  meanings: ContextDefinition[]; // Changed from single definition/nuance to array
  crossRefTerm?: string;
  createdAt: number;
  status: CardStatus;
  deckId?: string; // ID of the deck this card belongs to
}

export interface SearchState {
  isLoading: boolean;
  error: string | null;
}