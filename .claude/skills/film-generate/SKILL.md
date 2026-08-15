---
name: film-generate
description: Generates clips from scene images using the img2video agent, writing to project/final/videos/.
---

# /film-generate

Converts the scene images in `project/images/04_scenes/` into clips.

## Usage

```
/film-generate [scene-number|all] [backend]
```

## Examples

```
/film-generate all hosted        # every scene on the hosted backend
/film-generate 04 local          # scene 04 only, locally
/film-generate 01 02 03 hosted   # scenes 01–03
```

## Agent and tools

- Agent: `.claude/agents/img2video.md`
- Tools: `tools/video/sora_video.py`, `tools/video/higgsfield_video.py`, `tools/video/ltx_video_local.py`
- Scene prompts: `project/plan/film_plan.md`
