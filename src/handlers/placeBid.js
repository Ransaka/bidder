import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import { getAuctionByid } from './getAuction';
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();


async function placeBid(event, context) {
    const { id } = event.pathParameters;
    const { amount } = event.body;
    const auction = await getAuctionByid(id);
    const { email } = event.requestContext.authorizer;

    if (auction.status === 'CLOSED') {
        throw new createError.Forbidden(`You cannot bid for closed bid`);
    }

    if (amount <= auction.highestBid.amount) {
        throw new createError.Forbidden(`Your bid shoul be higher than "${auction.highestBid.amount}"`);
    }

    if (email === auction.seller) {
        throw new createError.Forbidden(`You cannot bid on your own auction`);
    }

    if (email === auction.highestBid.bidder) {
        throw new createError.Forbidden(`You are the already highest bidder`);
    }

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
        ExpressionAttributeValues: {
            ':amount': amount,
            ':bidder': email,
        },
        ReturnValues: 'ALL_NEW',
    };

    let updatedAuction;
    try {
        const result = await dynamodb.update(params).promise();
        updatedAuction = result.Attributes;
    } catch (error) {
        console.log(error);
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ updatedAuction }),
    };
}

export const handler = commonMiddleware(placeBid).use(validator({ inputSchema: placeBidSchema }));