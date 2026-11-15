import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const PACKAGE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/;
const MAX_NODES = 40;
const MAX_EDGES = 200;

export function toRadarGraph(tree, selected) {
  if (!selected.length || selected.length > 10 || new Set(selected).size !== selected.length) {
    throw new Error("Select 1 to 10 distinct direct dependencies.");
  }
  if (!tree || typeof tree !== "object" || !tree.dependencies) {
    throw new Error("Expected JSON from npm ls --all --long --package-lock-only.");
  }
  const byPath = new Map();
  const stack = Object.values(tree.dependencies);
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    const children = Object.entries(node.dependencies ?? {});
    stack.push(...children.map(([, child]) => child));
    if (typeof node.path !== "string") continue;
    const found = byPath.get(node.path);
    if (!found) {
      byPath.set(node.path, { ...node, children: new Map(children) });
      continue;
    }
    if (found.name !== node.name || found.version !== node.version ||
      (found.resolved && node.resolved && found.resolved !== node.resolved)) {
      throw new Error("npm returned inconsistent metadata for a dependency instance.");
    }
    found.resolved ??= node.resolved;
    for (const [name, child] of children) {
      if (found.children.has(name) && found.children.get(name)?.path !== child?.path) {
        throw new Error("npm returned inconsistent edges for a dependency instance.");
      }
      found.children.set(name, child);
    }
  }

  const paths = new Map();
  const pending = [];
  let edges = 0;
  function include(node) {
    if (!node?.path) throw new Error("A selected branch contains a missing or unresolved dependency.");
    if (paths.has(node.path)) return paths.get(node.path).id;
    const entry = byPath.get(node.path);
    if (!entry || entry.missing || entry.invalid || entry.extraneous || !PACKAGE.test(entry.name ?? "") ||
      entry.name.length > 214 || !VERSION.test(entry.version ?? "") || entry.version.length > 64 ||
      !/^https:\/\/registry\.npmjs\.org\//i.test(entry.resolved ?? "")) {
      throw new Error("A selected branch contains an invalid dependency or a package outside registry.npmjs.org.");
    }
    if (paths.size >= MAX_NODES) throw new Error("This branch exceeds 40 packages. Try fewer direct dependencies.");
    const graphNode = { id: "n" + (paths.size + 1), name: entry.name, version: entry.version, dependencies: [] };
    paths.set(node.path, graphNode);
    pending.push([entry, graphNode]);
    return graphNode.id;
  }

  const roots = selected.map(name => {
    if (!Object.hasOwn(tree.dependencies, name)) throw new Error("A requested dependency is absent at the root.");
    return include(tree.dependencies[name]);
  });
  if (new Set(roots).size !== roots.length) throw new Error("Two root selections resolve to the same instance.");
  for (const [entry, graphNode] of pending) {
    graphNode.dependencies = [...new Set(
      [...entry.children.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, child]) => include(child)),
    )];
    edges += graphNode.dependencies.length;
    if (edges > MAX_EDGES) throw new Error("This branch exceeds 200 dependency edges.");
  }
  return { roots, nodes: [...paths.values()] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const tree = JSON.parse(readFileSync(0, "utf8"));
    console.log(JSON.stringify(toRadarGraph(tree, process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(error instanceof SyntaxError ? "Input is not valid npm JSON." : error.message);
    process.exitCode = 1;
  }
}
