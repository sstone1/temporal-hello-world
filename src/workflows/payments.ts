import {
  CancellationScope,
  CancelledFailure,
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from "@temporalio/workflow";
import type * as activities from "../activities";

const { sendInvoice } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export interface CollectPaymentInput {}

export interface CollectPaymentOutput {}

export const invoiceUpdated =
  defineSignal<[{ status: string }]>("invoiceUpdated");

export async function collectPayment(
  input: CollectPaymentInput
): Promise<CollectPaymentOutput> {
  let invoiceStatus = "draft";
  setHandler(invoiceUpdated, ({ status }) => {
    invoiceStatus = status;
  });
  const { invoiceId } = await sendInvoice({
    signal: invoiceUpdated.name,
  });
  try {
    await CancellationScope.cancellable(async () => {
      // TODO: check for voided as well
      await condition(() => invoiceStatus === "paid");
    });
    if (invoiceStatus !== "paid") {
      throw new Error(`Invoice ${invoiceId} was not paid`);
    }
    return { invoiceId };
  } catch (e) {
    if (e instanceof CancelledFailure) {
      // TODO: should void the invoice here if not complete yet?
      if (invoiceId) {
        console.log(`Should cancel invoice with ID ${invoiceId}`);
      }
      throw e;
    } else {
      throw e;
    }
  }
}
