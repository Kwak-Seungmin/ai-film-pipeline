---
name: film-pipeline
description: Runs the whole production pipeline end to end — storyboard, cut images, video generation, grading, edit, and review.
---

# /film-pipeline

Invoking this skill runs the workflow script:

```
Workflow({ scriptPath: ".claude/workflows/film-pipeline.js" })
```

## Stages

| Phase | Agent | Input | Output |
|---|---|---|---|
| Storyboard | storyboard-artist × scenes | `film_plan.md` + concept art | `storyboard/*.json` |
| Frame art | frame-artist × cuts | storyboard JSON | `final/frames/*_hd.png` (1920×1080) |
| Production | img2video × cuts | `frames/*.png` | `final/videos/*.mp4` (1920×1080) |
| Color grade | color-grader × scenes | `final/videos/` | `final/graded/*.mp4` |
| Edit | video-editor | `final/graded/` | `final/final_cut_v2.mp4` |
| QA | film-critic | final cut + plan | `final/review_report.md` |

Each phase runs only after the previous one completes, so a defect surfaces at the stage that can
explain it rather than travelling downstream as valid input.

## Deliverables

- `project/final/final_cut_v2.mp4` — 1920×1080
- `project/final/review_report.md` — review against the plan

## Related files

- Workflow: `.claude/workflows/film-pipeline.js`
- Agents: `storyboard-artist.md`, `frame-artist.md`, `img2video.md`, `color-grader.md`, `video-editor.md`, `film-critic.md`
- Plan: `project/plan/film_plan.md`
- Color parameters: `project/plan/color_grades.json`
