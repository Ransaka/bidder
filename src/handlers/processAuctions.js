import { getEndedAuctions } from '../lib/getEndedAuctions';

async function processAuctions(event, context) {
    const auctionsToclose = await getEndedAuctions();
    console.Console.log(auctionsToclose);
}
export const handler = processAuctions;