const DEFAULT_OPENAI_BASE_URL = process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_PEDAGOGICO_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
const DEFAULT_TEMPERATURE =
  process.env.OPENAI_PEDAGOGICO_TEMPERATURE != null
    ? Number(process.env.OPENAI_PEDAGOGICO_TEMPERATURE)
    : 0.25;

const normalizeMessages = (prompt = {}) => {
  if (Array.isArray(prompt.messages) && prompt.messages.length) {
    return prompt.messages;
  }
  const messages = [];
  if (prompt.system) {
    messages.push({ role: "system", content: prompt.system });
  }
  if (prompt.user) {
    messages.push({ role: "user", content: prompt.user });
  }
  return messages;
};

export const requestInformeIA = async (prompt = {}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY no está configurada");
    error.status = 500;
    throw error;
  }

  if (typeof fetch !== "function") {
    const error = new Error("fetch no está disponible en el entorno de ejecución");
    error.status = 500;
    throw error;
  }

  const baseUrl = DEFAULT_OPENAI_BASE_URL.replace(/\/$/, "");
  const url = `${baseUrl}/chat/completions`;
  const messages = normalizeMessages(prompt);

  const body = {
    model: prompt.model || DEFAULT_OPENAI_MODEL,
    temperature: Number.isFinite(DEFAULT_TEMPERATURE) ? DEFAULT_TEMPERATURE : 0.25,
    messages,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  }).catch((error) => {
    const err = new Error(`No se pudo contactar la API de IA: ${error.message}`);
    err.status = 502;
    throw err;
  });

  const raw = await response.json().catch(() => null);
  if (!response.ok) {
    const err = new Error(raw?.error?.message || "Error al generar el informe con IA");
    err.status = response.status || 502;
    err.details = raw?.error;
    throw err;
  }

  const texto = raw?.choices?.[0]?.message?.content?.trim() || null;

  return {
    texto,
    modelo: raw?.model || body.model,
    id_respuesta: raw?.id,
    tokens: raw?.usage || null,
    raw,
  };
};
