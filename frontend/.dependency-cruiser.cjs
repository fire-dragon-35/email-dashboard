/**
 * Boundary rules for frontend/src. Run with:
 *   npx depcruise src --config .dependency-cruiser.cjs --output-type err
 * Generate the architecture graph agents (and you) should read instead of a
 * hand-written doc:
 *   npx depcruise src --config .dependency-cruiser.cjs --output-type dot | dot -T svg > ../docs/architecture.svg
 *   npx depcruise src --config .dependency-cruiser.cjs --output-type json > ../docs/architecture.json
 *
 * Requires `typescript` installed locally (frontend/node_modules) — without
 * it depcruise silently cruises 0 modules instead of erroring.
 */
module.exports = {
  forbidden: [
    {
      name: 'credentials-internals-are-private',
      comment: 'crypto.ts and CredentialVault.ts are vault internals. Everything outside credentials/ goes through credentialVaultSingleton.',
      severity: 'error',
      from: { pathNot: '^src/credentials' },
      to: { path: '^src/credentials/(crypto|CredentialVault)\\.ts$' },
    },
    {
      name: 'lib-and-imap-no-upward-deps',
      comment: 'lib/ and imap/ are low-level and reusable. Neither should depend on UI (components/ or context/).',
      severity: 'error',
      from: { path: '^src/(lib|imap)' },
      to: { path: '^src/(components|context)' },
    },
    {
      name: 'no-circular',
      comment: 'Circular imports are almost always a sign two things should be merged or a third thing extracted.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment: 'Unimported files are dead weight — usually a leftover from a band-aid that got half-reverted.',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: ['\\.(test|spec)\\.[jt]sx?$', 'vite-env\\.d\\.ts$', '^src/main\\.tsx$'],
      },
      to: {},
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    exclude: '\\.(test|spec)\\.[jt]sx?$',
  },
};
