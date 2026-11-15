import assert from "node:assert/strict";
import { createPublicClient, erc20Abi, http } from "viem";
import { baseSepolia } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { decodePaymentRequiredHeader, decodePaymentResponseHeader, encodePaymentSignatureHeader } from "@x402/core/http";
import { challenge, FACILITATOR, facilitator, NETWORK, ASSET, AMOUNT, requirements, verifyReceipt } from "../src/payment.ts";
import { analyzeGraph } from "../src/radar.ts";
import { GRAPH, sign } from "../tests/fixture.mjs";

const chain = createPublicClient({ chain: baseSepolia, transport: http("https://sepolia.base.org", { timeout: 12_000, retryCount: 0 }) });
assert.equal(await chain.getChainId(), 84532);
const supported = await facilitator().getSupported();
assert(supported.kinds.some(kind => kind.x402Version === 2 && kind.network === NETWORK && kind.scheme === "exact"));

if (process.argv[2] === "--probe") {
  const key = generatePrivateKey();
  const recipient = privateKeyToAccount(generatePrivateKey()).address;
  const proof = await sign(challenge(recipient, "https://localhost/v1/dependency-graph-review"), key);
  const response = await fetch(`${FACILITATOR}/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      x402Version: 2, paymentPayload: proof, paymentRequirements: requirements(recipient),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const verification = await response.json();
  const report = await analyzeGraph(GRAPH);
  console.log(JSON.stringify({
    chainId: 84532, x402Version: 2, facilitator: FACILITATOR,
    verifyHttpStatus: response.status,
    verification: { isValid: verification.isValid, reason: verification.invalidReason },
    premium: report,
  }, null, 2));
  assert.equal(verification.isValid, false);
} else {
  assert.equal(process.argv[2], "--settle-testnet", "Use --probe or --settle-testnet");
  const { TESTNET_WORKER_URL, TESTNET_SIGNER_KEY, TESTNET_RECIPIENT, STAGING_ACCESS_TOKEN } = process.env;
  const origin = new URL(TESTNET_WORKER_URL);
  assert.equal(origin.origin, TESTNET_WORKER_URL);
  assert(
    origin.protocol === "https:" && /^oseille-x402-sepolia-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin.hostname) ||
      origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname),
    "Use only the isolated staging Worker or localhost",
  );
  const account = privateKeyToAccount(TESTNET_SIGNER_KEY);
  assert.notEqual(account.address.toLowerCase(), TESTNET_RECIPIENT.toLowerCase());
  const balance = await chain.readContract({ address: ASSET, abi: erc20Abi, functionName: "balanceOf", args: [account.address] });
  assert(balance >= BigInt(AMOUNT), `Fund ${account.address} with at least 0.05 Base Sepolia test USDC`);
  const send = (signature) => fetch(new URL("/v1/dependency-graph-review", origin), {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(55_000),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${STAGING_ACCESS_TOKEN}`,
      ...(signature ? { "payment-signature": signature } : {}),
    },
    body: JSON.stringify(GRAPH),
  });
  const due = await send();
  assert.equal(due.status, 402);
  const quote = decodePaymentRequiredHeader(due.headers.get("payment-required"));
  const [term] = quote.accepts;
  assert.equal(quote.x402Version, 2);
  assert.equal(quote.accepts.length, 1);
  assert.equal(term.network, NETWORK);
  assert.equal(term.scheme, "exact");
  assert.equal(term.asset.toLowerCase(), ASSET.toLowerCase());
  assert.equal(term.amount, AMOUNT);
  assert.equal(term.payTo.toLowerCase(), TESTNET_RECIPIENT.toLowerCase());
  assert.equal(term.maxTimeoutSeconds, 120);
  const proof = await sign(quote, TESTNET_SIGNER_KEY);
  const signature = encodePaymentSignatureHeader(proof);
  let response = await send(signature);
  // Retry the same proof only when the Worker has already recorded a transaction hash.
  for (let i = 0; response.status === 503 && i < 3; i++) {
    if ((await response.clone().json()).error !== "receipt_pending") break;
    await new Promise(resolve => setTimeout(resolve, 3_000));
    response = await send(signature);
  }
  assert.equal(response.status, 200, await response.clone().text());
  const receipt = decodePaymentResponseHeader(response.headers.get("payment-response"));
  const analysis = await response.json();
  assert.equal(receipt.network, NETWORK);
  assert.equal(receipt.success, true);
  assert(await verifyReceipt(receipt.transaction, proof.payload.authorization));
  assert(analysis.findings.some(finding => finding.package === "lodash" && !finding.direct));
  const replay = await send(signature);
  assert.equal(replay.status, 200);
  assert.equal(decodePaymentResponseHeader(replay.headers.get("payment-response")).transaction, receipt.transaction);
  assert.deepEqual(await replay.json(), analysis);
  console.log(JSON.stringify({ chainId: 84532, proof: receipt, analysis, replay: "same_transaction_and_analysis" }, null, 2));
}
