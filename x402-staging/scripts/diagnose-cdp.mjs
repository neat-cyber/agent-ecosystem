import { get } from "node:https";
import { generateJwt } from "@coinbase/cdp-sdk/auth";

const HOST = "api.cdp.coinbase.com";
const routes = {
  "API Coinbase": "/platform/v2/evm/accounts",
  "Facilitateur x402": "/platform/v2/x402/supported",
};

async function probe(path, credentials) {
  const jwt = await generateJwt({
    ...credentials,
    requestMethod: "GET",
    requestHost: HOST,
    requestPath: path,
    expiresIn: 60,
  });

  return new Promise((resolve, reject) => {
    const request = get({
      hostname: HOST,
      path,
      family: 4,
      headers: { authorization: `Bearer ${jwt}`, accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    }, response => {
      response.on("error", reject);
      const trace = response.headers["trace-id"];
      const traceSuffix = typeof trace === "string" && /^[a-f0-9-]{8,64}$/i.test(trace)
        ? ` · trace ${trace}`
        : "";
      const serverTime = Date.parse(response.headers.date);
      const clockSuffix = Number.isFinite(serverTime)
        && Math.abs(Date.now() - serverTime) > 30_000
        ? " · écart d’horloge supérieur à 30 s"
        : "";
      response.on("end", () => resolve(`HTTP ${response.statusCode}${traceSuffix}${clockSuffix}`));
      response.resume();
    });
    request.on("error", reject);
  });
}

const credentials = {
  apiKeyId: process.env.CDP_API_KEY_ID?.trim(),
  apiKeySecret: process.env.CDP_API_KEY_SECRET?.trim(),
};

if (!credentials.apiKeyId || !credentials.apiKeySecret) {
  console.error("Identifiant ou secret manquant.");
  process.exitCode = 1;
} else {
  for (const [label, path] of Object.entries(routes)) {
    try {
      console.log(`${label} : ${await probe(path, credentials)}`);
    } catch {
      console.error(`${label} : échec de la signature locale ou de la connexion IPv4.`);
      process.exitCode = 1;
    }
  }
}
