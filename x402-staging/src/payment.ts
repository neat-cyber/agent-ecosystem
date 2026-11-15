import { decodePaymentSignatureHeader } from "@x402/core/http";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { PaymentPayloadV2Schema } from "@x402/core/schemas";
import type { PaymentPayload, PaymentRequired, PaymentRequirements, SettleResponse } from "@x402/core/types";
import { z } from "zod";
import { DESCRIPTION, readBounded } from "./radar.ts";

export const NETWORK = "eip155:84532";
export const ASSET = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const AMOUNT = "50000";
export const FACILITATOR = "https://x402.org/facilitator";
export const address = z.string().regex(/^0x[0-9a-f]{40}$/i);

const authorization = z.object({
  from: address,
  to: address,
  value: z.literal(AMOUNT),
  validAfter: z.string().regex(/^\d{1,10}$/),
  validBefore: z.string().regex(/^\d{1,10}$/),
  nonce: z.string().regex(/^0x[0-9a-f]{64}$/i),
}).strict();

export function requirements(recipient: string): PaymentRequirements {
  return {
    scheme: "exact", network: NETWORK, asset: ASSET, amount: AMOUNT,
    payTo: recipient, maxTimeoutSeconds: 120,
    extra: { name: "USDC", version: "2" },
  };
}

export function challenge(recipient: string, url: string): PaymentRequired {
  return {
    x402Version: 2, error: "PAYMENT_REQUIRED",
    resource: { url, description: DESCRIPTION, mimeType: "application/json" },
    accepts: [requirements(recipient)],
  };
}

export function parseProof(token: unknown, recipient: string) {
  if (typeof token !== "string" || token.length > 6_000) return null;
  try {
    const proof = PaymentPayloadV2Schema.parse(decodePaymentSignatureHeader(token));
    const accepted = proof.accepted;
    if (accepted.network !== NETWORK || accepted.scheme !== "exact" || accepted.amount !== AMOUNT ||
      accepted.asset.toLowerCase() !== ASSET.toLowerCase() || accepted.payTo.toLowerCase() !== recipient.toLowerCase() ||
      accepted.maxTimeoutSeconds !== 120 ||
      accepted.extra?.name !== "USDC" || accepted.extra.version !== "2" || accepted.extra.assetTransferMethod) return null;
    const auth = authorization.parse(proof.payload.authorization);
    const signature = proof.payload.signature;
    if (auth.to.toLowerCase() !== recipient.toLowerCase() ||
      typeof signature !== "string" || !/^0x[0-9a-f]{130}$/i.test(signature)) return null;
    const normalized: PaymentPayload = {
      x402Version: 2, accepted: requirements(recipient), payload: { authorization: auth, signature },
    };
    return {
      proof: normalized, auth,
      key: `${auth.from.toLowerCase()}:${auth.nonce.toLowerCase()}`,
      signature: signature.toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function availableWindow(auth: NonNullable<ReturnType<typeof parseProof>>["auth"], now = Math.floor(Date.now()/1000)) {
  return Number(auth.validAfter) <= now &&
    (auth.validAfter === "0" || Number(auth.validAfter) >= now - 180) &&
    Number(auth.validBefore) >= now + 30 &&
    Number(auth.validBefore) <= now + 125;
}

export function confirmed(settlement: SettleResponse, payer: string) {
  return settlement.success === true && settlement.network === NETWORK &&
    /^0x[0-9a-f]{64}$/i.test(settlement.transaction) &&
    settlement.payer?.toLowerCase() === payer.toLowerCase();
}

export function facilitator() {
  return new HTTPFacilitatorClient({ url: FACILITATOR, timeoutMs: 20_000 });
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const authorizationTopic = "0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5";
const receiptSchema = z.object({
  result: z.object({
    status: z.literal("0x1"),
    transactionHash: z.string(),
    logs: z.array(z.object({ address: z.string(), topics: z.array(z.string()), data: z.string() })),
  }),
});

export async function verifyReceipt(transaction: string, auth: NonNullable<ReturnType<typeof parseProof>>["auth"]) {
  const response = await fetch("https://sepolia.base.org", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [transaction] }),
    signal: AbortSignal.timeout(8_000),
    redirect: "manual",
  });
  if (!response.ok) return false;
  const { result } = receiptSchema.parse(JSON.parse(await readBounded(response.body, 256_000)));
  if (result.transactionHash.toLowerCase() !== transaction.toLowerCase()) return false;
  const logs = result.logs.filter(log => log.address.toLowerCase() === ASSET.toLowerCase());
  const topicAddress = (value: string) => `0x${value.slice(2).toLowerCase().padStart(64, "0")}`;
  const payer = topicAddress(auth.from);
  const payee = topicAddress(auth.to);
  const amount = `0x${BigInt(AMOUNT).toString(16).padStart(64, "0")}`;
  return logs.some((log, index) => {
    if (log.topics[0] !== authorizationTopic || log.topics[1] !== payer ||
      log.topics[2] !== auth.nonce.toLowerCase()) return false;
    const transfer = logs[index + 1];
    return transfer?.topics[0] === transferTopic && transfer.topics[1] === payer &&
      transfer.topics[2] === payee && transfer.data === amount;
  });
}
