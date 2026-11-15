import { privateKeyToAccount } from "viem/accounts";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

export const TEST_TOKEN = "local-integration-only-oseille-unpublished";
export const RECIPIENT = "0x0000000000000000000000000000000000000001";
export const GRAPH = {
  roots: ["fixture"],
  nodes: [
    { id: "fixture", name: "async", version: "2.6.3", dependencies: ["nested"] },
    { id: "nested", name: "lodash", version: "4.17.20", dependencies: [] },
  ],
};

export async function sign(quote, key) {
  const client = new x402Client();
  registerExactEvmScheme(client, { signer: privateKeyToAccount(key) });
  return client.createPaymentPayload(quote);
}
