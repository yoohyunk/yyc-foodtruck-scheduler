// Translation utility for server-side use only
// Uses Azure Translator API

export interface TranslationResult {
  text: string;
}

export async function translateText({
  text,
  to,
  from,
}: {
  text: string;
  to: string;
  from?: string;
}): Promise<TranslationResult> {
  const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
  const AZURE_TRANSLATOR_ENDPOINT =
    process.env.AZURE_TRANSLATOR_ENDPOINT ||
    "https://api.cognitive.microsofttranslator.com";
  const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;

  if (!AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION) {
    throw new Error(
      "Missing Azure Translator API credentials in environment variables."
    );
  }

  const url = `${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=${to}${from ? `&from=${from}` : ""}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
      "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ Text: text }]),
  });

  if (!response.ok) {
    throw new Error(
      `Translation API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  if (data && data[0] && data[0].translations && data[0].translations[0]) {
    return { text: data[0].translations[0].text };
  }
  throw new Error("Unexpected response from translation API");
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "uk", name: "Ukrainian" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
];
