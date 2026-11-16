import { pathToFileURL } from "node:url";
import { generateJwt } from "@coinbase/cdp-sdk/auth";

const HOST = "api.cdp.coinbase.com";
const PATH = "/platform/v2/x402/supported";

export async function checkCdp({
  keyId, keySecret, request = fetch, sign = generateJwt,
}) {
  if (!keyId?.trim() || !keySecret?.trim()) throw new Error("Set both CDP_API_KEY_ID and CDP_API_KEY_SECRET privately.");
  let jwt;
  try {
    jwt = await sign({
      apiKeyId: keyId.trim(), apiKeySecret: keySecret.trim(),
      requestMethod: "GET", requestHost: HOST, requestPath: PATH, expiresIn: 60,
    });
  } catch {
    throw new Error("CDP credentials could not sign a request. Check their format and that they belong to the same key.");
  }

  let response;
  try {
    response = await request("https://" + HOST + PATH, {
      method: "GET",
      headers: { authorization: "Bearer " + jwt, accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new Error("CDP capability check could not reach Coinbase.");
  }
  if (!response.ok) throw new Error("CDP capability check returned HTTP " + response.status + ".");

  let supported;
  try {
    const data = await response.json();
    supported = Array.isArray(data.kinds) && data.kinds.some(
      kind => kind?.x402Version === 2 && kind.network === "eip155:8453" && kind.scheme === "exact",
    );
  } catch {
    throw new Error("CDP did not return a readable capability list.");
  }
  if (!supported) throw new Error("CDP did not advertise x402 v2 exact for Base mainnet.");
  return { authenticatedCapabilityCheck: "ok", scheme: "exact", network: "eip155:8453" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await checkCdp({
      keyId: process.env.CDP_API_KEY_ID, keySecret: process.env.CDP_API_KEY_SECRET,
    })));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
