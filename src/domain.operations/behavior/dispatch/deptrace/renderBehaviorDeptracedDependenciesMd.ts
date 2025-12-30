import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';

/**
 * .what = renders dependency graph as markdown for human review
 * .why = enables visualization of behavior dependencies and blockers
 */
export const renderBehaviorDeptracedDependenciesMd = (input: {
  deptraced: BehaviorDeptraced[];
  basket: BehaviorGathered[];
}): string => {
  const lines: string[] = [];

  // header
  lines.push('# behavior dependencies');
  lines.push('');
  lines.push(
    'this document shows the dependency graph for all gathered behaviors.',
  );
  lines.push('');

  // summary stats
  const withDeps = input.deptraced.filter(
    (d) => d.dependsOnDirect.length > 0,
  ).length;
  const totalDeps = input.deptraced.reduce(
    (sum, d) => sum + d.dependsOnDirect.length,
    0,
  );
  lines.push('## summary');
  lines.push('');
  lines.push(`- total behaviors: ${input.deptraced.length}`);
  lines.push(`- behaviors with dependencies: ${withDeps}`);
  lines.push(`- total direct dependencies: ${totalDeps}`);
  lines.push('');

  // dependency tree
  lines.push('## dependency tree');
  lines.push('');

  // sort by number of dependents (most depended-on first)
  const sortedDeptraced = [...input.deptraced].sort((a, b) => {
    // count how many behaviors depend on each
    const countA = countDependents(a.gathered.behavior.name, input.deptraced);
    const countB = countDependents(b.gathered.behavior.name, input.deptraced);
    return countB - countA;
  });

  for (const deptraced of sortedDeptraced) {
    const name = deptraced.gathered.behavior.name;
    const directCount = deptraced.dependsOnDirect.length;
    const transitiveCount = deptraced.dependsOnTransitive.length;
    const dependentCount = countDependents(name, input.deptraced);

    // render behavior header
    lines.push(`### ${name}`);
    lines.push('');

    // render stats
    if (dependentCount > 0) {
      lines.push(`- 🔗 **${dependentCount}** behaviors depend on this`);
    }

    // render dependencies
    if (directCount === 0) {
      lines.push('- ✅ no dependencies (can start immediately)');
    }
    if (directCount > 0) {
      lines.push(`- ⏳ **direct dependencies** (${directCount}):`);
      for (const dep of deptraced.dependsOnDirect) {
        lines.push(`  - ${dep.behavior.name}`);
      }
    }
    if (transitiveCount > directCount) {
      const transitiveOnlyCount = transitiveCount - directCount;
      lines.push(`- 🔄 **transitive dependencies** (+${transitiveOnlyCount}):`);

      // show only transitive deps not in direct
      const directNames = new Set(
        deptraced.dependsOnDirect.map((d) => d.behavior.name),
      );
      const transitiveOnly = deptraced.dependsOnTransitive.filter(
        (t) => !directNames.has(t.behavior.name),
      );
      for (const dep of transitiveOnly) {
        lines.push(`  - ${dep.behavior.name}`);
      }
    }

    lines.push('');
  }

  // render reverse dependency index
  lines.push('## reverse dependencies');
  lines.push('');
  lines.push('behaviors that other behaviors depend on:');
  lines.push('');

  const reverseDeps = buildReverseDependencyIndex(input.deptraced);
  const sortedReverse = [...reverseDeps.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );

  if (sortedReverse.length === 0) {
    lines.push('*no dependencies exist*');
  }

  for (const [name, dependents] of sortedReverse) {
    if (dependents.length > 0) {
      lines.push(`- **${name}** is depended on by:`);
      for (const dep of dependents) {
        lines.push(`  - ${dep}`);
      }
    }
  }

  lines.push('');
  lines.push('---');
  lines.push(`*generated at ${new Date().toISOString()}*`);

  return lines.join('\n');
};

/**
 * .what = counts how many behaviors depend on a given behavior
 * .why = enables ranking behaviors by impact
 */
const countDependents = (
  behaviorName: string,
  deptraced: BehaviorDeptraced[],
): number => {
  return deptraced.filter((d) =>
    d.dependsOnDirect.some((dep) => dep.behavior.name === behaviorName),
  ).length;
};

/**
 * .what = builds reverse dependency index
 * .why = enables viewing what depends on what
 */
const buildReverseDependencyIndex = (
  deptraced: BehaviorDeptraced[],
): Map<string, string[]> => {
  const index = new Map<string, string[]>();

  for (const d of deptraced) {
    for (const dep of d.dependsOnDirect) {
      const depName = dep.behavior.name;
      const existing = index.get(depName) ?? [];
      existing.push(d.gathered.behavior.name);
      index.set(depName, existing);
    }
  }

  return index;
};
