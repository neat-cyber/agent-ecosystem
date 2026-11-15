import { z } from "zod";

const nodeId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_@/.:+-]+$/);
const packageName = z.string().max(214).regex(/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/);
const version = z.string().max(64).regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/);

export const graphShape = {
  roots: z.array(nodeId).min(1).max(10).describe("Direct dependency IDs from the lockfile"),
  nodes: z.array(z.object({
    id: nodeId,
    name: packageName,
    version,
    dependencies: z.array(nodeId).max(40),
  }).strict()).min(1).max(40).describe("Resolved npm dependency instances, including transitives"),
};

export const graphSchema = z.object(graphShape).strict();
type Graph = z.infer<typeof graphSchema>;
export const TOOL_NAME = "dependency_graph_review";
export const DESCRIPTION = "Review a resolved npm dependency graph with OSV. Return advisory IDs, direct-to-transitive paths, and suggested owners for remediation. Base Sepolia test USDC only.";

export function mapGraph(graph: Graph) {
  const byId = new Map(graph.nodes.map(node => [node.id, node]));
  const paths = new Map<string, string[][]>();
  const edges = graph.nodes.reduce((total, node) => total + node.dependencies.length, 0);
  if (byId.size !== graph.nodes.length || new Set(graph.roots).size !== graph.roots.length || edges > 200) {
    throw new Error("duplicate_id_or_edge_limit");
  }
  for (const root of graph.roots) {
    const queue = [[root]];
    const visited = new Set([root]);
    for (const path of queue) {
      const id = path[path.length - 1];
      const node = byId.get(id);
      if (!node) throw new Error("unknown_dependency_id");
      const known = paths.get(id) ?? [];
      known.push(path);
      paths.set(id, known);
      for (const target of [...node.dependencies].sort()) {
        if (!visited.has(target)) {
          visited.add(target);
          queue.push([...path, target]);
        }
      }
    }
  }
  if (paths.size !== byId.size) throw new Error("unreachable_dependency_id");
  return paths;
}

const osvResponse = z.object({
  results: z.array(z.object({
    vulns: z.array(z.object({ id: z.string().max(160) })).max(100).optional(),
    next_page_token: z.string().optional(),
  })).max(40),
});

export async function analyzeGraph(graph: Graph, fetcher: typeof fetch = fetch) {
  const paths = mapGraph(graph);
  const packages = [...new Map(graph.nodes.map(node => [
    `${node.name}@${node.version}`,
    { package: { ecosystem: "npm", name: node.name }, version: node.version },
  ])).entries()];
  const response = await fetcher("https://api.osv.dev/v1/querybatch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ queries: packages.map(([, query]) => query) }),
    signal: AbortSignal.timeout(8_000),
    redirect: "manual",
  });
  if (!response.ok) throw new Error("osv_unavailable");
  const raw = await readBounded(response.body, 512_000);
  const { results } = osvResponse.parse(JSON.parse(raw));
  if (results.length !== packages.length || results.some(row => row.next_page_token)) {
    throw new Error("osv_incomplete");
  }
  const advisoryByPackage = new Map(packages.map(([key], index) => [
    key, [...new Set((results[index].vulns ?? []).map(advisory => advisory.id))].sort(),
  ]));
  const findings = graph.nodes.flatMap(node => {
    const advisories = advisoryByPackage.get(`${node.name}@${node.version}`) ?? [];
    if (!advisories.length) return [];
    const rootPaths = paths.get(node.id)!;
    const direct = graph.roots.includes(node.id);
    return [{
      id: node.id, package: node.name, version: node.version, direct, advisories,
      paths: rootPaths,
      nextAction: direct ? "raise_direct_dependency_version" : "review_or_upgrade_direct_ancestor",
      directAncestors: rootPaths.map(path => path[0]),
    }];
  }).sort((a, b) => Number(b.direct) - Number(a.direct) || a.id.localeCompare(b.id));
  return {
    schemaVersion: 1,
    status: findings.length ? "review_required" : "no_osv_matches",
    checkedAt: new Date().toISOString(),
    source: "https://osv.dev",
    inspected: { nodes: graph.nodes.length, distinctReleases: packages.length, directRoots: graph.roots.length },
    findings,
    limits: "Coverage is limited to supplied resolved npm nodes and known OSV advisories. Paths are one shortest path per affected direct root. Upgrade hints require lockfile regeneration and compatibility checks.",
  };
}

export async function readBounded(body: ReadableStream<Uint8Array> | null, limit: number) {
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });
  let count = 0;
  let text = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return text + decoder.decode();
      count += value.length;
      if (count > limit) throw new RangeError("body_too_large");
      text += decoder.decode(value, { stream: true });
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
