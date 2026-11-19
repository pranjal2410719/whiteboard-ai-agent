import { fail } from "@/lib/store";
import { TutorError, providerConfig, serverKey, validateProviderKey, type Provider, type TabKeys } from "@/lib/tutor";

export const maxDuration = 60;
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const provider: Provider = body.provider === "openai" ? "openai" : "gemini";
  const supplied = typeof body.key === "string" ? body.key.trim() : "";
  const key = supplied || serverKey(provider);
  if (key.length > 1000) return fail("Enter a valid API key.");
  if (!key) return fail(`Enter your ${provider === "gemini" ? "Gemini" : "OpenAI"} API key first.`);
  try {
    const result = await validateProviderKey(provider, key);
    return Response.json({ connected: true, provider, model: result.model, source: supplied ? "tab" : "server" });
  } catch (error) {
    if (error instanceof TutorError) return fail(error.message, error.status >= 500 ? 502 : error.status);
    return fail("Could not reach the model provider. Check your network connection and try again.", 502);
  }
}

export async function GET(request: Request) {
  const keys: TabKeys = { gemini: request.headers.get("x-gemini-key"), openai: request.headers.get("x-openai-key") };
  const config = providerConfig(keys);
  return Response.json({ connected: Boolean(config.key), provider: config.provider, model: config.model, source: keys.gemini || keys.openai ? "tab" : "server" });
}
