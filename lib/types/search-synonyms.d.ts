/**
 * Intent table for catalog search (#611).
 *
 * People search by what they want ("通知"), not by the word a plugin author
 * happened to pick ("推送", "notification", "alert"). Each group lists words
 * that mean the same thing to a user; searching any one of them also finds
 * plugins that only use another one. Literal hits always rank above these.
 *
 * How to extend
 * - `terms`: words that are interchangeable. Typing any of them searches all
 *   of them. Keep it to words that really occur in the catalog (check with
 *   `npm run snapshot` and grep data/registry-snapshot.json).
 * - `broad` (optional): looser neighbours. They are found when the user types
 *   any of `terms`, but typing a broad word does NOT expand back (so "语音"
 *   finds TTS plugins while "tts" does not drag in speech-to-text).
 * - Write words in any case, with or without spaces between Han and Latin;
 *   they are normalized like the catalog text. Use the plain spoken form.
 * - Avoid words that are common in unrelated text ("model", "key", "tool",
 *   "word", "cli"): a synonym for them would flood results. Single letters
 *   and one-character words are ignored on purpose.
 * - Latin words only match whole words (plus a plural "s"), so "git" never
 *   matches "digital". Han words match as substrings, as in plain search.
 */
export interface SynonymGroup {
    terms: readonly string[];
    broad?: readonly string[];
}
export declare const SEARCH_SYNONYM_GROUPS: readonly SynonymGroup[];
