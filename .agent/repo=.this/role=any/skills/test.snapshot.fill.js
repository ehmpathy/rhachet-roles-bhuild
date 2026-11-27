// .what = add one masked snapshot `then` to each `when` whose `result` comes from a scene run and holds no snapshot
// .why  = contract-snapshot-exhaustiveness: every caller-faced render is visible in review
// usage: node snapfill.js <file.test.ts> [--mask getMasked|asMasked]
const fs = require('fs');
const ts = require('typescript');

const file = process.argv[2];
const src = fs.readFileSync(file, 'utf-8');
const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
const inserts = [];

const isCall = (n, name) =>
  ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === name;

const hasSnapshot = (node) => {
  let found = false;
  const walk = (n) => {
    if (found) return;
    if (ts.isPropertyAccessExpression(n) && n.name.text === 'toMatchSnapshot') found = true;
    ts.forEachChild(n, walk);
  };
  walk(node);
  return found;
};

// the receiver of the first `.run(` call inside a node, as source text
const getRunReceiver = (node) => {
  let found = null;
  const walk = (n) => {
    if (found) return;
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      n.expression.name.text === 'run'
    )
      found = n.expression.expression.getText(sf);
    ts.forEachChild(n, walk);
  };
  walk(node);
  return found;
};

const visit = (n) => {
  if (isCall(n, 'when')) {
    const fn = n.arguments[1];
    if (fn && (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && ts.isBlock(fn.body)) {
      const body = fn.body;
      // a direct `const result = useBeforeAll(...)` statement in this when
      const decl = body.statements
        .filter(ts.isVariableStatement)
        .flatMap((s) => s.declarationList.declarations)
        .find((d) => ts.isIdentifier(d.name) && d.name.text === 'result' && d.initializer && isCall(d.initializer, 'useBeforeAll'));
      if (decl && !hasSnapshot(body)) {
        const recv = getRunReceiver(decl.initializer);
        if (recv) {
          const last = body.statements[body.statements.length - 1];
          const indent = ' '.repeat(sf.getLineAndCharacterOfPosition(last.getStart(sf)).character);
          const mask = recv.endsWith('scene') ? `${recv}.getMasked(result.out)` : null;
          if (mask)
            inserts.push({
              pos: last.getEnd(),
              text: `\n\n${indent}then('the render matches the snapshot', () => {\n${indent}  expect(${mask}).toMatchSnapshot();\n${indent}});`,
            });
        }
      }
    }
  }
  ts.forEachChild(n, visit);
};
visit(sf);

let out = src;
for (const i of inserts.sort((a, b) => b.pos - a.pos)) out = out.slice(0, i.pos) + i.text + out.slice(i.pos);
fs.writeFileSync(file, out);
console.log(`inserted ${inserts.length} snapshot then(s) into ${file}`);
