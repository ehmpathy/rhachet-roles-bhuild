import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorTriaged } from '../../../../domain.objects/BehaviorTriaged';
import {
  BehaviorWorkstream,
  type BehaviorWorkstreamRank,
} from '../../../../domain.objects/BehaviorWorkstream';
import { BehaviorWorkstreamDeliverable } from '../../../../domain.objects/BehaviorWorkstreamDeliverable';

/**
 * .what = groups behaviors into workstreams by dependency chains
 * .why = enables parallel execution visualization and review ordering
 *
 * grouping logic:
 * - behaviors in the same dependency chain belong to the same workstream
 * - independent behaviors may form their own workstreams
 * - diamond dependencies are merged into a single workstream
 */
export const groupBehaviorWorkstreams = (input: {
  triagedBasket: BehaviorTriaged[];
  deptracedBasket: BehaviorDeptraced[];
}): BehaviorWorkstream[] => {
  // build dependency graph
  const graph = buildDependencyGraph(input.deptracedBasket);

  // find connected components (workstreams)
  const components = findConnectedComponents(graph);

  // convert components to workstreams
  const workstreams: BehaviorWorkstream[] = [];

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    if (!component || component.length === 0) continue;

    // find triaged behaviors for this component
    const deliverables: BehaviorWorkstreamDeliverable[] = [];
    let highestPriority: 'p0' | 'p1' | 'p3' | 'p5' = 'p5';
    const highestEffect = -Infinity;

    for (const behaviorName of component) {
      const triaged = input.triagedBasket.find(
        (t) => t.gathered.behavior.name === behaviorName,
      );

      if (triaged) {
        deliverables.push(
          new BehaviorWorkstreamDeliverable({
            gathered: triaged.gathered,
            priority: triaged.priority,
            decision: triaged.decision,
            effect: 0, // will be updated if we have measured data
          }),
        );

        // track highest priority
        const priorityOrder = { p0: 0, p1: 1, p3: 2, p5: 3 };
        if (priorityOrder[triaged.priority] < priorityOrder[highestPriority]) {
          highestPriority = triaged.priority;
        }
      }
    }

    // skip empty workstreams
    if (deliverables.length === 0) continue;

    // create workstream
    const slug = `ws-${i + 1}`;
    const name = generateWorkstreamName(component);

    workstreams.push(
      new BehaviorWorkstream({
        slug,
        name,
        rank: `r${i + 1}` as BehaviorWorkstreamRank,
        priority: highestPriority,
        deliverables,
      }),
    );
  }

  return workstreams;
};

/**
 * .what = builds adjacency list from deptraced basket
 * .why = enables graph traversal for component detection
 */
const buildDependencyGraph = (
  deptracedBasket: BehaviorDeptraced[],
): Map<string, Set<string>> => {
  const graph = new Map<string, Set<string>>();

  // add all nodes
  for (const deptraced of deptracedBasket) {
    const name = deptraced.gathered.behavior.name;
    if (!graph.has(name)) {
      graph.set(name, new Set());
    }

    // add edges (bidirectional for component detection)
    for (const dep of deptraced.dependsOnDirect) {
      const depName = dep.behavior.name;

      if (!graph.has(depName)) {
        graph.set(depName, new Set());
      }

      // add edge in both directions (for undirected component detection)
      graph.get(name)!.add(depName);
      graph.get(depName)!.add(name);
    }
  }

  return graph;
};

/**
 * .what = finds connected components using DFS
 * .why = each component becomes a workstream
 */
const findConnectedComponents = (
  graph: Map<string, Set<string>>,
): string[][] => {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const component: string[] = [];
      dfs(node, graph, visited, component);
      components.push(component);
    }
  }

  return components;
};

/**
 * .what = depth-first search for component detection
 * .why = traverses all connected nodes
 */
const dfs = (
  node: string,
  graph: Map<string, Set<string>>,
  visited: Set<string>,
  component: string[],
): void => {
  visited.add(node);
  component.push(node);

  const neighbors = graph.get(node);
  if (neighbors) {
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, graph, visited, component);
      }
    }
  }
};

/**
 * .what = generates a human-readable workstream name
 * .why = helps identify workstream contents
 */
const generateWorkstreamName = (behaviorNames: string[]): string => {
  if (behaviorNames.length === 1) {
    return behaviorNames[0] ?? 'workstream';
  }

  // find common prefix
  const firstBehavior = behaviorNames[0] ?? '';
  const parts = firstBehavior.split('.');

  if (parts.length >= 2) {
    return `${parts[0]}.* (${behaviorNames.length} behaviors)`;
  }

  return `workstream (${behaviorNames.length} behaviors)`;
};
