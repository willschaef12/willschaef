import { EditorApp } from "@/components/editor/editor-app";
import { EditorProvider } from "@/components/editor/editor-provider";

export default function Page() {
  return (
    <EditorProvider>
      <EditorApp />
    </EditorProvider>
  );
}
