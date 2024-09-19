import Stripe from "stripe";
import { sendEmail } from "./emails";
import { Context } from "@temporalio/activity";

const stripe = new Stripe(
  "XXXXXXX"
);

export interface SendInvoiceInput {
  signal: string;
}

export interface SendInvoiceOutput {
  invoiceId: string;
}

export async function sendInvoice(
  input: SendInvoiceInput
): Promise<SendInvoiceOutput> {
  const customerId = "XXXXXXXX";
  const workflowId = Context.current().info.workflowExecution.workflowId;
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: 30,
    // payment_settings: {
    //   payment_method_types: ["bacs_debit"],
    // },
    metadata: {
      'callback.type': "temporal",
      'callback.signal': input.signal,
      'callback.workflowId': workflowId
    },
  });
  await stripe.invoiceItems.create({
    customer: customerId,
    amount: 10000,
    currency: "GBP",
    invoice: invoice.id,
  });
  const sentInvoice = await stripe.invoices.sendInvoice(invoice.id);
  const url = sentInvoice.hosted_invoice_url!;
  await sendEmail({
    to: ["XXXXXXXX"],
    subject: "INVESTOR - please fund your drawdown request",
    components: [
      {
        type: "body",
        text: ["Please fund your drawdown request"],
      },
      {
        type: "button",
        text: "Pay invoice",
        url,
      },
    ],
  });
  return { invoiceId: sentInvoice.id };
}
