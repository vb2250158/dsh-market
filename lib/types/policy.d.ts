/**
 * The organization policy file: admin-owned, read-only, never written here.
 *
 * Where it lives, first found wins:
 *   1. `DSH_MARKET_POLICY` (an absolute path)
 *   2. macOS / Linux `/etc/dsh-market/policy.json`;
 *      Windows `%ProgramData%\dsh-market\policy.json`
 *   3. `<DSH_HOME>/dsh-market/policy.json`
 *
 * "Employees cannot change it" comes from file permissions on 1 and 2 (a file
 * only an administrator can write). Location 3 sits in the user's own home, so
 * it is for single-user setups and enforces nothing against the user.
 *
 * Every field is optional and an absent file means "no policy": the
 * permissive {@link NO_POLICY}, which is what keeps the market exactly as it
 * was for everyone who configures nothing.
 *
 * Adding a field later (pins, telemetry, comments, externalImages) is one
 * entry in {@link readPolicyFields} and one property on {@link Policy}; the
 * location, caching and failure handling below do not change.
 *
 * ## A policy that cannot be read
 *
 * An unreadable file must not quietly turn into "no policy": an administrator
 * who wrote one expects it to hold. So a file that exists but is not valid
 * JSON applies `allow: []` — browsing keeps working, installing is refused —
 * and says so in {@link Policy.problems} so the settings list can show it.
 * A single bad field is ignored on its own and reported; only `allow` fails
 * closed, since a malformed allowlist read as "no allowlist" is the unsafe
 * direction.
 */
/** Text for the languages the market ships, with a fallback for the rest. */
export type LocalizedLabel = Record<string, string>;
/** One catalog the policy adds. Headers hold secrets: never log or send them anywhere. */
export interface PolicyCatalog {
    id: string;
    label: LocalizedLabel;
    url?: string;
    file?: string;
    /** Raw, `${ENV}` still unexpanded; expand at request time with {@link expandEnv}. */
    headers: Record<string, string>;
}
export interface PolicyMirrors {
    catalog?: string;
    npm?: string;
    githubProxy?: string;
}
export interface Policy {
    /** The file this came from, or null when there is no policy. */
    path: string | null;
    catalogs: PolicyCatalog[];
    publicCatalog: boolean;
    userCatalogs: boolean;
    /** Glob list (`*` only); null means "anything that is listed". */
    allow: string[] | null;
    mirrors: PolicyMirrors;
    /** npm package name -> the one version to install; updates are offered only up to it. */
    pins: Record<string, string>;
    /** false = the anonymous daily count is forced off and its switch locked. */
    telemetry: boolean;
    /** false = no comment threads (no giscus, no GitHub contact). */
    comments: boolean;
    /** false = no images from outside hosts (screenshots, avatars, README images, icons). */
    externalImages: boolean;
    /** Plain-language problems with the file, for the settings list. */
    problems: PolicyProblem[];
}
/** One problem, said in both languages the file's administrator might read. */
export interface PolicyProblem {
    zh: string;
    en: string;
}
export declare const NO_POLICY: Policy;
export declare const CATALOG_ID_RE: RegExp;
/** The public catalog's own id: reserved, so a private source can never pose as it. */
export declare const PUBLIC_SOURCE_ID = "public";
/** Candidate policy files in precedence order. */
export declare function policyLocations(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform, home?: string): string[];
/** A label is a string or a per-language object; anything else is no label. */
export declare function asLabel(value: unknown): LocalizedLabel | null;
/** The label to show for a language: that language, then English, then anything. */
export declare function pickLabel(label: LocalizedLabel, lang: string): string;
/** The exact version an administrator pinned this npm package to, if any. */
export declare function pinnedVersion(name: string | null | undefined, policy?: Policy): string | undefined;
/** Interpret a parsed policy document. Pure. */
export declare function readPolicyFields(doc: unknown, path: string): Policy;
/** Read the first policy file that exists. Pure apart from the file reads. */
export declare function loadPolicy(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform, home?: string): Policy;
/**
 * The policy in force, re-read when the file changes. A stat per couple of
 * seconds rather than per request: the callers sit on hot paths (every
 * outbound request asks for the mirrors).
 */
export declare function getPolicy(env?: NodeJS.ProcessEnv, now?: number): Policy;
/** Forget the cached policy (tests, and after a deliberate re-read). */
export declare function resetPolicyCache(): void;
/**
 * Expand `${NAME}` from the environment, the way npm does. Names with no value
 * are reported rather than silently becoming empty, so the caller can say
 * which variable is missing instead of sending a half-made credential.
 */
export declare function expandEnv(text: string, env?: NodeJS.ProcessEnv): {
    value: string;
    missing: string[];
};
/** Glob match with `*` only, case-insensitive (npm names are lowercase). */
export declare function globMatch(pattern: string, text: string): boolean;
/**
 * What the browser needs to know to reflect the policy: only the switches an
 * administrator turned OFF. Empty — and so absent from the response — for
 * everyone with no policy. The server enforces; the page only follows.
 */
export declare function clientPolicy(policy?: Policy): {
    externalImages?: false;
    comments?: false;
};
