/// <reference types="vite/client" />

/**
 * Ambient declarations for the Vite toolchain.
 *
 * `vite/client` supplies typings for side-effect asset imports (CSS), `import.meta.env`
 * and the `VITE_*` environment variables. Without this file TypeScript 7 rejects
 * `import "./index.css";`.
 */