import * as cdk from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Construct } from "constructs";
import {
  DomainName,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

export class ServerlessNewsletterApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { JWT_SECRET } = process.env;
    if (!JWT_SECRET) {
      throw Error("JWT secret not found");
    }
    // create DynamoDB table
    const userTable = new Table(this, "newsletter-users", {
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Add another index
    userTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: AttributeType.STRING },
    });

    const handleSignupFn = new NodejsFunction(this, "signup-fn", {
      entry: "lambdas/signupFn.ts",
      runtime: Runtime.NODEJS_18_X,

      environment: {
        TABLE_NAME: userTable.tableName,
        JWT_SECRET,
      },
      bundling: {
        target: "esnext",
        format: OutputFormat.ESM,
      },
    });

    const sesPolicyStatement = new PolicyStatement({
      actions: ["ses:SendEmail"],
      effect: Effect.ALLOW,
      resources: [
        "arn:aws:ses:us-east-1:205979422636:identity/verify@learnaws.io",
        "arn:aws:ses:*:205979422636:configuration-set/*",
        "arn:aws:ses:*:205979422636:template/*",
      ],
    });

    const sesPolicy = new Policy(this, "sesSendEmailPolicy", {
      statements: [sesPolicyStatement],
    });

    handleSignupFn.role?.attachInlinePolicy(sesPolicy);

    userTable.grantReadWriteData(handleSignupFn);

    const domainCert = Certificate.fromCertificateArn(
      this,
      "domain-cert",
      "arn:aws:acm:us-east-1:205979422636:certificate/a9cd3c83-51a0-4173-9288-03f14ec41479"
    );

    const signupFnInteg = new HttpLambdaIntegration(
      "signup-handler-integ",
      handleSignupFn
    );

    const domainName = new DomainName(this, "learnaws-domain", {
      domainName: "sub.learnaws.io",
      certificate: domainCert,
    });

    new CfnOutput(this, "apigw-domain", {
      value: domainName.regionalDomainName ?? "unknown",
    });

    const apiGw = new HttpApi(this, "newsletter-http-api", {
      apiName: "newsletter-api",
      defaultDomainMapping: {
        domainName,
      },
    });

    if (!apiGw.url) {
      throw Error("Unable to get api gateway url");
    }

    apiGw.addRoutes({
      path: "/signup",
      integration: signupFnInteg,
      methods: [HttpMethod.POST],
    });

    new CfnOutput(this, "api-url", {
      value: apiGw.url ?? "unknown",
    });
  }
}
