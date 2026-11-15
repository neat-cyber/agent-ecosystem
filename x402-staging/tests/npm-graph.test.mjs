import assert from "node:assert/strict";
import { test } from "node:test";
import { toRadarGraph } from "../scripts/npm-graph.mjs";
import { graphSchema, mapGraph } from "../src/radar.ts";

const npmNode = (name, path = "/example/node_modules/" + name) => ({
  name, path, version: "1.2.3", resolved: "https://registry.npmjs.org/" + name + "/example.tgz",
});

test("combines repeated instances and keeps nested versions and local paths separate", () => {
  const shared = npmNode("shared");
  const leaf = npmNode("@example/leaf");
  const tree = { dependencies: {
    first: { ...npmNode("first"), dependencies: { shared: { ...shared, resolved: undefined } } },
    second: { ...npmNode("second"), dependencies: { shared: {
      ...npmNode("shared", "/example/node_modules/second/node_modules/shared"), version: "2.0.0",
    } } },
    shared: { ...shared, dependencies: { "@example/leaf": leaf } },
  } };
  const graph = graphSchema.parse(toRadarGraph(tree, ["first", "second"]));
  const paths = mapGraph(graph);
  assert.deepEqual(paths.get(graph.nodes.find(node => node.name === "@example/leaf").id), [["n1", "n3", "n5"]]);
  assert.deepEqual(graph.nodes.filter(node => node.name === "shared").map(node => node.version), ["1.2.3", "2.0.0"]);
  assert.doesNotMatch(JSON.stringify(graph), /\/example\/node_modules|registry\.npmjs/);
});

test("rejects unresolved dependencies, private registries, and oversized branches", () => {
  const tree = node => ({ dependencies: { first: { ...npmNode("first"), dependencies: node } } });
  assert.throws(() => toRadarGraph(tree({ missing: { missing: true } }), ["first"]), /missing or unresolved/);
  assert.throws(() => toRadarGraph(tree({ private: { ...npmNode("private"), resolved: "https://private.invalid/a" } }), ["first"]), /outside/);
  const many = Object.fromEntries(Array.from({length:40}, (_, i) => ["test-" + i, npmNode("test-" + i)]));
  assert.throws(() => toRadarGraph(tree(many), ["first"]), /exceeds 40 packages/);
});
