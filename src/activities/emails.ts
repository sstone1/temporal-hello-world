const { POSTBOX_URL = "http://postbox:3000" } = process.env;

export interface SendEmailBodyComponent {
  type: 'body'
  text: string[]
}

export interface SendEmailButtonComponent {
  type: 'button'
  text: string
  url: string
}

export type SendEmailComponent = SendEmailBodyComponent | SendEmailButtonComponent;

export interface SendEmailInput {
  from?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  components: SendEmailComponent[]
}

export interface SendEmailOutput {
  emailId: string;
}

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailOutput> {
  // TODO: should send in an idempotency key here.
  const response = await fetch(`${POSTBOX_URL}/v1/emails`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant": "globacap",
    },
    body: JSON.stringify({
      ...input
    }),
  });
  if (!response.ok) {
    throw new Error("Unable to send email");
  }
  // TODO: idempotency key required above to handle crash here.
  const { id: emailId } = await response.json();
  return { emailId };
}
