import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SESv2Client } from "@aws-sdk/client-sesv2";

export const dbClient = new DynamoDBClient({});

export const sesClient = new SESv2Client({ region: "us-east-1" });
