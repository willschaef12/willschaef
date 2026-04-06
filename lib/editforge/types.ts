export type OutputFormat = "vertical" | "horizontal" | "square";
export type EditStyle = "fast" | "cinematic" | "smooth" | "hype";
export type ClipOrdering = "upload" | "random";
export type JobState = "queued" | "processing" | "completed" | "failed";

export interface EditRequestOptions {
  outputFormat: OutputFormat;
  editStyle: EditStyle;
  clipOrdering: ClipOrdering;
}

export interface OutputFormatSpec {
  id: OutputFormat;
  label: string;
  aspectRatioLabel: string;
  width: number;
  height: number;
  description: string;
}

export interface EditStyleSpec {
  id: EditStyle;
  label: string;
  description: string;
  cadenceLabel: string;
  baseSegmentSeconds: number;
  variationSeconds: number;
  minSegmentSeconds: number;
  maxSegmentSeconds: number;
}

export interface ClipOrderingSpec {
  id: ClipOrdering;
  label: string;
  description: string;
}

export interface EditJobStatus {
  jobId: string;
  state: JobState;
  progress: number;
  stage: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  options: EditRequestOptions;
  input: {
    clipCount: number;
    totalClipBytes: number;
    audioBytes: number;
    audioFileName: string;
  };
  output?: {
    fileName: string;
    downloadUrl: string;
    sizeBytes: number;
    durationSeconds: number;
    width: number;
    height: number;
  };
  error?: string;
}

export interface StoredUploadFile {
  originalName: string;
  storedName: string;
  absolutePath: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StoredJobManifest {
  jobId: string;
  createdAt: string;
  options: EditRequestOptions;
  clips: StoredUploadFile[];
  audio: StoredUploadFile;
}

export interface ProbedClip extends StoredUploadFile {
  durationSeconds: number;
}

export interface TimelineSegment {
  segmentIndex: number;
  sourcePath: string;
  sourceName: string;
  startSeconds: number;
  durationSeconds: number;
  outputPath: string;
}
