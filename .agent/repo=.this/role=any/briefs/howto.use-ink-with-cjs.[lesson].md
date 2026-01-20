# howto: use ink with commonjs projects

## .what

ink v4+ is ESM-only. to use it in a CommonJS project, use ink v3.

## .why

- ink moved to ESM-only in v4.0.0
- typescript `moduleResolution: "node"` cannot resolve ESM-only packages
- ink v3.2.0 is CommonJS and works directly with cjs projects

## .how

### option 1: use ink v3 (recommended for cjs projects)

downgrade to ink v3.2.0 which is CommonJS:

```json
{
  "dependencies": {
    "ink": "3.2.0"
  }
}
```

then import normally:

```ts
import { render, Box, Text, useInput } from 'ink';
import React from 'react';

render(React.createElement(MyComponent, props));
```

### option 2: dynamic import (if v4+ required)

use dynamic import to load ink at runtime:

```ts
const launchRepl = async () => {
  const { render } = await import('ink');
  const React = await import('react');

  render(React.createElement(MyComponent, props));
};
```

### option 3: separate esm entry point

create a separate `.mts` file for ink code and import it dynamically, or exclude from build and run via tsx subprocess.

## .sources

- [ink github](https://github.com/vadimdemedes/ink)
- [ink v3.2.0 npm](https://www.npmjs.com/package/ink/v/3.2.0)
