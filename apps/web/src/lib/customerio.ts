const TRACK_URL = "https://track.customer.io/api/v1";

export const BENCHMARK_NEWSLETTER_TOPIC = 5;
export const SUBSCRIBE_EVENT = "dbarena_subscribed";

export type ProfileAttributes = Record<string, string | boolean | number>;

function credentials() {
  const siteId = process.env.CUSTOMERIO_SITE_ID;
  const apiKey = process.env.CUSTOMERIO_API_KEY;
  if (!siteId || !apiKey) {
    throw new Error("Customer.io credentials not configured");
  }
  return { siteId, apiKey };
}

function authHeader(siteId: string, apiKey: string) {
  return `Basic ${Buffer.from(`${siteId}:${apiKey}`).toString("base64")}`;
}

async function trackFetch(
  path: string,
  method: "PUT" | "POST",
  body: Record<string, unknown>,
) {
  const { siteId, apiKey } = credentials();
  const response = await fetch(`${TRACK_URL}${path}`, {
    method,
    headers: {
      Authorization: authHeader(siteId, apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Customer.io request failed: ${response.status}`);
  }
}

export async function subscribeToBenchmarkNewsletter(
  email: string,
  attributes: ProfileAttributes = {},
): Promise<void> {
  await trackFetch(`/customers/${encodeURIComponent(email)}`, "PUT", {
    email,
    ...attributes,
    [`cio_subscription_preferences.topics.topic_${BENCHMARK_NEWSLETTER_TOPIC}`]:
      true,
  });
}

export async function trackSubscribeEvent(
  email: string,
  data: ProfileAttributes = {},
): Promise<void> {
  await trackFetch(`/customers/${encodeURIComponent(email)}/events`, "POST", {
    name: SUBSCRIBE_EVENT,
    timestamp: Math.floor(Date.now() / 1000),
    data: {
      source: "dbarena.com",
      topic: BENCHMARK_NEWSLETTER_TOPIC,
      topic_name: "Benchmark Newsletter",
      ...data,
    },
  });
}
