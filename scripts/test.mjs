import { build } from "esbuild";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";

const outfile = "tests/.cache/ledger.test.mjs";
await mkdir("tests/.cache", { recursive: true });
await build({
  entryPoints: ["tests/ledger.test.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile,
  sourcemap: "inline",
});

const child = spawn(process.execPath, ["--test", outfile], {
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 1));
