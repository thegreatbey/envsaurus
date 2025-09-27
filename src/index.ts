/* envsaurus library API */
// re-exports for library use
export type { EnvSchema, SchemaEntry, EnvType } from './parser';
export { parseExampleContent, parseExampleFile } from './parser';
export { generateConfigTs } from './generator';

export interface EnvsaurusOptions {
  // where to read example
  examplePath?: string;
  // where to write config
  outPath?: string;
  // emit js with JSDoc
  js?: boolean;
  // fail on undeclared keys
  strict?: boolean;
}

export function version(): string {
  return '0.0.0';
}
