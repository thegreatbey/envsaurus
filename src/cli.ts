#!/usr/bin/env node
/* basic CLI with subcommands */
// goals
// - help first
// - zero-setup defaults
// - no heavy deps
import * as fs from 'fs';
import * as path from 'path';
import { parseExampleFile } from './parser';
import { generateConfigTs, generateConfigJs } from './generator';

// show usage
function printHelp(): void {
  console.log(`envsaurus
Usage:
  envsaurus gen [--example .env.example] [--out src/config.ts] [--js]
  envsaurus check [--example .env.example] [--strict]
  envsaurus schema [--example .env.example] [--format json|yaml]
`);
}

function main(): void {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === '-h' || cmd === '--help') {
    printHelp();
    process.exit(0);
  }
  const opts = parseOpts(args.slice(1));
  try {
    if (cmd === 'gen') return cmdGen(opts);
    if (cmd === 'schema') return cmdSchema(opts);
    if (cmd === 'check') return cmdCheck(opts);
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  } catch (err) {
    console.error(String((err as Error).message || err));
    process.exit(1);
  }
}

main();

// tiny flag parser: --k v or --flag
function parseOpts(rest: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t.startsWith('--')) {
      const key = t.slice(2);
      const next = rest[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

// choose example path
function resolveExample(opts: Record<string, string | boolean>): string {
  const p = (opts.example as string) || '.env.example';
  return path.resolve(p);
}

// choose out path (src/config.ts if src exists)
function resolveOut(opts: Record<string, string | boolean>): string {
  const custom = opts.out as string | undefined;
  if (custom) return path.resolve(custom);
  const hasSrc = fs.existsSync(path.resolve('src'));
  return path.resolve(hasSrc ? 'src/config.ts' : 'config.ts');
}

// generate config file from example
function cmdGen(opts: Record<string, string | boolean>): void {
  const example = resolveExample(opts);
  const schema = parseExampleFile(example);
  const outFile = resolveOut(opts);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  if (opts.js) {
    const jsOut = outFile.endsWith('.ts')
      ? outFile.replace(/\.ts$/, '\.js')
      : outFile;
    const js = generateConfigJs(schema);
    fs.writeFileSync(jsOut, js, 'utf8');
    console.log(`generated ${path.relative(process.cwd(), jsOut)}`);
  } else {
    const ts = generateConfigTs(schema);
    fs.writeFileSync(outFile, ts, 'utf8');
    console.log(`generated ${path.relative(process.cwd(), outFile)}`);
  }
}

// print machine-readable schema
function cmdSchema(opts: Record<string, string | boolean>): void {
  const example = resolveExample(opts);
  const schema = parseExampleFile(example);
  const format = (opts.format as string) || 'json';
  if (format === 'json') {
    console.log(JSON.stringify(schema, null, 2));
    return;
  }
  if (format === 'yaml') {
    // simple YAML without dependency
    const lines: string[] = ['entries:'];
    for (const e of schema.entries) {
      lines.push('  - key: ' + e.key);
      lines.push('    type: ' + e.type);
      if (e.enumValues && e.enumValues.length)
        lines.push('    enumValues: [' + e.enumValues.join(', ') + ']');
      if (e.defaultValue != null)
        lines.push('    defaultValue: ' + JSON.stringify(e.defaultValue));
    }
    console.log(lines.join('\n'));
    return;
  }
  throw new Error('Unsupported --format (use json|yaml)');
}

// validate current process.env against declared vars
function cmdCheck(opts: Record<string, string | boolean>): void {
  const example = resolveExample(opts);
  const schema = parseExampleFile(example);
  const strict = Boolean(opts.strict);
  const errors: string[] = [];
  const declaredKeys = new Set(schema.entries.map((e) => e.key));
  // presence + type checks
  for (const e of schema.entries) {
    const raw = process.env[e.key];
    const source = raw ?? e.defaultValue;
    switch (e.type) {
      case 'number': {
        try {
          require('./validators');
        } catch {}
        if (source == null || source === '') errors.push(`${e.key} required`);
        else if (Number.isNaN(Number(source)))
          errors.push(`${e.key} must be number`);
        break;
      }
      case 'boolean': {
        // no required error; defaults to false if empty
        break;
      }
      case 'enum': {
        const opts = e.enumValues || [];
        if (!source || !opts.includes(String(source)))
          errors.push(`${e.key} must be one of ${opts.join(',')}`);
        break;
      }
      case 'url': {
        try {
          new URL(String(source));
        } catch {
          errors.push(`${e.key} must be a valid URL`);
        }
        break;
      }
      case 'email': {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!source || !re.test(String(source)))
          errors.push(`${e.key} must be a valid email`);
        break;
      }
      case 'json': {
        try {
          JSON.parse(String(source));
        } catch {
          errors.push(`${e.key} must be valid JSON`);
        }
        break;
      }
      case 'string':
      default: {
        if ((source == null || source === '') && e.defaultValue == null)
          errors.push(`${e.key} required`);
        break;
      }
    }
  }
  if (strict) {
    for (const k of Object.keys(process.env)) {
      if (/^[A-Z][A-Z0-9_]*$/.test(k) && !declaredKeys.has(k)) {
        errors.push(`undeclared key: ${k}`);
      }
    }
  }
  if (errors.length) {
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  console.log('ok');
}
