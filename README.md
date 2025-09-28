# envsaurus

![envsaurus icon](./envsaurus_icon.jpg)

[![npm version](https://img.shields.io/npm/v/envsaurus)](https://www.npmjs.com/package/envsaurus)
[![downloads](https://img.shields.io/npm/dm/envsaurus)](https://www.npmjs.com/package/envsaurus)
[![install size](https://packagephobia.com/badge?p=envsaurus)](https://packagephobia.com/result?p=envsaurus)
[![license](https://img.shields.io/npm/l/envsaurus)](LICENSE)
[![install](https://img.shields.io/badge/install-npm%20i%20envsaurus-blue?logo=npm)](https://www.npmjs.com/package/envsaurus)
[![publish](https://img.shields.io/github/actions/workflow/status/thegreatbey/envsaurus/publish.yml?label=publish)](https://github.com/thegreatbey/envsaurus/actions/workflows/publish.yml)

Generate typed config from .env.example and validate process.env at runtime.

## Quickstart

```bash
npm i -D typescript
npm run build
npx envsaurus --help
```

## CLI

```bash
npx envsaurus gen --example .env.example --out src/config.ts
npx envsaurus check --example .env.example --strict
npx envsaurus schema --example .env.example --format json|yaml
```

## Requirements

- Node >= 18
- CommonJS output by default

## Example

`.env.example`

```env
# PORT:number=3000
PORT=3000
# NODE_ENV:enum(development,production,test)=development
NODE_ENV=development
# API_URL:url
API_URL=
# ENABLE_CACHE:boolean=false
ENABLE_CACHE=false
# FEATURES:json   # e.g. {"beta":true}
FEATURES=
```

Generate config (TypeScript):

```bash
npx envsaurus gen --example .env.example --out src/config.ts
```

Generate config (JavaScript + JSDoc):

```bash
npx envsaurus gen --example .env.example --out config.js --js
```

Validate in CI (exit 1 on errors):

```bash
npx envsaurus check --example .env.example --strict
```
