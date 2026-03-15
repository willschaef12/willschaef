# Skyroom

Skyroom is a Lightroom-inspired starter product for aviation and helicopter photography. It runs as a Next.js app, keeps edits non-destructive in memory, renders preview changes through a browser canvas pipeline, supports undo/redo, before/after compare, presets, and export, and includes a placeholder backend route for future AI enhancement work.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Context-based editor state with undo/redo history
- Canvas-based preview and export rendering

## Features

- Dark, Lightroom-style editor shell with left import rail, center preview stage, right control rail, and bottom filmstrip placeholder
- Real working sliders for exposure, contrast, highlights, shadows, whites, blacks, temperature, tint, vibrance, saturation, clarity, dehaze, sharpness, and noise reduction
- Crop, rotate, straighten, reset all, undo, redo, before/after, side-by-side compare, zoom, and fit-to-screen
- Built-in presets: Clear Sky, Golden Hour, Aircraft Pop, Helicopter Detail, Cool Overcast, Spotter Sharp, Soft Neutral
- Drag-and-drop upload with file validation and clear error states
- JPG and PNG export with adjustable JPG quality
- Histogram panel, keyboard shortcuts, local autosave of slider state, history stack, and mask/brush placeholder
- Placeholder AI Enhance modal and backend route at `/api/ai-enhance`

## Local Install

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open `http://localhost:3000`.

4. Import a `.jpg`, `.jpeg`, `.png`, or `.webp` file.

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## File Structure

```text
app/
  api/ai-enhance/route.ts      Placeholder future AI route
  globals.css                  Tailwind entry + global visual system
  layout.tsx                   Root layout
  page.tsx                     App entry
components/editor/
  editor-app.tsx               Main client shell and modal/export orchestration
  editor-provider.tsx          Context state, history stack, autosave, presets
  filmstrip.tsx                Bottom tray placeholder
  left-sidebar.tsx             Upload panel and photo metadata
  preview-stage.tsx            Canvas preview and compare rendering
  right-sidebar.tsx            Histogram, presets, sliders, crop, geometry
  top-bar.tsx                  Project actions
  ui.tsx                       Shared UI primitives
hooks/
  use-editor-shortcuts.ts      Keyboard shortcuts
lib/
  editor-defaults.ts           Types, defaults, slider definitions
  editor-presets.ts            Built-in presets
  file-helpers.ts              Validation, image loading, downloads
  image-pipeline.ts            Canvas render pipeline
```

## How Editor State Works

- `EditorProvider` stores the current source image, the active `settings` object, the active preset id, and `past` / `future` stacks for undo and redo.
- Slider changes update the live `settings` object immediately for smooth preview feedback.
- History is committed when a slider interaction ends, so the UI stays responsive without losing undo granularity.
- The original uploaded image is preserved via the object URL in `sourceImage`; only the edit state changes.
- Slider state is autosaved to local storage in `skyroom.session`, then restored on the next visit.

## Rendering Pipeline

The rendering pipeline lives in [`lib/image-pipeline.ts`](./lib/image-pipeline.ts).

1. Compute the crop rectangle from the non-destructive crop percentages.
2. Draw the cropped source image into a working canvas, downscaled for preview but full-size for export.
3. Read `ImageData` from that working canvas.
4. Apply tonal and color adjustments in code: exposure, contrast, highlight/shadow shaping, whites/blacks, white balance, vibrance, saturation, and dehaze.
5. Apply local-contrast and cleanup passes: clarity, noise reduction, and sharpness.
6. Write the processed pixels back to the working canvas.
7. Apply rotation and straighten on a final output canvas.
8. Return the rendered canvas plus histogram data for the sidebar.

Preview renders are intentionally downscaled for responsiveness. Export renders bypass that preview limit and rebuild from the original source dimensions.

## Preset Customization

Built-in presets live in [`lib/editor-presets.ts`](./lib/editor-presets.ts).

- Add a new preset object to `SKYROOM_PRESETS`
- Tune the `patch` values for the sliders you want to control
- The preset system resets tonal sliders to defaults but preserves crop and geometry

## AI Hook

- Frontend placeholder: the `AI Enhance` button in the top bar opens a modal
- Backend placeholder: [`app/api/ai-enhance/route.ts`](./app/api/ai-enhance/route.ts)
- Replace the `POST` handler with your real enhancement provider
- The best handoff point is after upload and before export, using the current `sourceImage` plus `settings`

## Deployment

The simplest deployment target is Vercel.

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Use the default Next.js build settings.
4. Add any future AI provider secrets to the project environment variables.

You can also deploy anywhere that supports a standard Next.js Node runtime.
