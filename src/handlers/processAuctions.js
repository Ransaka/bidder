import { getEndedAuctions } from '../lib/getEndedAuctions';

async function processAuctions(event, context) {
    const auctionsToclose = await getEndedAuctions();
    console.log(auctionsToclose);
}
export const handler = processAuctions;