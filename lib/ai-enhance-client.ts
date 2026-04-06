import {
  BASIC_SLIDERS,
  COLOR_SLIDERS,
  DETAIL_SLIDERS,
  EditPatch,
  EditSettings
} from "@/lib/editor-defaults";

export const DEFAULT_AI_ENHANCE_MODEL = "gpt-4.1-mini";

export const AI_ENHANCE_KEYS = [
  "exposure",
  "contrast",
  "highlights",
  "shadows",
  "whites",
  "blacks",
  "temperature",
  "tint",
  "vibrance",
  "saturation",
  "clarity",
  "dehaze",
  "sharpness",
  "noiseReduction"
] as const;

type AiEnhanceKey = (typeof AI_ENHANCE_KEYS)[number];

type AiEnhanceSettings = Pick<EditSettings, AiEnhanceKey>;

interface AiEnhanceResponsePayload {
  summary: string;
  observations: string[];
  settings: AiEnhanceSettings;
}

interface ChatCompletionSuccessResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
      refusal?: string | null;
    };
  }>;
}

interface ChatCompletionErrorResponse {
  error?: {
    message?: string;
  };
}

export interface AiEnhanceResult {
  model: string;
  summary: string;
  observations: string[];
  settings: EditPatch;
}

const AI_ENHANCE_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string"
    },
    observations: {
      type: "array",
      items: {
        type: "string"
      },
      minItems: 1,
      maxItems: 4
    },
    settings: {
      type: "object",
      properties: {
        exposure: { type: "number" },
        contrast: { type: "number" },
        highlights: { type: "number" },
        shadows: { type: "number" },
        whites: { type: "number" },
        blacks: { type: "number" },
        temperature: { type: "number" },
        tint: { type: "number" },
        vibrance: { type: "number" },
        saturation: { type: "number" },
        clarity: { type: "number" },
        dehaze: { type: "number" },
        sharpness: { type: "number" },
        noiseReduction: { type: "number" }
      },
      required: [...AI_ENHANCE_KEYS],
      additionalProperties: false
    }
  },
  required: ["summary", "observations", "settings"],
  additionalProperties: false
} as const;

const sliderRangeByKey = new Map(
  [...BASIC_SLIDERS, ...COLOR_SLIDERS, ...DETAIL_SLIDERS].map((slider) => [slider.key, slider])
);

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampSettingValue(key: AiEnhanceKey, rawValue: number) {
  const slider = sliderRangeByKey.get(key);

  if (!slider) {
    return rawValue;
  }

  return roundToStep(clamp(rawValue, slider.min, slider.max), slider.step);
}

function readMessageContent(content: string | Array<{ type?: string; text?: string }> | undefined) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => (typeof item.text === "string" ? item.text : ""))
    .join("")
    .trim();
}

function serializeCurrentSettings(settings: EditSettings): AiEnhanceSettings {
  return {
    exposure: settings.exposure,
    contrast: settings.contrast,
    highlights: settings.highlights,
    shadows: settings.shadows,
    whites: settings.whites,
    blacks: settings.blacks,
    temperature: settings.temperature,
    tint: settings.tint,
    vibrance: settings.vibrance,
    saturation: settings.saturation,
    clarity: settings.clarity,
    dehaze: settings.dehaze,
    sharpness: settings.sharpness,
    noiseReduction: settings.noiseReduction
  };
}

function formatSliderRanges() {
  return AI_ENHANCE_KEYS.map((key) => {
    const slider = sliderRangeByKey.get(key);

    if (!slider) {
      return key;
    }

    return `${key}: ${slider.min} to ${slider.max}`;
  }).join(", ");
}

function normalizePayload(payload: AiEnhanceResponsePayload): AiEnhanceResult {
  const settings = AI_ENHANCE_KEYS.reduce<EditPatch>((patch, key) => {
    patch[key] = clampSettingValue(key, Number(payload.settings[key]));
    return patch;
  }, {});

  return {
    model: DEFAULT_AI_ENHANCE_MODEL,
    summary: payload.summary.trim(),
    observations: payload.observations.map((item) => item.trim()).filter(Boolean).slice(0, 4),
    settings
  };
}

export async function requestAiEnhance({
  apiKey,
  imageDataUrl,
  currentSettings
}: {
  apiKey: string;
  imageDataUrl: string;
  currentSettings: EditSettings;
}): Promise<AiEnhanceResult> {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    throw new Error("No OpenAI API key is available for AI Enhance.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${trimmedKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_AI_ENHANCE_MODEL,
      store: false,
      messages: [
        {
          role: "system",
          content:
            "You are an expert aviation photo editor working in a slider-based editor. Analyze the attached current edited image and recommend the final slider values that would improve it the most while keeping the result natural. Preserve composition and geometry. Protect highlights, keep detail in the aircraft, avoid muddy shadows, avoid oversaturation, avoid halos, and balance sharpness with noise reduction. Return final values, not deltas."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "The attached image is the current edited preview, not the untouched source.",
                `Current slider values: ${JSON.stringify(serializeCurrentSettings(currentSettings))}.`,
                `Allowed slider ranges: ${formatSliderRanges()}.`,
                "Return concise observations plus the exact final slider values that should be applied."
              ].join("\n")
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "skyroom_ai_enhance",
          strict: true,
          schema: AI_ENHANCE_SCHEMA
        }
      },
      max_tokens: 500
    })
  });

  const payload = (await response.json()) as ChatCompletionSuccessResponse & ChatCompletionErrorResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "OpenAI rejected the AI Enhance request.");
  }

  const choice = payload.choices?.[0];
  const message = choice?.message;

  if (!choice || !message) {
    throw new Error("OpenAI returned an empty AI Enhance response.");
  }

  if (choice.finish_reason === "length") {
    throw new Error("The AI Enhance response was truncated before it finished.");
  }

  if (message.refusal) {
    throw new Error(message.refusal);
  }

  const rawContent = readMessageContent(message.content);

  if (!rawContent) {
    throw new Error("OpenAI returned no structured AI Enhance payload.");
  }

  return normalizePayload(JSON.parse(rawContent) as AiEnhanceResponsePayload);
}
