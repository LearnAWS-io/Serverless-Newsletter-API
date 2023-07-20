import {
  CreateEmailTemplateCommand,
  SESv2Client,
  UpdateEmailTemplateCommand,
} from "@aws-sdk/client-sesv2";
import { readFile } from "node:fs/promises";
import { Window } from "happy-dom";

const sesClient = new SESv2Client({
  region: "us-east-1",
});

const uploadTemplate = async (name: string) => {
  const templateHTML = await readFile(`./templates/${name}.html`, "utf8");

  const window = new Window();
  const document = window.document;
  document.body.innerHTML = templateHTML;

  const uploadTempCmd = new UpdateEmailTemplateCommand({
    TemplateContent: {
      Subject: "{{name}} please verify your email",
      Html: templateHTML,
      Text: document.body.innerText.trim(),
    },
    TemplateName: name,
  });

  await sesClient.send(uploadTempCmd);
};

uploadTemplate("email-verification");
