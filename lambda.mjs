// This is the source code that publish the messages to the SNS Topic when a change occured within the AWS Account in any region.

import zlib from "zlib";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({});

let input = {
  // PublishInput
  TopicArn: process.env.TOPIC_ARN,
  Subject: `${process.env.PROJECT_NAME} Alert`,
  Message: "",
};

export const handler = (event, context) => {
  let payload = Buffer.from(event.awslogs.data, "base64");
  zlib.gunzip(payload, async (e, result) => {
    if (e) {
      context.fail(e);
      return JSON.stringify(e);
    } else {
      let eventData = JSON.parse(result.toString());

      input.Message = `
      Chers administrateurs,
      Un changement a eu lieu dans votre compte AWS portant l'ID ${eventData.owner}.
      https://${process.env.REGION}.console.aws.amazon.com/cloudwatch/home?region=${process.env.REGION}#logsV2:log-groups/log-group/${eventData.logGroup}/log-events?${eventData.logStream}
      Cliquez sur le lien pour voir les détails.
      `;

      try {
        const response = await snsClient.send(new PublishCommand(input));

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Message successfully sent to SNS!",
            messageId: response.MessageId,
          }),
        };
      } catch (error) {
        console.error("Error publishing message:", error);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Failed to send message to SNS",
            error: error.message,
          }),
        };
      }
    }
  });
};
