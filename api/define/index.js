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

  const word = (req.query?.word || req.body?.word || "").toString().trim();
  if (!word) {
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing 'word' parameter." }
    };
    return;
  }

  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a friendly dictionary. Define the given word in 1–2 very short, simple sentences at CEFR A2 level. No examples, no extra notes. If it is slang or an acronym, mention that briefly."
      },
      {
        role: "user",
        content: `Define: "${word}"`
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
        temperature: 0.2,
        max_tokens: 120,
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

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: { word, definition: text }
    };
  } catch (err) {
    context.log.error(err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Server error while generating definition" }
    };
  }
};

