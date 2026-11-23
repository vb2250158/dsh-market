import { type Registry, type RegistryPlugin } from './registry.ts';
/** How many candidates go to the model. Enough to cover a vague request, few enough to read. */
export declare const CANDIDATE_LIMIT = 30;
/** What was asked, minus the filler: the words worth matching. */
export declare function extractTerms(input: string): string[];
export interface Candidate {
    plugin: RegistryPlugin;
    score: number;
}
/**
 * The entries worth showing the model. Every entry matching any term, best
 * first; when fewer than the limit match (a vague or unmatched request), the
 * most downloaded of the rest fill the list, because a model can still pick
 * something sensible from popular plugins, and an empty list helps no one.
 */
export declare function recall(registry: Registry, terms: string[], limit?: number, exclude?: ReadonlySet<string>): {
    candidates: Candidate[];
    matched: number;
};
/** One recommended plugin, with everything a card needs to draw it. */
export interface FindPick {
    name: string;
    owner: string;
    url: string;
    npm: string | null;
    install: string;
    categories: string[];
    description: string;
    downloads: number | null;
    stars: number | null;
    /** The model's one-sentence reason this fits the request. */
    why: string;
}
export interface FindResult {
    request: string;
    /** One short sentence from the model framing the picks (may be empty). */
    intro: string;
    picks: FindPick[];
    /** Which model answered, for the card's footnote. */
    model: string;
    at: string;
    /** Older saved results lack an exact candidate selection. */
    selectionVersion?: 2;
    /** Whether the user's installed and favorited plugins informed the picks (they allowed it). */
    personalized?: boolean;
}
export type FindErrorCode = 'empty' | 'catalog' | 'no-model' | 'no-seeds' | 'model-failed';
export declare class FindPluginError extends Error {
    readonly code: FindErrorCode;
    constructor(code: FindErrorCode, message: string);
}
/** The slice of the host's `llm` service this uses. */
export interface LlmLike {
    stream(options: {
        provider: string;
        model: string;
        messages: unknown[];
        system?: string;
        maxTokens?: number;
        signal?: AbortSignal;
    }): AsyncIterable<{
        type: string;
        text?: string;
        error?: unknown;
        reason?: unknown;
    }>;
}
export interface ModelSelectionLike {
    provider: string;
    model: string;
    reasoningEffort?: string;
}
/** The instruction and the candidates, as the one message the model reads. */
export declare function buildPickPrompt(request: string, registry: Registry, found: {
    candidates: Candidate[];
    matched: number;
}, have?: UserSeeds): {
    system: string;
    user: string;
};
/** Pull the JSON object out of a model reply (it may wrap it in a code fence). */
export declare function parsePickReply(text: string, allowed: ReadonlySet<string>, max?: number): {
    intro: string;
    picks: Array<{
        id: string;
        why: string;
    }>;
};
/** Recall, then let the model pick. Throws FindPluginError with a user-facing message. */
export declare function findPlugins(options: {
    request: string;
    registry: Registry;
    llm: LlmLike | undefined;
    selection: ModelSelectionLike | undefined;
    /** The user's own plugins, only when they allowed reading them. */
    have?: UserSeeds;
    signal?: AbortSignal;
}): Promise<FindResult>;
/** How many candidates a recommendation offers the model. */
export declare const RECOMMEND_CANDIDATES = 40;
/** How many plugins a recommendation shows. */
export declare const RECOMMEND_MAX = 10;
/**
 * The catalog entries the user already has: installed (by package name) or
 * favorited (by repository URL, as favorites are stored).
 */
export interface UserSeeds {
    installed: RegistryPlugin[];
    favorited: RegistryPlugin[];
}
export declare function userSeeds(registry: Registry, have: {
    installed: string[];
    favorites: string[];
}): UserSeeds;
/**
 * What to offer the model: entries that share categories and words with what
 * the user has (their taste), plus some popular ones from categories they have
 * not touched (so a recommendation can open a new need, not only repeat one).
 * Never what they already have, what was shown last time, or a deprecated one.
 */
export declare function recommendCandidates(registry: Registry, seeds: RegistryPlugin[], exclude?: string[], limit?: number): Candidate[];
export declare function buildRecommendPrompt(registry: Registry, seeds: UserSeeds, candidates: Candidate[], preferZh: boolean): {
    system: string;
    user: string;
};
/** Recommend plugins from what the user installed and favorited. Throws FindPluginError. */
export declare function recommendPlugins(options: {
    registry: Registry;
    installed: string[];
    favorites: string[];
    exclude?: string[];
    preferZh: boolean;
    llm: LlmLike | undefined;
    selection: ModelSelectionLike | undefined;
    signal?: AbortSignal;
}): Promise<FindResult>;
/** Plain text of a result, for hosts that draw the command row as text. */
export declare function resultText(result: FindResult): string;
export declare function resultsFile(home?: string): string;
export declare function rememberResult(id: string, result: FindResult, file?: string): void;
export declare function resultFor(id: string, file?: string): FindResult | undefined;
/** Tests only. */
export declare function forgetResults(): void;
/** What the command handler needs from the host, structurally: no host package is imported. */
export interface FindPluginInvocation {
    commandId: string;
    agent: {
        id?: string;
        options?: {
            provider?: string;
            model?: string;
        };
    };
    rawInput: string;
    signal: AbortSignal;
}
export type FindPluginResult = {
    kind: 'success';
    text?: string;
} | {
    kind: 'error';
    text: string;
};
export interface ModelAccess {
    llm(): LlmLike | undefined;
    defaultSelection(): ModelSelectionLike | undefined;
}
/** Set once by the plugin entry; routes read it at request time. */
export declare function setModelAccess(next: ModelAccess): void;
export declare function modelAccess(): ModelAccess;
/**
 * Whether AI search and `/find-plugin` may read the user's installed and
 * favorited plugins. Off until the user allows it from a result; one switch
 * for the whole DSH home, kept beside the saved results.
 */
export declare function consentFile(home?: string): string;
export declare function usesMyPlugins(file?: string): boolean;
export declare function setUsesMyPlugins(on: boolean, file?: string): void;
export interface UserPluginLists {
    installed: string[];
    favorites: string[];
}
/** Set by the routes, which know the active profile. */
export declare function setUserPluginsReader(next: () => UserPluginLists): void;
/** The market page's AI search: the same recall and pick, with the default model. */
export declare function aiSearch(request: string, loadRegistry: () => Promise<Registry>, signal?: AbortSignal): Promise<FindResult>;
/** The market page's "recommend for me": what the user has, judged by their default model. */
export declare function aiRecommend(have: {
    installed: string[];
    favorites: string[];
    exclude?: string[];
    preferZh: boolean;
}, loadRegistry: () => Promise<Registry>, signal?: AbortSignal): Promise<FindResult>;
/** Run one `/find-plugin`. The structured result is kept under the command id for the card renderer. */
export declare function runFindPlugin(invocation: FindPluginInvocation, loadRegistry: () => Promise<Registry>, models: ModelAccess): Promise<FindPluginResult>;
/** The slice of the host's `commands` service this uses. */
export interface CommandsServiceLike {
    register(definition: {
        name: string;
        description: string;
        input?: {
            hint: string;
        };
        handler(invocation: FindPluginInvocation): FindPluginResult | Promise<FindPluginResult>;
    }): () => void;
}
/** Register `/find-plugin` on a host that has the command registry. */
export declare function registerFindPlugin(commands: CommandsServiceLike, loadRegistry: () => Promise<Registry>, models: ModelAccess): () => void;
