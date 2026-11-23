/**
 * Private npm registries, read from the same `.npmrc` files pnpm reads.
 *
 * pnpm already handles installs: it reads the profile's `.npmrc` and
 * `~/.npmrc` itself, so nothing here touches how a package is installed. What
 * pnpm cannot do is answer the market's OWN requests — update checks,
 * versions, changelog, release age, compatibility — and those used to go to
 * the download region's registry for every package. For `@acme/plugin` with
 * `@acme:registry=https://npm.acme.internal/` in an `.npmrc`, that meant
 * asking the public registry about a package it has never heard of.
 *
 * Two small rules fix that, and nothing else changes:
 *
 * - {@link registryFor}: a scoped package goes to its scope's registry; every
 *   other package keeps the registry the market was already using.
 * - {@link authorizationFor}: a request to a registry that an `.npmrc` routes
 *   a scope to carries the credential the `.npmrc` holds for it.
 *
 * Precedence is the profile's `.npmrc` over `~/.npmrc`, per key.
 *
 * The unscoped `registry=` line is read from the PROFILE's `.npmrc` only. A
 * profile `.npmrc` is deliberate configuration for that profile (a company
 * registry for everything), so the market asks the same registry pnpm
 * installs from. `~/.npmrc` is not read for it: it is the user's own file,
 * shared with every other tool, and the market's default route stays the
 * download region's. An administrator's policy `mirrors.npm` outranks both.
 *
 * Credentials are attached only to registries the profile configuration
 * routes to (a scope, or that profile default), so a publish token for
 * registry.npmjs.org in `~/.npmrc` is never sent by the market just because
 * it exists.
 *
 * A credential never leaves this module except as the header value handed to
 * {@link marketFetch}; nothing here logs one.
 */
interface Credential {
    /** Value for the Authorization header. */
    header: string;
}
export interface NpmrcConfig {
    /** `@scope` -> registry base URL, no trailing slash. */
    scopes: Map<string, string>;
    /** The unscoped `registry=`, no trailing slash; only meaningful from the profile's file. */
    defaultRegistry?: string;
    /** Nerf-darted registry (`//host/path/`) -> credential. */
    credentials: Map<string, Credential>;
    /** Variables a credential line referenced that are not set — names only. */
    missingEnv: string[];
}
/** `//host[:port]/path/` form npm keys credentials by. */
export declare function nerfDart(url: string): string | null;
/**
 * Parse one `.npmrc`. Lines are `key=value`; `;` and `#` start a comment line.
 * `${NAME}` is expanded from `env`, as npm does; a line that needs a variable
 * that is not set is dropped (and the name reported) rather than becoming an
 * empty, wrong credential.
 */
export declare function parseNpmrc(text: string, env?: NodeJS.ProcessEnv): NpmrcConfig;
/** The per-key union, `over` winning. */
export declare function mergeNpmrc(base: NpmrcConfig, over: NpmrcConfig): NpmrcConfig;
/** The registry for one package, given a config; `fallback` for everything else. */
export declare function registryIn(config: NpmrcConfig, name: string, fallback: string, defaultLocked?: boolean): string;
/**
 * The Authorization header for a URL, or null. Only registries that some scope
 * points at are eligible (see the module note), matched the way npm matches:
 * the longest nerf-darted prefix of the URL.
 */
export declare function authorizationIn(config: NpmrcConfig, url: string): string | null;
/** Tell this module which profile's `.npmrc` is the first one to read. */
export declare function setNpmrcProfileDir(dir: string | null): void;
/** Tests only. */
export declare function setNpmrcHome(dir: string | null): void;
/** The merged config in force: `~/.npmrc` first, the profile's over it. */
export declare function currentNpmrc(env?: NodeJS.ProcessEnv, now?: number): NpmrcConfig;
/** The registry the market should ask about `name`. */
export declare function registryFor(name: string, fallback: string): string;
/** Authorization header for a URL on a scope-routed registry, or null. */
export declare function authorizationFor(url: string): string | null;
export {};
