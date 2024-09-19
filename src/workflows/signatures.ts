import {
  CancellationScope,
  CancelledFailure,
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from "@temporalio/workflow";
import { CreateSignatureInput, CreateSignatureOutput } from "../activities";
import type * as activities from "../activities";

const { createSignature } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export interface CollectSignatureInput extends Omit<CreateSignatureInput, 'signal'> {}

export interface CollectSignatureOutput extends CreateSignatureOutput {}

export const signatureUpdated =
  defineSignal<[{ status: string }]>("signatureUpdated");

export async function collectSignature(
  input: CollectSignatureInput
): Promise<CollectSignatureOutput> {
  const { templateId, recipients, fields } = input;
  let signatureStatus = "created";
  setHandler(signatureUpdated, ({ status }) => {
    signatureStatus = status;
  });
  const { signatureId } = await createSignature({
    templateId,
    recipients,
    fields,
    signal: signatureUpdated.name,
  });
  try {
    await CancellationScope.cancellable(async () => {
      // TODO: check for voided as well
      await condition(() => signatureStatus === "completed");
    });
    if (signatureStatus !== "completed") {
      throw new Error(`Signature ${signatureId} was not completed`);
    }
    return { signatureId };
  } catch (e) {
    if (e instanceof CancelledFailure) {
      // TODO: should void the envelope here if not complete yet?
      if (signatureId) {
        console.log(`Should cancel signature with ID ${signatureId}`);
      }
      throw e;
    } else {
      throw e;
    }
  }
}
