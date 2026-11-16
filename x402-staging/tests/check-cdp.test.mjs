import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import { test } from "node:test";
import { checkCdp } from "../scripts/check-cdp.mjs";

test("the authenticated probe signs GET /supported and requires Base exact v2", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const seed = privateKey.export({ format: "der", type: "pkcs8" }).subarray(-32);
  const publicBytes = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
  const keySecret = Buffer.concat([seed, publicBytes]).toString("base64");
  const keyId = "00000000-0000-4000-8000-000000000000";
  const ok = await checkCdp({ keyId, keySecret, request: async (url, request) => {
    assert.equal(url, "https://api.cdp.coinbase.com/platform/v2/x402/supported");
    assert.equal(request.method, "GET");
    assert.equal(request.redirect, "error");
    const [header, data, signature] = request.headers.authorization.slice(7).split(".");
    const claims = JSON.parse(Buffer.from(data, "base64url"));
    assert.deepEqual(claims.uris, ["GET api.cdp.coinbase.com/platform/v2/x402/supported"]);
    assert.equal(claims.sub, keyId);
    assert(verify(null, Buffer.from(header + "." + data), publicKey, Buffer.from(signature, "base64url")));
    return Response.json({ kinds: [{ x402Version: 2, network: "eip155:8453", scheme: "exact" }] });
  } });
  assert.equal(ok.authenticatedCapabilityCheck, "ok");
});

test("rejects missing inputs and suppresses response bodies on auth failures", async () => {
  await assert.rejects(checkCdp({}), /Set both/);
  await assert.rejects(checkCdp({
    keyId: "fake", keySecret: "fake", sign: async () => "fake",
    request: async () => new Response("private upstream response", { status: 401 }),
  }), { message: "CDP capability check returned HTTP 401." });
});
