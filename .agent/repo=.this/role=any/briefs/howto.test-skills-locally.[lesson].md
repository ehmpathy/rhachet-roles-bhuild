# howto: test skills locally

## .what

when developing skills in this repo, you need to ensure the local source is used instead of the published npm version.

## .why

- skills dispatch via `import('rhachet-roles-bhuild')` which resolves via node module resolution
- if `devDependencies` points to a published version (e.g., `"0.6.6"`), the npm version is used
- to test local changes, the self-reference must point to `"file:."`

## .how

### 1. ensure self-reference is `file:.`

in `package.json`:

```json
{
  "devDependencies": {
    "rhachet-roles-bhuild": "file:."
  }
}
```

**not** a version number like `"0.6.6"`.

### 2. reinstall dependencies

```sh
pnpm install
```

this creates a symlink from `node_modules/rhachet-roles-bhuild` to the repo root.

### 3. rebuild

```sh
npm run build
```

### 4. invoke the skill

```sh
# via rhachet (if linked)
npx rhachet run --skill give.feedback --against execution

# or directly via shell script
./src/domain.roles/behaver/skills/give.feedback.sh --against execution
```

## .verify

to confirm local source is being used, check the error stack trace paths:

```
# 👍 good - points to local src/
at giveFeedback (.../rhachet-roles-bhuild.vlad.give-feedback-tune/src/domain.operations/...)

# 👎 bad - points to node_modules
at giveFeedback (.../node_modules/.pnpm/rhachet-roles-bhuild@0.6.6.../src/domain.operations/...)
```

## .common issues

### still resolving to npm version

- check `package.json` has `"file:."` not a version number
- run `pnpm install` to update the symlink
- run `npm run build` to rebuild dist/

### module not found

- ensure `npm run build` completed successfully
- check that `dist/` contains the expected files

## .note

before publishing, revert the self-reference to the actual version number or remove it from devDependencies.
