// Run pure TypeScript modules with Node's type stripping and the app's @ alias.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = new URL("../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const candidate = specifier.startsWith("@/") ? new URL(specifier.slice(2), source)
      : specifier.startsWith(".") && context.parentURL ? new URL(specifier, context.parentURL) : null;
    if (candidate?.protocol === "file:" && !candidate.pathname.match(/\.[a-z]+$/i)) {
      const ts = new URL(`${candidate.href}.ts`);
      if (existsSync(fileURLToPath(ts))) return nextResolve(ts.href, context);
    }
    return nextResolve(candidate?.href ?? specifier, context);
  },
});
