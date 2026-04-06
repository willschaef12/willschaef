"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/editforge/utils";

interface FileDropzoneProps {
  title: string;
  description: string;
  accept: string;
  helper: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

export function FileDropzone({
  title,
  description,
  accept,
  helper,
  multiple = false,
  disabled = false,
  onFiles
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handOffFiles(fileList: FileList | null) {
    if (!fileList || disabled) {
      return;
    }

    onFiles(Array.from(fileList));
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-[1.6rem] border border-dashed px-6 py-8 transition duration-200",
        isDragging
          ? "border-[rgba(255,107,44,0.65)] bg-[rgba(255,107,44,0.08)]"
          : "border-white/10 bg-white/[0.03]",
        disabled && "cursor-not-allowed opacity-60"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handOffFiles(event.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-start gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[var(--forge-accent-soft)]">
          <UploadCloud className="h-6 w-6" />
        </div>

        <div>
          <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled}>
            Browse files
          </Button>
          <span className="text-sm text-slate-500">{helper}</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handOffFiles(event.target.files)}
      />
    </div>
  );
}
