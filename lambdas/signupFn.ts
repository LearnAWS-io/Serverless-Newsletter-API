import { PutItemCommand, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { marshall } from "@aws-sdk/util-dynamodb";
import { envSchema, signupReqSchema } from "./schema";
import { dbClient } from "./clients";
import { sendEmail } from "./sendEmail";

const { TABLE_NAME } = envSchema.parse(process.env);

export const handler = async (
  e: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!e.body) {
      throw Error("Body is required");
    }
    const body = JSON.parse(e.body);

    // validate the body object
    const { email, name, token } = signupReqSchema.parse(body);

    // create a put command
    const putCmd = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        PK: `EMAIL#${email.toLowerCase()}`,
        SK: `EMAIL#${email.toLowerCase()}`,
        GSI1PK: `IS_VERIFIED#FALSE`,
        GSI1SK: new Date().toISOString(),
        name: name,
      }),
      ConditionExpression: "attribute_not_exists(PK)",
      //INFO: Get old values from table
      // ReturnValues: "ALL_OLD",
    });

    const res = await dbClient.send(putCmd);

    if (res.$metadata.httpStatusCode !== 200) {
      throw Error("something went wrong");
    }

    const emailRes = await sendEmail(name, email);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "You have been added to newsletter" }),
    };
  } catch (err: any) {
    if (
      // will throw if user already exsists
      err.__type ===
      "com.amazonaws.dynamodb.v20120810#ConditionalCheckFailedException"
    ) {
      //TODO: Fetch the user, check if IS_VERIFIED/
      // return you are subscribed already
      //TODO: If not verified send another email
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "Your email already exists" }),
      };
    }
    return { statusCode: 400, body: JSON.stringify({ error: err?.message }) };
  }
};

//@ts-ignore
handler({
  body: JSON.stringify({
    name: "shivam",
    email: "singhshivamkr@gmail.com",
    token: "123",
  }),
}).then((d) => console.log(d));
