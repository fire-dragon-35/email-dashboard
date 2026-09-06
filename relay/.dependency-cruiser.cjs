/**
 * Boundary rules for relay/src. Run with:
 *   npx depcruise src --config .dependency-cruiser.cjs --output-type err
 * Graph:
 *   npx depcruise src --config .dependency-cruiser.cjs --output-type dot | dot -T svg > ../docs/architecture-relay.svg
 */
module.exports = {
  forbidden: [
    {
      name: 'imap-is-the-only-imap-speaker',
      comment: "ImapSession.ts holds the real connection; server.ts constructs the real ImapFlowFactory. Both legitimately import imapflow directly — see ARCHITECTURE.md. Nothing else should.",
      severity: 'error',
      from: { pathNot: '^src/(ImapSession|server)\\.ts$' },
      to: { path: 'imapflow' },
    },
    {
      name: 'protocol-has-no-deps',
      comment: 'protocol.ts is just types (ClientMessage/ServerMessage). It should never import anything else in this project — everything else depends on it, not the reverse.',
      severity: 'error',
      from: { path: '^src/protocol\\.ts$' },
      to: { path: '^src/(?!protocol\\.ts$)' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true, pathNot: ['\\.(test|spec)\\.ts$', '^src/index\\.ts$', '^src/server\\.ts$'] },
      to: {},
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    exclude: '\\.(test|spec)\\.ts$',
  },
};
