import type { Metadata } from "next";

import { EditorWorkbench } from "@/components/editor/editor-workbench";

export const metadata: Metadata = {
  title: "Editor",
  description: "Upload clips, choose an edit profile, and export a finished EditForge MP4."
};

export default function EditorPage() {
  return <EditorWorkbench />;
}
