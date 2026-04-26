const micButton = document.getElementById("micButton");
const commandForm = document.getElementById("commandForm");
const commandInput = document.getElementById("commandInput");
const commandLog = document.getElementById("commandLog");
const statusText = document.getElementById("statusText");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

// Add a message to the command log so the user can see the full conversation.
function addLogEntry(speaker, message) {
  const entry = document.createElement("div");
  entry.className = `log-entry ${speaker === "You" ? "user-entry" : "jarvis-entry"}`;

  const speakerLabel = document.createElement("span");
  speakerLabel.className = "speaker";
  speakerLabel.textContent = speaker;

  const text = document.createElement("p");
  text.textContent = message;

  entry.appendChild(speakerLabel);
  entry.appendChild(text);
  commandLog.appendChild(entry);
  commandLog.scrollTop = commandLog.scrollHeight;
}

function setStatus(message) {
  statusText.textContent = message;
}

// Read JARVIS responses out loud through the browser's speech engine.
function speakReply(message) {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

// Send a command to the backend and let the server decide whether it is allowed.
async function sendCommand(command) {
  const cleanedCommand = command.trim();

  if (!cleanedCommand) {
    addLogEntry("JARVIS", "Please say or type a command first.");
    speakReply("Please say or type a command first.");
    setStatus("Waiting for input");
    return;
  }

  setStatus("Processing command...");

  try {
    const response = await fetch("/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ command: cleanedCommand })
    });

    const data = await response.json();
    addLogEntry("JARVIS", data.reply);
    speakReply(data.reply);

    if (response.ok) {
      setStatus("Command completed");
    } else {
      setStatus("Command rejected");
    }
  } catch (error) {
    console.error("Network error:", error);
    const errorReply = "I had trouble reaching the server.";
    addLogEntry("JARVIS", errorReply);
    speakReply(errorReply);
    setStatus("Server error");
  }
}

function stopListeningVisuals() {
  isListening = false;
  micButton.classList.remove("listening");
  micButton.setAttribute("aria-label", "Start listening");
}

if (SpeechRecognition) {
  // Create one speech recognizer instance and reuse it for each microphone click.
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    micButton.classList.add("listening");
    micButton.setAttribute("aria-label", "Stop listening");
    setStatus("Listening...");
  };

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    commandInput.value = spokenText;
    addLogEntry("You", spokenText);
    sendCommand(spokenText);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);

    if (event.error === "not-allowed") {
      addLogEntry("JARVIS", "Microphone access was blocked. Please allow microphone permission.");
      speakReply("Microphone access was blocked. Please allow microphone permission.");
      setStatus("Microphone blocked");
    } else if (event.error !== "aborted") {
      addLogEntry("JARVIS", "I couldn't hear that clearly. Please try again.");
      speakReply("I couldn't hear that clearly. Please try again.");
      setStatus("Listening failed");
    }
  };

  recognition.onend = () => {
    stopListeningVisuals();

    if (statusText.textContent === "Listening...") {
      setStatus("Standing by");
    }
  };
} else {
  micButton.disabled = true;
  micButton.classList.add("disabled");
  addLogEntry(
    "JARVIS",
    "Speech recognition is not supported in this browser. Please use a recent version of Chrome or Edge."
  );
  setStatus("Voice unavailable");
}

micButton.addEventListener("click", () => {
  if (!recognition) {
    return;
  }

  if (isListening) {
    recognition.stop();
    return;
  }

  recognition.start();
});

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const typedCommand = commandInput.value.trim();

  if (!typedCommand) {
    return;
  }

  addLogEntry("You", typedCommand);
  sendCommand(typedCommand);
  commandInput.value = "";
});
