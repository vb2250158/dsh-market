import { type Region } from './regions.ts';
/**
 * A package-like catalog name can point to the workspace root by mistake
 * (#1208). Check a commit's manifest before handing that root to the host:
 * Desktop can unpack it before refusing a package with no bundle.
 *
 * The curated catalog also lists entire collections (#18) and uses display
 * names for ordinary Git plugins. Only a declared workspace with no DSH
 * surface and a different root name gives enough evidence to refuse the add.
 */
export declare function mismatchedWorkspaceRoot(target: string, name: string, region: Region): Promise<string | null>;
/**
 * The package version a commit of a GitHub plugin holds, read from its
 * package.json — or null when it cannot be read.
 *
 * The desktop host's in-place update wants the exact version the target will
 * install, and for a Git spec that number exists only inside the repository.
 * Null is an ordinary answer, not a failure: the caller then updates the old
 * way, which needs no version. Only the `github:owner/repo#<commit>` shape is
 * read; any other address is not worth a guess.
 */
export declare function githubPackageVersionAt(target: string, region: Region): Promise<string | null>;
