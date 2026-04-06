"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState
} from "react";

import {
  cloneSettings,
  DEFAULT_SETTINGS,
  EditPatch,
  EditSettings,
  HISTORY_LIMIT,
  mergeSettings,
  normalizeRotation,
  settingsEqual,
  SourceImage
} from "@/lib/editor-defaults";
import { buildPresetSettings, SKYROOM_PRESETS } from "@/lib/editor-presets";

interface HistoryEntry {
  label: string;
  settings: EditSettings;
  timestamp: number;
}

interface EditorState {
  sourceImage: SourceImage | null;
  settings: EditSettings;
  activePreset: string | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
}

interface EditorContextValue {
  state: EditorState;
  setSourceImage: (image: SourceImage | null) => void;
  clearImage: () => void;
  updateSettings: (patch: EditPatch) => void;
  beginInteraction: () => void;
  commitInteraction: (label?: string) => void;
  undo: () => void;
  redo: () => void;
  resetAll: () => void;
  rotateBy: (degrees: number) => void;
  applyPreset: (presetId: string) => void;
}

type EditorAction =
  | { type: "HYDRATE"; payload: { settings: EditSettings; activePreset: string | null } }
  | { type: "SET_SOURCE_IMAGE"; payload: SourceImage | null }
  | { type: "UPDATE_SETTINGS"; payload: EditPatch }
  | { type: "COMMIT_HISTORY"; payload: { before: EditSettings; label: string } }
  | { type: "APPLY_SETTINGS"; payload: { next: EditSettings; label: string; activePreset: string | null } }
  | { type: "UNDO" }
  | { type: "REDO" };

const STORAGE_KEY = "skyroom.session";

const initialState: EditorState = {
  sourceImage: null,
  settings: cloneSettings(DEFAULT_SETTINGS),
  activePreset: null,
  past: [],
  future: []
};

const EditorContext = createContext<EditorContextValue | null>(null);

function createHistoryEntry(label: string, settings: EditSettings): HistoryEntry {
  return {
    label,
    settings: cloneSettings(settings),
    timestamp: Date.now()
  };
}

function trimHistory(entries: HistoryEntry[]) {
  return entries.length > HISTORY_LIMIT ? entries.slice(entries.length - HISTORY_LIMIT) : entries;
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        settings: cloneSettings(action.payload.settings),
        activePreset: action.payload.activePreset
      };
    case "SET_SOURCE_IMAGE":
      return {
        sourceImage: action.payload,
        settings: state.sourceImage ? cloneSettings(DEFAULT_SETTINGS) : state.settings,
        activePreset: state.sourceImage ? null : state.activePreset,
        past: [],
        future: []
      };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: mergeSettings(state.settings, action.payload),
        activePreset: null
      };
    case "COMMIT_HISTORY":
      if (settingsEqual(action.payload.before, state.settings)) {
        return state;
      }

      return {
        ...state,
        past: trimHistory([...state.past, createHistoryEntry(action.payload.label, action.payload.before)]),
        future: []
      };
    case "APPLY_SETTINGS":
      if (settingsEqual(state.settings, action.payload.next)) {
        return state;
      }

      return {
        ...state,
        settings: cloneSettings(action.payload.next),
        activePreset: action.payload.activePreset,
        past: trimHistory([...state.past, createHistoryEntry(action.payload.label, state.settings)]),
        future: []
      };
    case "UNDO": {
      const previous = state.past.at(-1);
      if (!previous) {
        return state;
      }

      return {
        ...state,
        settings: cloneSettings(previous.settings),
        past: state.past.slice(0, -1),
        future: [createHistoryEntry(previous.label, state.settings), ...state.future]
      };
    }
    case "REDO": {
      const next = state.future[0];
      if (!next) {
        return state;
      }

      return {
        ...state,
        settings: cloneSettings(next.settings),
        past: trimHistory([...state.past, createHistoryEntry(next.label, state.settings)]),
        future: state.future.slice(1)
      };
    }
    default:
      return state;
  }
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const interactionStartRef = useRef<EditSettings | null>(null);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<{
        settings: Partial<EditSettings>;
        activePreset: string | null;
      }>;

      if (!parsed.settings) {
        return;
      }

      const hydrated = mergeSettings(DEFAULT_SETTINGS, parsed.settings);

      dispatch({
        type: "HYDRATE",
        payload: {
          settings: hydrated,
          activePreset: parsed.activePreset ?? null
        }
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasHydratedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: state.settings,
        activePreset: state.activePreset,
        savedAt: Date.now()
      })
    );
  }, [hasHydratedStorage, state.activePreset, state.settings]);

  useEffect(() => {
    return () => {
      if (state.sourceImage?.url.startsWith("blob:")) {
        URL.revokeObjectURL(state.sourceImage.url);
      }
    };
  }, [state.sourceImage]);

  const value: EditorContextValue = {
    state,
    setSourceImage(image) {
      interactionStartRef.current = null;
      dispatch({ type: "SET_SOURCE_IMAGE", payload: image });
    },
    clearImage() {
      interactionStartRef.current = null;
      dispatch({ type: "SET_SOURCE_IMAGE", payload: null });
    },
    updateSettings(patch) {
      dispatch({ type: "UPDATE_SETTINGS", payload: patch });
    },
    beginInteraction() {
      if (!interactionStartRef.current) {
        interactionStartRef.current = cloneSettings(state.settings);
      }
    },
    commitInteraction(label = "Adjustments") {
      if (!interactionStartRef.current) {
        return;
      }

      dispatch({
        type: "COMMIT_HISTORY",
        payload: {
          before: interactionStartRef.current,
          label
        }
      });
      interactionStartRef.current = null;
    },
    undo() {
      interactionStartRef.current = null;
      dispatch({ type: "UNDO" });
    },
    redo() {
      interactionStartRef.current = null;
      dispatch({ type: "REDO" });
    },
    resetAll() {
      interactionStartRef.current = null;
      dispatch({
        type: "APPLY_SETTINGS",
        payload: {
          next: cloneSettings(DEFAULT_SETTINGS),
          label: "Reset All",
          activePreset: null
        }
      });
    },
    rotateBy(degrees) {
      interactionStartRef.current = null;
      dispatch({
        type: "APPLY_SETTINGS",
        payload: {
          next: {
            ...state.settings,
            rotation: normalizeRotation(state.settings.rotation + degrees),
            crop: { ...state.settings.crop }
          },
          label: degrees > 0 ? "Rotate Right" : "Rotate Left",
          activePreset: state.activePreset
        }
      });
    },
    applyPreset(presetId) {
      const preset = SKYROOM_PRESETS.find((entry) => entry.id === presetId);
      if (!preset) {
        return;
      }

      interactionStartRef.current = null;
      dispatch({
        type: "APPLY_SETTINGS",
        payload: {
          next: buildPresetSettings(preset.patch, state.settings),
          label: preset.name,
          activePreset: preset.id
        }
      });
    }
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const value = useContext(EditorContext);

  if (!value) {
    throw new Error("useEditor must be used inside EditorProvider.");
  }

  return value;
}
