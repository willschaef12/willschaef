module.exports = async function (context, req) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Server not configured: missing OPENAI_API_KEY" }
    };
    return;
  }

  const game = (req.query?.game || req.body?.game || "").toString().trim();
  const level = (req.query?.level || req.body?.level || "").toString().trim();
  if (!game || !level) {
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing 'game' or 'level' parameter." }
    };
    return;
  }

  try {
    const messages = [
      {
        role: "system",
        content: [
          "You are an expert video game guide writer.",
          "Return a concise, actionable walkthrough for the specified game and level/quest.",
          "Use clear steps that a player can follow. Keep spoilers minimal.",
          "If the game/level is ambiguous, assume the most common interpretation and proceed.",
        ].join(" ")
      },
      {
        role: "user",
        content: `Create a JSON guide for the game and level below.\n\nGame: ${game}\nLevel/Quest/Mission: ${level}\n\nRules:\n- Output MUST be a single JSON object only, no extra text.\n- Schema:\n  {\n    \"game\": string,\n    \"level\": string,\n    \"steps\": string[] (5-15 concise steps),\n    \"tips\"?: string[] (optional, 0-6 items),\n    \"boss\"?: { \"name\": string, \"hp\"?: number, \"phases\"?: string[] } (optional)\n  }\n- Keep steps specific and do-able (what to do, where, how).\n- If no boss, omit the boss field.\n- Avoid major spoilers.\n- Prefer widely applicable strategies over niche exploits.`
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      context.res = {
        status: response.status,
        headers: { "Content-Type": "application/json" },
        body: { error: data?.error?.message || "OpenAI API error" }
      };
      return;
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: { error: "No content returned from model" }
      };
      return;
    }

    let guide;
    try {
      guide = JSON.parse(text);
    } catch (e) {
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: { error: "Model returned invalid JSON" }
      };
      return;
    }

    // Basic validation & normalization
    if (!Array.isArray(guide.steps) || !guide.steps.length) {
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: { error: "Guide missing steps" }
      };
      return;
    }

    const safe = {
      game: String(guide.game || game),
      level: String(guide.level || level),
      steps: guide.steps.map(s => String(s)).slice(0, 20),
      tips: Array.isArray(guide.tips) ? guide.tips.map(t => String(t)).slice(0, 8) : undefined,
      boss: guide.boss && (guide.boss.name || guide.boss.hp || (guide.boss.phases && guide.boss.phases.length))
        ? {
            name: guide.boss.name ? String(guide.boss.name) : undefined,
            hp: typeof guide.boss.hp === 'number' ? guide.boss.hp : (Number.isFinite(Number(guide.boss.hp)) ? Number(guide.boss.hp) : undefined),
            phases: Array.isArray(guide.boss.phases) ? guide.boss.phases.map(p => String(p)).slice(0, 10) : undefined,
          }
        : undefined
    };

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: safe
    };
  } catch (err) {
    context.log?.error?.(err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Server error while generating guide" }
    };
  }
};

