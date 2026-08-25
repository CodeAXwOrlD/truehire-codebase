import crypto from "node:crypto";
import { env } from "../config/env";

export async function callScoringService<T>(
  path: string,
  method: "GET" | "POST" = "POST",
  body?: any
): Promise<{ data: T | null; error: string | null }> {
  const timestamp = Date.now().toString();
  const bodyString = body ? JSON.stringify(body) : "";
  const message = `${timestamp}.${bodyString}`;
  const signature = crypto
    .createHmac("sha256", env.serviceSharedSecret)
    .update(message)
    .digest("hex");

  try {
    const res = await fetch(`${env.scoringServiceUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-service-timestamp": timestamp,
        "x-service-signature": signature,
      },
      body: method === "POST" ? bodyString : undefined,
    });

    const json = (await res.json()) as { data: T | null; error: string | null };
    return json;
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to reach scoring service" };
  }
}
