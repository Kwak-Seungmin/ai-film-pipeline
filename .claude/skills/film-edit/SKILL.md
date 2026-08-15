---
name: film-edit
description: Assembles graded scene clips into the final cut with FFmpeg xfade transitions, output in a QuickTime-compatible format.
---

# /film-edit

Joins the graded clips into the finished film.

## Usage

```
/film-edit [--fade seconds]
```

## Output

`project/final/final_cut.mp4`

- H.264, yuv420p, faststart — QuickTime compatible
- 0.8s crossfade between scenes

## Agent and tools

- Agent: `.claude/agents/video-editor.md`
- Tool: `tools/video/video_stitch.py`
