import { SourceImage } from "@/lib/editor-defaults";

export function Filmstrip({
  sourceImage,
  activePreset
}: {
  sourceImage: SourceImage | null;
  activePreset: string | null;
}) {
  return (
    <section className="rounded-chrome border border-white/10 bg-[linear-gradient(180deg,rgba(18,26,37,0.94),rgba(8,13,20,0.9))] px-4 py-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Filmstrip</p>
          <p className="mt-2 text-sm text-slate-300">Starter placeholder for future multi-photo projects.</p>
        </div>
        <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
          {activePreset ? `Preset: ${activePreset}` : "No preset"}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="min-w-[180px] rounded-[1.3rem] border border-sky-300/25 bg-sky-300/10 p-3">
          <div className="h-24 overflow-hidden rounded-[1rem] border border-white/8 bg-black/30">
            {sourceImage ? (
              <img src={sourceImage.url} alt={sourceImage.fileName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.24em] text-slate-500">Awaiting import</div>
            )}
          </div>
          <p className="mt-3 text-sm font-medium text-slate-100">{sourceImage?.fileName ?? "Primary slot"}</p>
          <p className="mt-1 text-xs text-slate-400">Current editable frame</p>
        </div>

        <div className="min-w-[180px] rounded-[1.3rem] border border-dashed border-white/10 bg-white/[0.03] p-3">
          <div className="flex h-24 items-center justify-center rounded-[1rem] border border-dashed border-white/10 text-xs uppercase tracking-[0.24em] text-slate-500">
            More photos soon
          </div>
          <p className="mt-3 text-sm font-medium text-slate-100">Batch queue</p>
          <p className="mt-1 text-xs text-slate-400">Future multi-photo sequence support</p>
        </div>

        <div className="min-w-[180px] rounded-[1.3rem] border border-dashed border-white/10 bg-white/[0.03] p-3">
          <div className="flex h-24 items-center justify-center rounded-[1rem] border border-dashed border-white/10 text-xs uppercase tracking-[0.24em] text-slate-500">
            Selective masks
          </div>
          <p className="mt-3 text-sm font-medium text-slate-100">Brush stack</p>
          <p className="mt-1 text-xs text-slate-400">Reserved for mask layers and local AI tools</p>
        </div>
      </div>
    </section>
  );
}
