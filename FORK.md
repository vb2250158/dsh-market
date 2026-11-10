# Maintenance fork

Upstream: [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market), pinned at `e320461dba3a7e99845f83c7bd106a2f1889dc7f` (`1.70.2`). This fork retains the upstream market behavior and online catalog.

The supported test target is the declared Windows source-Web host DSH `0.2.2-rc.1`; the package declaration limits this maintenance build to that host. This is a test-scope declaration, not a claim that other upstream hosts fail. No older-host or cross-platform compatibility matrix is maintained here.

Git and npm packages include both Host `lib/` and browser `client/client.js`. `prepare` uses these shipped artifacts when all declared Host and Client exports exist; a source checkout missing an exported artifact runs the existing build. `prepack` uses the same artifact check before package preflight. Developers rebuild changed source explicitly with `npm run build`. The upstream catalog remains authoritative. `DSHM_REGISTRY_URL` can select a dedicated test catalog for isolated acceptance; it replaces the upstream catalog and is not set by this fork.

## Unreleased

- `1.70.2-fork.1`: declare the tested DSH host and fork source while retaining the upstream market and theme lifecycle behavior. Commit Host artifacts so fixed Git installs can use the same package outputs as npm.
- 本 fork 只声明当前 Windows 源码 Web 受测环境，保留上游目录和皮肤管理行为；不自动安装或启用其他皮肤。

The current verification target is Core `54931fbd25050ef036e44b1daec931da2bfe7b39` / `0.2.2-rc.1`. This source release does not add the market to an existing environment.

## Validation

Validated on Windows with Node `24.15.0`: `npm run build`, `npm run typecheck`, 75 focused tests (`prepare`, `themes`, `regions`, and `host-package-manager`), package preflight, and a packed-artifact inspection. The Git deliverable and npm package each contain 102 Host files plus the browser bundle; local Host imports resolve within the package. Runtime installation and browser acceptance are recorded separately by the environment owner.
