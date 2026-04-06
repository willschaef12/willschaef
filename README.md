# EditForge

EditForge is a polished full-stack Next.js MVP that turns multiple uploaded video clips plus one audio track into an exported MP4. The app includes a marketing site, a production-style editor workflow, secure file handling, FFmpeg orchestration, job polling, and downloadable output.

## Stack

- Next.js App Router
- React 19 + TypeScript
- Tailwind CSS
- Next.js route handlers for the backend API
- FFmpeg + FFprobe for media processing

## What the MVP does

- Landing page with hero, features, pricing mockup, FAQ, and footer
- Editor page with drag-and-drop uploads for multiple clips and one soundtrack
- Client-side validation for supported file types and file sizes
- Output presets for vertical `9:16`, horizontal `16:9`, and square `1:1`
- Edit styles for `Fast`, `Cinematic`, `Smooth`, and `Hype`
- Clip ordering controls for upload order or randomized ordering
- Background render job creation with polling-based status updates
- FFmpeg pipeline that:
  - probes audio and clip durations
  - trims and repeats clips to cover the audio duration
  - normalizes clips to a shared resolution and frame rate
  - concatenates the generated timeline
  - overlays the uploaded soundtrack
  - exports a downloadable MP4
- Cleanup of uploaded and intermediate files after successful renders
- TTL-based cleanup for stale job folders

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Install FFmpeg and FFprobe

EditForge expects `ffmpeg` and `ffprobe` to be available on your machine.

- Windows: install FFmpeg and ensure both binaries are available on `PATH`
- macOS: `brew install ffmpeg`
- Ubuntu/Debian: `sudo apt-get install ffmpeg`

If you prefer custom paths, copy `.env.example` to `.env.local` and set:

```bash
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

### 3. Optional environment overrides

```bash
EDITFORGE_STORAGE_DIR=.editforge
EDITFORGE_MAX_VIDEO_MB=300
EDITFORGE_MAX_AUDIO_MB=80
EDITFORGE_JOB_TTL_MINUTES=120
```

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Render pipeline summary

1. The editor posts clips, audio, and render options to `POST /api/edit-jobs`.
2. The backend writes the files into an isolated job folder under `.editforge/<jobId>/`.
3. The job status is initialized and the FFmpeg render pipeline starts in the background.
4. The pipeline probes media durations, builds a timeline based on the selected style, renders normalized segments, concatenates them, and overlays the soundtrack.
5. The frontend polls `GET /api/edit-jobs/:jobId` until the job finishes.
6. The completed file is streamed from `GET /api/edit-jobs/:jobId/download`.

## Project structure

```text
app/
  api/edit-jobs/                  Render creation, status polling, downloads
  editor/page.tsx                 Editor route
  globals.css                     Global theme and utility styling
  layout.tsx                      Root layout and fonts
  page.tsx                        Landing page
components/
  editor/                         Upload UI and editor workbench
  marketing/                      Landing page sections
  ui/                             Shared UI primitives
lib/editforge/
  constants.ts                    Shared app constants and option specs
  types.ts                        Shared types
  utils.ts                        UI and render helpers
  server/
    binaries.ts                   FFmpeg / FFprobe path resolution
    media.ts                      Process execution and ffprobe helpers
    pipeline.ts                   End-to-end render orchestration
    status.ts                     Job status persistence
    storage.ts                    Job folders, manifests, cleanup
    validation.ts                 Upload and request validation
scripts/
  prepare-standalone.mjs          Copies static assets for standalone builds
```

## Notes and next steps

- The current edit styles change pacing and timeline behavior, not semantic shot selection.
- Uploads are handled through route handlers using `request.formData()`, which is suitable for a local MVP but should move to streamed multipart handling for very large files.
- If you want smarter editing later, the cleanest extensions are beat detection, scene scoring, and cloud-backed job workers.
