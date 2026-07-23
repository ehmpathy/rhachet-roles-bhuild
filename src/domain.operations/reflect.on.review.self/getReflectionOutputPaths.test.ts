import { homedir } from 'os';
import { isAbsolute, join } from 'path';
import { given, then, when } from 'test-fns';

import {
  asDisplayPath,
  getReflectionOutputPaths,
} from './getReflectionOutputPaths';

describe('getReflectionOutputPaths', () => {
  given('[case1] no flags — the vision headline flagless default', () => {
    // the primary vision UX is `rhx reflect.on.reviews.self` with zero args; its
    // default output path was previously only reachable via the full CLI, so
    // this asserts the machine-level dated default directly
    when('[t0] derived with no --into and no --route', () => {
      const paths = getReflectionOutputPaths({
        into: undefined,
        routeFilter: null,
      });

      then('the report lands under ~/.rhachet/reflect, not cwd', () => {
        const machineDir = join(homedir(), '.rhachet', 'reflect');
        expect(paths.reportPath.startsWith(machineDir)).toEqual(true);
        expect(paths.reportPath.startsWith(process.cwd())).toEqual(false);
      });

      then('the report file is dated (YYYY-MM-DD) and ends in .md', () => {
        expect(paths.reportPath).toMatch(
          /reflection\.reviews\.self\.\d{4}-\d{2}-\d{2}\.md$/,
        );
      });

      then('the json path is distinct and ends in .v1.json', () => {
        expect(paths.jsonPath).toMatch(
          /reflection\.reviews\.self\.\d{4}-\d{2}-\d{2}\.v1\.json$/,
        );
        expect(paths.jsonPath).not.toEqual(paths.reportPath);
      });
    });
  });

  given('[case2] a --route filter but no --into', () => {
    when('[t0] derived', () => {
      const paths = getReflectionOutputPaths({
        into: undefined,
        routeFilter: '.behavior/my-route',
      });

      then('the report defaults into the route dir', () => {
        expect(paths.reportPath).toEqual(
          join(
            process.cwd(),
            '.behavior/my-route',
            'reflection.reviews.self.yield.md',
          ),
        );
      });

      then('the json path is the .md swapped for .v1.json', () => {
        expect(paths.jsonPath).toEqual(
          join(
            process.cwd(),
            '.behavior/my-route',
            'reflection.reviews.self.yield.v1.json',
          ),
        );
      });
    });
  });

  given('[case3] an explicit --into with a .md suffix', () => {
    when('[t0] derived', () => {
      const paths = getReflectionOutputPaths({
        into: '/tmp/report.md',
        routeFilter: null,
      });

      then('the report is the given absolute path', () => {
        expect(paths.reportPath).toEqual('/tmp/report.md');
      });

      then('the json path swaps only the extension', () => {
        expect(paths.jsonPath).toEqual('/tmp/report.v1.json');
      });
    });
  });

  given('[case4] an explicit --into without a .md suffix', () => {
    // regression: a suffixless --into must still yield distinct report + json
    // paths, never a collision where the json write clobbers the report
    when('[t0] derived', () => {
      const paths = getReflectionOutputPaths({
        into: '/tmp/noext-report',
        routeFilter: null,
      });

      then('the report gets a .md suffix', () => {
        expect(paths.reportPath).toEqual('/tmp/noext-report.md');
      });

      then('the json path is distinct from the report path', () => {
        expect(paths.jsonPath).toEqual('/tmp/noext-report.v1.json');
        expect(paths.jsonPath).not.toEqual(paths.reportPath);
      });
    });
  });

  given('[case5] a relative --into', () => {
    when('[t0] derived', () => {
      const paths = getReflectionOutputPaths({
        into: 'sub/report.md',
        routeFilter: null,
      });

      then('it resolves under cwd as an absolute path', () => {
        expect(paths.reportPath).toEqual(join(process.cwd(), 'sub/report.md'));
        expect(isAbsolute(paths.reportPath)).toEqual(true);
      });
    });
  });

  describe('asDisplayPath', () => {
    given('[case1] a path inside cwd', () => {
      when('[t0] rendered', () => {
        then('it shows a tidy relative path', () => {
          const inside = join(process.cwd(), 'foo/bar.md');
          expect(asDisplayPath({ path: inside })).toEqual('foo/bar.md');
        });
      });
    });

    given('[case2] a path outside cwd', () => {
      when('[t0] rendered', () => {
        then('it shows the absolute path, not a ../../.. chain', () => {
          const outside = join(homedir(), '.rhachet', 'reflect', 'r.md');
          expect(asDisplayPath({ path: outside })).toEqual(outside);
        });
      });
    });
  });
});
