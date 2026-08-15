# AI Film Pipeline

Scene images in, a graded and edited film out. This file is the working reference for the agents.

## Pipeline

```
concept art + film plan
  → [storyboard-artist]  storyboard JSON + storyboard images
  → [frame-artist]       final frames per cut (1920×1080)
  → [img2video]          a clip per cut
  → [color-grader]       graded clips
  → [video-editor]       assembled final cut
  → [film-critic]        review report against the plan
```

## Output spec

- **Resolution**: 1920×1080
- **Scene length**: fixed per project, typically 8s
- **Transition**: 0.8s crossfade
- **Codec**: H.264 (yuv420p) — `-pix_fmt yuv420p -movflags +faststart` is required for QuickTime
- **Upscaling**: `ffmpeg -vf scale=1920:1080:flags=lanczos`

Generation sizes differ per backend and are normalized on the way out:

| Stage | Generated | Final |
|---|---|---|
| Storyboard / cut images | 1536×1024 | 16:9 crop → 1920×1080 |
| Video generation | 1792×1024 | upscale to 1920×1080 |
| Final output | 1920×1080 | native |

## Planning color before generating

Color is decided per scene before generation begins, and the grading stage applies that plan rather
than deciding per clip. A typical arc opens desaturated, recovers saturation through the middle,
peaks warm at the turning point, and closes desaturated again — which only reads as intentional if
every scene was graded against the same chart.

Keep the chart in the project's plan file, not in the agent prompts.

## Agents

| Agent | Role |
|---|---|
| `storyboard-artist` | Plan and images → storyboard JSON and boards |
| `frame-artist` | Storyboard cut → finished frame |
| `img2video` | Image → clip |
| `color-grader` | Apply the scene's planned grade |
| `video-editor` | Assemble and transition into the final cut |
| `film-critic` | Review the result against the plan and report what to redo |

## Skills

| Skill | Scope |
|---|---|
| `/film-generate` | Scene images → clips |
| `/film-grade` | Apply per-scene grading |
| `/film-edit` | Graded clips → final cut |
| `/film-pipeline` | The whole sequence in one run |
| `/cinematic` | Director roles from idea through publish |

## Backend notes

Generation backends sit behind a shared interface and can be swapped per project. Points worth
knowing when choosing one:

- Video models accept a fixed set of resolutions and durations — check both before planning shot
  length, since a mismatch forces a re-render rather than a re-encode.
- Some models gate first-and-last-frame conditioning; the wrapper rejects unsupported combinations
  locally rather than spending an API round-trip to find out.
- Content filters vary by provider and are stricter on violence than on other categories, which
  matters when planning action scenes.
- Concurrency limits are per plan, not per key — parallel submission needs to respect them or jobs
  silently queue.

## Cost

`cost_tracker.py` records spend per run. Generation dominates the total, so it is worth logging
before scaling up a shot list.
