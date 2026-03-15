"use client";

import { useEffect } from "react";

interface ShortcutOptions {
  enabled: boolean;
  undo: () => void;
  redo: () => void;
  resetAll: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  toggleBeforeAfter: (next?: boolean) => void;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.dataset.ignoreShortcuts === "true") {
    return true;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function useEditorShortcuts({
  enabled,
  undo,
  redo,
  resetAll,
  zoomIn,
  zoomOut,
  fitToScreen,
  toggleBeforeAfter
}: ShortcutOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let holdingSpace = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey;

      if (event.code === "Space" && !isTypingTarget(event.target)) {
        event.preventDefault();

        if (!holdingSpace) {
          holdingSpace = true;
          toggleBeforeAfter(true);
        }

        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (hasModifier && event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }

        return;
      }

      if (hasModifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        zoomIn();
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomOut();
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        fitToScreen();
        return;
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleBeforeAfter();
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetAll();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && holdingSpace) {
        holdingSpace = false;
        toggleBeforeAfter(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, fitToScreen, redo, resetAll, toggleBeforeAfter, undo, zoomIn, zoomOut]);
}
