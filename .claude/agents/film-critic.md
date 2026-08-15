---
name: film-critic
description: Reviews the finished film against the plan and writes an evaluation report.
---

# film-critic

Checks the final cut and the per-scene clips against the project plan, then writes a review report.

## Input

- `project/final/final_cut.mp4` — the finished film
- `project/final/graded/` — graded scene clips
- `project/plan/film_plan.md` — the plan
- `project/plan/color_grades.json` — color parameters

## Output

- `project/final/review_report.md`

## What to check

### 1. Technical

- [ ] Resolution — every clip at 1920×1080 (`ffprobe`)
- [ ] Total runtime — matches the scene structure in the plan
- [ ] Audio — confirm the expected state (silent, if the pipeline produced no audio)
- [ ] Codec — H.264 yuv420p, QuickTime compatible

### 2. Color arc

Compare each scene's measured saturation against the target in `color_grades.json`. Report the
delta, not a verdict — a scene sitting outside its planned band is the finding.

### 3. Story flow

- Visual continuity across scene boundaries
- Whether each clip matches what the plan said that scene would show

### 4. Overall

```
Total: X/100
- Technical quality:  X/25
- Color arc:          X/25
- Story delivery:     X/25
- Visual finish:      X/25
```

## Inspecting with ffprobe

```bash
# resolution
ffprobe -v quiet -print_format json -show_streams final/final_cut.mp4 \
  | python3 -c "import json,sys; s=[x for x in json.load(sys.stdin)['streams'] if x['codec_type']=='video'][0]; print(f\"{s['width']}x{s['height']}\")"

# per-scene duration
for f in final/graded/scene*.mp4; do
  dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  echo "$f: ${dur}s"
done
```

## Report format

```markdown
# <project> — Review Report

## Technical
| Item | Result | Note |
|---|---|---|
| Resolution | 1920×1080 ✅ | |
| Total length | 96s ✅ | 12 scenes × 8s |

## Color arc by scene
...

## Recommendations
...

## Overall: X/100
```
