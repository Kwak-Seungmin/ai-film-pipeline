# AI Film Pipeline

An agent pipeline that carries scene images through video generation and color grading to a
finished, edited film.

```
scene reference images
   └─▶ img2video       generate a clip per scene
        └─▶ color-grader   grade each scene against a planned color chart
             └─▶ video-editor   crossfade the scenes into a final cut
```

## Why it is split into agents

Each stage has a different failure mode, so each is a separate agent with its own brief. Video
generation fails on motion and framing; grading fails on continuity across scenes; editing fails on
pacing and transitions. Keeping them apart means a defect is caught by the stage that understands it,
instead of being carried forward as someone else's input.

## Components

| Kind | Name | Role |
|---|---|---|
| Agent | `img2video` | Turns a scene reference image into a clip |
| Agent | `color-grader` | Applies the planned grade for that scene |
| Agent | `video-editor` | Assembles scenes with transitions into the final cut |
| Agent | `frame-artist` | Produces and fixes individual frames |
| Agent | `storyboard-artist` | Lays out shots before generation |
| Agent | `film-critic` | Reviews the result and reports what to redo |
| Skill | `film-pipeline` | Runs the whole sequence end to end |
| Skill | `film-generate` · `film-grade` · `film-edit` | Individual stages, run on their own |
| Skill | `cinematic` | Director roles covering idea, research, proposal, script, scene, asset, composition, edit, and publish |

## Tools

| Area | Tools |
|---|---|
| Video generation | `tools/video/sora_video.py`, `higgsfield_video.py`, `ltx_video_local.py` |
| Post | `tools/enhancement/color_grade.py`, `tools/video/video_stitch.py` |
| Utilities | `scripts/download_scenes.py`, `check_video_status.py`, `inspect_video.py`, `mix_audio.py`, `stitch_final.py`, `generate_bgm.py` |
| Infrastructure | `tools/base_tool.py`, `tool_registry.py`, `cost_tracker.py` |

Generation backends are interchangeable — each is a thin wrapper behind a shared interface, so a
model can be swapped without touching the stages around it. `cost_tracker.py` records spend per run,
since the generation stage is where cost concentrates.

## Planning the grade before generating

Color is decided per scene ahead of time and the grading stage applies that plan rather than
improvising per clip. Planning it up front is what keeps a sequence coherent — an arc that starts
desaturated, recovers saturation through the middle, peaks warm, and closes desaturated again reads
as intentional only if every scene was graded against the same chart.

## Output

- 1920×1080
- Fixed scene length with crossfade transitions
- H.264 (yuv420p), QuickTime compatible

## Running

Invoke the pipeline skill to run everything, or run a stage on its own. Each tool documents its
usage in its header docstring.

Set the API keys for whichever backends you intend to use as environment variables — they are read
from the environment, and none are stored in this repository.

## Scope

This repository contains the pipeline itself — agents, skills, and the tools they call. Project
files and generated footage from any particular film are not included.
