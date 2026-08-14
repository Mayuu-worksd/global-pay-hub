import "./lib/error-capture";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Webhook handling: Unit events
async function handleUnitWebhook(request: Request): Promise<Response> {
  try {
    const payload = await request.json();
    const eventType = payload.data?.type;
    const { supabaseAdmin } = await import("./integrations/supabase/client.server");

    if (eventType === "application.approved") {
      const applicationId = payload.data.id;
      const customerId = payload.data.relationships?.customer?.data?.id;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("unit_application_id", applicationId)
        .maybeSingle();

      if (profile) {
        await supabaseAdmin
          .from("profiles")
          .update({
            unit_customer_id: customerId,
            kyc_completed: true,
            profile_completed: true,
            onboarding_completed: true,
          })
          .eq("id", profile.id);

        await supabaseAdmin
          .from("kyc")
          .update({ status: "approved" })
          .eq("user_id", profile.id);
      }
    } else if (eventType === "transaction.created") {
      const attributes = payload.data.attributes;
      const customerId = payload.data.relationships?.customer?.data?.id;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("unit_customer_id", customerId)
        .maybeSingle();

      if (profile) {
        const amount = attributes.amount / 100;
        const currency = attributes.currency || "USD";
        const direction = attributes.direction;
        const type = direction === "Credit" ? "deposit" : "withdrawal";

        await supabaseAdmin.from("transactions").insert({
          user_id: profile.id,
          type,
          amount,
          currency,
          status: "completed",
          description: attributes.description || `Unit transaction ${payload.data.id}`,
          reference: `TX-UNIT-${payload.data.id}`,
        });

        const delta = direction === "Credit" ? amount : -amount;
        const { data: wallet } = await supabaseAdmin
          .from("fiat_wallets")
          .select("id, balance")
          .eq("user_id", profile.id)
          .eq("currency", currency)
          .maybeSingle();

        if (wallet) {
          const next = Math.max(0, Number(wallet.balance) + delta);
          await supabaseAdmin
            .from("fiat_wallets")
            .update({ balance: next, available_balance: next })
            .eq("id", wallet.id);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Webhook handling: Currencycloud events
async function handleCurrencycloudWebhook(request: Request): Promise<Response> {
  try {
    const payload = await request.json();
    const eventType = payload.event;
    const { supabaseAdmin } = await import("./integrations/supabase/client.server");

    if (eventType === "deposit.received") {
      const contactId = payload.contact_id;
      const amount = Number(payload.amount);
      const currency = payload.currency;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("currencycloud_contact_id", contactId)
        .maybeSingle();

      if (profile) {
        await supabaseAdmin.from("transactions").insert({
          user_id: profile.id,
          type: "deposit",
          amount,
          currency,
          status: "completed",
          description: `Bank deposit ${payload.deposit_id || ""}`,
          reference: `TX-CC-${payload.deposit_id || Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });

        const { data: wallet } = await supabaseAdmin
          .from("fiat_wallets")
          .select("id, balance")
          .eq("user_id", profile.id)
          .eq("currency", currency)
          .maybeSingle();

        if (wallet) {
          const next = Math.max(0, Number(wallet.balance) + amount);
          await supabaseAdmin
            .from("fiat_wallets")
            .update({ balance: next, available_balance: next })
            .eq("id", wallet.id);
        }
      }
    } else if (eventType === "payout.completed") {
      const payoutId = payload.payment_id;
      const reference = `TX-PAY-${payoutId}`;

      await supabaseAdmin
        .from("transactions")
        .update({ status: "completed" })
        .eq("reference", reference);
    } else if (eventType === "exchange.completed") {
      const contactId = payload.contact_id;
      const from = payload.sell_currency;
      const to = payload.buy_currency;
      const amount = Number(payload.sell_amount);
      const converted = Number(payload.buy_amount);
      const rate = Number(payload.rate);

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("currencycloud_contact_id", contactId)
        .maybeSingle();

      if (profile) {
        await (supabaseAdmin as any).from("exchange_orders").insert({
          user_id: profile.id,
          from_currency: from,
          to_currency: to,
          from_amount: amount,
          to_amount: converted,
          rate,
          status: "completed",
        });

        const { data: fromWallet } = await supabaseAdmin
          .from("fiat_wallets")
          .select("id, balance")
          .eq("user_id", profile.id)
          .eq("currency", from)
          .maybeSingle();

        const { data: toWallet } = await supabaseAdmin
          .from("fiat_wallets")
          .select("id, balance")
          .eq("user_id", profile.id)
          .eq("currency", to)
          .maybeSingle();

        if (fromWallet) {
          const next = Math.max(0, Number(fromWallet.balance) - amount);
          await supabaseAdmin
            .from("fiat_wallets")
            .update({ balance: next, available_balance: next })
            .eq("id", fromWallet.id);
        }

        if (toWallet) {
          const next = Math.max(0, Number(toWallet.balance) + converted);
          await supabaseAdmin
            .from("fiat_wallets")
            .update({ balance: next, available_balance: next })
            .eq("id", toWallet.id);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/webhooks/unit") {
        return await handleUnitWebhook(request);
      }
      if (url.pathname === "/api/webhooks/currencycloud") {
        return await handleCurrencycloudWebhook(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
