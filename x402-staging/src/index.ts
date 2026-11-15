// Isolated staging skeleton. No charge or payment settlement is enabled.
// Enable only after SDK version pinning, facilitator testnet verification, and operator review.
export interface Env {
  X402_NETWORK: string;
  X402_PRICE_USD: string;
  X402_ENABLED: string;
  X402_RECIPIENT: string;
  X402_FACILITATOR_URL: string;
}
const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' };
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (request.method !== 'GET') return new Response(JSON.stringify({error:'method_not_allowed'}), {status:405,headers});
    if (path === '/health') return new Response(JSON.stringify({ok:true,service:'oseille-x402-sepolia-staging',network:'base-sepolia',payments_enabled:false}),{headers});
    if (path === '/readiness') return new Response(JSON.stringify({ready:false,reason:'x402_sdk_and_testnet_settlement_not_yet_verified',recipient_configured:/^0x[0-9a-fA-F]{40}$/.test(env.X402_RECIPIENT || ''),payments_enabled:false}),{status:503,headers});
    return new Response(JSON.stringify({error:'not_found'}),{status:404,headers});
  }
} satisfies ExportedHandler<Env>;
