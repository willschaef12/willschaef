import { EditorApp } from "@/components/editor/editor-app";
import { EditorProvider } from "@/components/editor/editor-provider";

export const dynamic = "force-dynamic";

export default function Page() {
  const injectedOpenAiKey = process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? null;

  return (
    <EditorProvider>
      <EditorApp injectedOpenAiKey={injectedOpenAiKey} />
    </EditorProvider>
  );
}
