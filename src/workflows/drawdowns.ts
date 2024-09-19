import { executeChild, proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities";
import { collectSignature } from "./signatures";
import { collectPayment } from "./payments";

const { sendEmail, completeStep } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: "1 minute",
});

export interface DrawdownInput {}

export interface DrawdownOutput {}

export async function drawdown(input: DrawdownInput): Promise<DrawdownOutput> {
  await completeStep("drawdown-initiated");
  await sendEmail({
    to: ["simon.stone@globacap.com"],
    subject: "FUND MANAGER - drawdown requested",
    components: [
      {
        type: "body",
        text: [
          "A drawdown was requested, requesting signature on drawdown notice",
        ],
      },
    ],
  });
  await sendEmail({
    to: ["simon.stone@globacap.com"],
    subject: "INVESTOR - drawdown requested",
    components: [
      {
        type: "body",
        text: [
          "A drawdown was requested, please look out for drawdown notice from DocuSign",
        ],
      },
    ],
  });
  await completeStep("drawdown-notice-sent");
  await executeChild(collectSignature, {
    args: [
      {
        templateId: "ae017aee-9a78-4e00-974d-f9b4607dce3c",
        recipients: [
          {
            role: "investor",
            name: "Simon Stone",
            email: "simon.stone@globacap.com",
          },
        ],
      },
    ],
  });
  await completeStep("drawdown-notice-signed");
  await sendEmail({
    to: ["simon.stone@globacap.com"],
    subject: "FUND MANAGER - drawdown signed by investor",
    components: [
      {
        type: "body",
        text: ["The investor signed the drawdown notice, requesting funds"],
      },
    ],
  });
  await completeStep("drawdown-invoice-sent");
  await executeChild(collectPayment, {
    args: [{}],
  });
  await completeStep("drawdown-invoice-paid");
  await sendEmail({
    to: ["simon.stone@globacap.com"],
    subject: "FUND MANAGER - drawdown funded",
    components: [
      {
        type: "body",
        text: ["The investor funded the drawdown request, drawdown complete"],
      },
    ],
  });
  await completeStep("drawdown-complete");
  return {};
}
