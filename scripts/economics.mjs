// Scenario calculator, not a revenue forecast or account billing statement.
export function scenario({calls,price,variableCost=0,fixedCost=0,fee=0.001,freeSettlements=1000,eurPerUsdc=0.92}){
 for(const n of [calls,price,variableCost,fixedCost,fee,freeSettlements,eurPerUsdc])if(!Number.isFinite(n)||n<0)throw Error('Use finite nonnegative inputs');
 const gross=calls*price,facilitation=Math.max(0,calls-freeSettlements)*fee;
 const operationalNet=gross-calls*variableCost-fixedCost-facilitation;
 return {calls,price,gross,facilitation,variable:calls*variableCost,fixed:fixedCost,operationalNet,eurScenario:operationalNet*eurPerUsdc,assumptions:'One settlement/call, 1 USDC = 1 USD for fee conversion, hypothetical FX; excludes unentered gas, withdrawal, tax, refunds and maintenance.'};
}
