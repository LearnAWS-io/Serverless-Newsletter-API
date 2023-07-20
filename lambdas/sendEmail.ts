import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import { sesClient } from "./clients";
import { createJwt } from "./jwt";

export const sendEmail = async (name: string, email: string) => {
  const jwtToken = await createJwt(email);

  const sendEmailCmd = new SendEmailCommand({
    FromEmailAddress: "LearnAWS<verify@learnaws.io>",
    Destination: {
      ToAddresses: [email],
    },
    ConfigurationSetName: "verification",
    Content: {
      Template: {
        TemplateName: "email-verification",
        TemplateData: JSON.stringify({
          name: name,
          verification_link: `https://sub.learnaws.io/verify?jwt=${jwtToken}`,
        }),
      },
    },
  });

  return sesClient.send(sendEmailCmd);
};
