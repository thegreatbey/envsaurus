// parse .env.example comments into a simple schema
// why: turn human hints into machine-checked rules
// how: read lines, capture annotations, pair with assignments
import * as fs from 'fs';
import * as path from 'path';

export type EnvType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'url'
  | 'email'
  | 'json';

// single variable rule
export interface SchemaEntry {
  key: string;
  type: EnvType;
  enumValues?: string[];
  defaultValue?: string;
}

// whole example schema
export interface EnvSchema {
  entries: SchemaEntry[];
}

// match comment annotations like:
// # PORT:number=3000
const COMMENT_ANNOTATION =
  /^#\s*([A-Z][A-Z0-9_]*)\s*:\s*([a-zA-Z]+)(?:\(([^)]*)\))?(?:\s*=\s*([^#\s].*?))?\s*(?:#.*)?$/;
// match assignments like:
// PORT=3000
const VAR_ASSIGNMENT = /^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/;

// build schema from file content
export function parseExampleContent(content: string): EnvSchema {
  const lines = content.split(/\r?\n/);
  const pendingByKey: Record<string, Omit<SchemaEntry, 'key'>> = {};
  const entries: SchemaEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) {
      const m = COMMENT_ANNOTATION.exec(trimmed);
      if (m) {
        // store latest comment rule for key
        const key = m[1];
        const typeRaw = (m[2] || '').toLowerCase();
        const args = (m[3] || '').trim();
        const def = (m[4] || '').trim();
        const type = (
          [
            'string',
            'number',
            'boolean',
            'enum',
            'url',
            'email',
            'json',
          ] as const
        ).includes(typeRaw as EnvType)
          ? (typeRaw as EnvType)
          : 'string';
        const enumValues =
          type === 'enum' && args
            ? args
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined;
        pendingByKey[key] = {
          type,
          enumValues,
          defaultValue: def || undefined,
        };
      }
      continue;
    }
    const v = VAR_ASSIGNMENT.exec(trimmed);
    if (v) {
      // pair assignment with any preceding comment rule
      const key = v[1];
      const annotated = pendingByKey[key];
      const entry: SchemaEntry = {
        key,
        type: annotated?.type ?? 'string',
        enumValues: annotated?.enumValues,
        defaultValue: annotated?.defaultValue,
      };
      entries.push(entry);
      continue;
    }
  }

  return { entries };
}

// convenience: parse from path
export function parseExampleFile(examplePath: string): EnvSchema {
  const abs = path.resolve(examplePath);
  const content = fs.readFileSync(abs, 'utf8');
  return parseExampleContent(content);
}
