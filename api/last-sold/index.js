const ISO_DATE = () => new Date().toISOString().slice(0, 10);

function parseBoolean(value){
  if (typeof value === "boolean") return value;
  if (typeof value === "string"){
    if (/^(true|yes|1)$/i.test(value)) return true;
    if (/^(false|no|0)$/i.test(value)) return false;
  }
  return null;
}

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

  const body = req.body || {};
  const query = (body.query || req.query?.q || "").toString().trim();
  if (!query) {
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing 'query' value." }
    };
    return;
  }

  const graded = parseBoolean(body.graded ?? req.query?.graded);
  const details = {
    category: (body.category || req.query?.category || "").toString().trim(),
    title: (body.title || req.query?.title || "").toString().trim(),
    year: (body.year || req.query?.year || "").toString().trim(),
    setOrSeries: (body.setOrSeries || req.query?.setOrSeries || "").toString().trim(),
    issueOrPlayer: (body.issueOrPlayer || req.query?.issueOrPlayer || "").toString().trim(),
    gradeCompany: (body.gradeCompany || req.query?.gradeCompany || "").toString().trim(),
    gradeValue: (body.gradeValue || req.query?.gradeValue || "").toString().trim(),
    graded
  };

  const detailLines = [];
  if (details.category) detailLines.push(`Category: ${details.category}`);
  if (details.title) detailLines.push(`Item: ${details.title}`);
  if (details.year) detailLines.push(`Year: ${details.year}`);
  if (details.issueOrPlayer) detailLines.push(`Issue/Player: ${details.issueOrPlayer}`);
  if (details.setOrSeries) detailLines.push(`Set/Series: ${details.setOrSeries}`);
  if (details.graded !== null) detailLines.push(`Graded: ${details.graded ? "Yes" : "No"}`);
  if (details.gradeCompany || details.gradeValue) {
    detailLines.push(`Grade Detail: ${[details.gradeCompany, details.gradeValue].filter(Boolean).join(" ")}`);
  }

  const detailSummary = detailLines.length ? detailLines.join("\n") : "Not provided.";

  const messages = [
    {
      role: "system",
      content: "You are a collectibles market analyst. Estimate realistic sold prices based on comparable sales from major marketplaces."
    },
    {
      role: "user",
      content: [
        "Estimate the most recent market sale price for the collectible below and respond with JSON only.",
        "Schema:",
        "{",
        '  "title": string,',
        '  "price": number (USD),',
        '  "currency": "USD" | another ISO code,',
        '  "soldDate": string (YYYY-MM-DD),',
        '  "source": string,',
        '  "url"?: string,',
        '  "notes"?: string',
        "}",
        "Rules:",
        "- Use realistic pricing backed by comparable sales (reference them briefly in notes).",
        "- If unsure, provide the best estimate with a short confidence note.",
        "- soldDate should reflect the approximate recency of the comparable data.",
        "- Leave out url if you don't have one.",
        "- Price must be a plain number, not a string.",
        "",
        `Query: ${query}`,
        "Details:",
        detailSummary
      ].join("\n")
    }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.35,
        max_tokens: 700,
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

    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: { error: "Model returned no content" }
      };
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: { error: "Model returned invalid JSON" }
      };
      return;
    }

    const price = Number(parsed.price);
    if (!Number.isFinite(price)) {
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: { error: "Model did not provide a numeric price" }
      };
      return;
    }

    const soldDate = parsed.soldDate ? new Date(parsed.soldDate) : null;
    const safe = {
      title: parsed.title ? String(parsed.title) : query,
      price,
      currency: parsed.currency ? String(parsed.currency).toUpperCase().slice(0, 8) : "USD",
      soldDate: soldDate && !isNaN(soldDate.valueOf()) ? soldDate.toISOString().slice(0, 10) : ISO_DATE(),
      source: parsed.source ? String(parsed.source) : "AI Estimate",
      url: parsed.url ? String(parsed.url) : undefined,
      notes: parsed.notes ? String(parsed.notes) : undefined
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
      body: { error: "Server error while generating price estimate" }
    };
  }
};
