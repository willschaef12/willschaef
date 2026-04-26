const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const open = require("open");

const app = express();
// The app is intentionally fixed to port 3000 to match the project requirements.
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (_request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

// These commands are safe because they only open a few known websites.
const WEBSITE_COMMANDS = {
  "open youtube": {
    url: "https://www.youtube.com",
    reply: "Opening YouTube."
  },
  "open google": {
    url: "https://www.google.com",
    reply: "Opening Google."
  },
  "open gmail": {
    url: "https://mail.google.com",
    reply: "Opening Gmail."
  }
};

// Wrap child_process.exec in a Promise so we can use async/await.
function runExec(command) {
  return new Promise((resolve, reject) => {
    exec(command, { windowsHide: true }, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function quoteForCmd(target) {
  return `"${target.replace(/"/g, '\\"')}"`;
}

// Windows uses the "start" command to launch desktop apps.
function buildWindowsStartCommand(target, isPathCommand = false) {
  const safeTarget = isPathCommand ? target : quoteForCmd(target);
  return `cmd /c start "" ${safeTarget}`;
}

function getVsCodeCommands() {
  const possiblePaths = [
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Microsoft VS Code", "Code.exe"),
    path.join(process.env.PROGRAMFILES || "", "Microsoft VS Code", "Code.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "", "Microsoft VS Code", "Code.exe")
  ].filter(Boolean);

  const installedCommands = possiblePaths
    .filter((candidatePath) => fs.existsSync(candidatePath))
    .map((installedPath) => buildWindowsStartCommand(installedPath));

  // If the user enabled the VS Code shell command, this is a useful fallback.
  return [...installedCommands, "cmd /c code -n"];
}

function getRobloxStudioCommands() {
  const versionsDirectory = path.join(
    process.env.LOCALAPPDATA || "",
    "Roblox",
    "Versions"
  );

  if (!fs.existsSync(versionsDirectory)) {
    return [];
  }

  const installedVersions = fs
    .readdirSync(versionsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const executablePath = path.join(
        versionsDirectory,
        entry.name,
        "RobloxStudioBeta.exe"
      );

      if (!fs.existsSync(executablePath)) {
        return null;
      }

      return {
        executablePath,
        modifiedTime: fs.statSync(executablePath).mtimeMs
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.modifiedTime - left.modifiedTime);

  return installedVersions.map((version) => buildWindowsStartCommand(version.executablePath));
}

// Try a list of approved launch commands until one works.
async function runFirstSuccessfulCommand(commands) {
  let lastError = null;

  for (const command of commands) {
    try {
      await runExec(command);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No approved app launcher was available.");
}

const APP_COMMANDS = {
  "open vs code": {
    reply: "Opening Visual Studio Code.",
    buildCommands: getVsCodeCommands
  },
  "open roblox studio": {
    reply: "Opening Roblox Studio.",
    buildCommands: getRobloxStudioCommands
  }
};

async function handleCommand(rawCommand) {
  const cleanedCommand = rawCommand.trim();
  const normalizedCommand = cleanedCommand.toLowerCase();

  if (WEBSITE_COMMANDS[normalizedCommand]) {
    const website = WEBSITE_COMMANDS[normalizedCommand];
    await open(website.url);
    return website.reply;
  }

  if (normalizedCommand.startsWith("search for ")) {
    const searchQuery = cleanedCommand.slice("search for ".length).trim();

    if (!searchQuery) {
      return "Please tell me what you want to search for.";
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    await open(searchUrl);
    return `Searching Google for ${searchQuery}.`;
  }

  if (APP_COMMANDS[normalizedCommand]) {
    const appCommand = APP_COMMANDS[normalizedCommand];
    const approvedCommands = appCommand.buildCommands();

    if (approvedCommands.length === 0) {
      throw new Error("The requested desktop app could not be found.");
    }

    await runFirstSuccessfulCommand(approvedCommands);
    return appCommand.reply;
  }

  return "I don't recognize that command";
}

// The backend accepts one command string and returns the reply for the UI to show and speak.
app.post("/command", async (request, response) => {
  const rawCommand = typeof request.body.command === "string" ? request.body.command : "";

  if (!rawCommand.trim()) {
    response.status(400).json({
      ok: false,
      reply: "Please say or type a command first."
    });
    return;
  }

  try {
    const reply = await handleCommand(rawCommand);
    const knownCommand = reply !== "I don't recognize that command";

    response.status(knownCommand ? 200 : 400).json({
      ok: knownCommand,
      reply
    });
  } catch (error) {
    console.error("Command handling failed:", error);
    response.status(500).json({
      ok: false,
      reply: "I had trouble opening that app. Please make sure it is installed."
    });
  }
});

// Keep API errors consistent so the frontend always receives JSON.
app.use((error, _request, response, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({
      ok: false,
      reply: "The request body was not valid JSON."
    });
    return;
  }

  next(error);
});

app.listen(PORT, () => {
  console.log(`JARVIS is running at http://localhost:${PORT}`);
});
