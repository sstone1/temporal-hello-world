import { Context } from "@temporalio/activity";

const { E_SIGNATURE_URL = "http://e-signature:3000" } = process.env;

export interface CreateSignatureRecipient {
  role: string;
  email: string;
  name: string;
}

export interface CreateSignatureField {
  key: string;
  value: string;
}

export interface CreateSignatureInput {
  templateId: string;
  recipients?: CreateSignatureRecipient[];
  fields?: CreateSignatureField[];
  signal: string;
}

export interface CreateSignatureOutput {
  signatureId: string;
}

export async function createSignature(
  input: CreateSignatureInput
): Promise<CreateSignatureOutput> {
  const workflowId = Context.current().info.workflowExecution.workflowId;
  // TODO: should send in an idempotency key here.
  console.log(JSON.stringify({
    templateUuid: input.templateId,
    recipients: input.recipients,
    fields: input.fields,
    callback: {
      type: "temporal",
      signal: input.signal,
      workflowId,
    },
  }))
  const response = await fetch(`${E_SIGNATURE_URL}/signatures`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant": "globacap",
    },
    body: JSON.stringify({
      templateUuid: input.templateId,
      recipients: input.recipients,
      fields: input.fields,
      callback: {
        type: "temporal",
        signal: input.signal,
        workflowId,
      },
    }),
  });
  if (!response.ok) {
    throw new Error("Unable to request signature");
  }
  // TODO: idempotency key required above to handle crash here.
  const { uuid: signatureId } = await response.json();
  return { signatureId };
}
