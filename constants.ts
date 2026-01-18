
export const APP_NAME = "STOCKSK";

// Model to use for text generation
export const GEMINI_MODEL = 'gemini-3-flash-preview';

// Bumped to v3 due to Deck structure change
export const MOCK_CARDS_KEY = 'lingocard_storage_v3';
export const DECKS_KEY = 'lingocard_decks_v1';

// Default Deck IDs
export const DEFAULT_DECK_ID_EN = 'deck_default_english';
export const DEFAULT_DECK_ID_KR = 'deck_default_korean';

// Helper to get color based on context string returned by AI
export const getContextColor = (contextType: string) => {
  const lower = contextType.toLowerCase();
  
  // Language specific contexts (for reverse lookup)
  if (lower.includes('english')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (lower.includes('korean')) return 'bg-rose-100 text-rose-800 border-rose-200';
  
  // Business / Formal / Law
  if (lower.includes('econom') || lower.includes('business') || lower.includes('legal') || lower.includes('formal')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  // Slang / Casual
  if (lower.includes('slang') || lower.includes('casual') || lower.includes('internet')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
  }

  // Daily Life / General
  if (lower.includes('daily') || lower.includes('life') || lower.includes('general')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
  }

  // Academic / Science / Tech / Medical
  if (lower.includes('academic') || lower.includes('science') || lower.includes('tech') || lower.includes('it') || lower.includes('medic')) {
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
  }
  
  return 'bg-gray-100 text-gray-800 border-gray-200'; // Fallback
};