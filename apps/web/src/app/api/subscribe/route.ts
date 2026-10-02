import {
  subscribeToBenchmarkNewsletter,
  trackSubscribeEvent,
} from "@/lib/customerio";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const email = readString(record.email).toLowerCase();
  if (!EMAIL.test(email)) {
    return Response.json({ message: "Invalid email address" }, { status: 422 });
  }

  const firstName = readString(record.firstName);
  const lastName = readString(record.lastName);
  const company = readString(record.company);
  const title = readString(record.title);
  const attributes: Record<string, string> = { source: "dbarena.com" };
  if (firstName) attributes.first_name = firstName;
  if (lastName) attributes.last_name = lastName;
  if (company) attributes.company = company;
  if (title) attributes.title = title;

  try {
    await subscribeToBenchmarkNewsletter(email, attributes);
  } catch (error) {
    console.error("Subscribe failed:", error);
    return Response.json({ message: "Subscription failed" }, { status: 500 });
  }

  try {
    await trackSubscribeEvent(email, attributes);
  } catch (error) {
    console.error("Subscribe event tracking failed:", error);
  }

  return Response.json({ message: "Subscription successful" });
}
