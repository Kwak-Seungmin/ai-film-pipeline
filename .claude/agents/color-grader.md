---
name: color-grader
description: Applies per-scene color grading according to the project's planned color curve, using tools/enhancement/color_grade.py or FFmpeg eq/colorbalance filters.
tools: Bash, Read
---

# color-grader

Applies the planned grade to each scene.

## Role

- Reads from `project/final/videos/` (1920×1080)
- Applies the per-scene parameters in `project/plan/color_grades.json`
- Writes to `project/final/graded/`, preserving 1920×1080

## Grading against a planned curve

Color is decided in the plan file before generation, not improvised per clip. Read the curve from
the project plan and apply it — do not invent values here. A typical arc moves through phases like
these, but the actual numbers always come from the project:

| Phase | Saturation | Intent |
|---|---|---|
| Opening | low | establishes tone before the story turns |
| Rising | mid, cool cast | tension |
| Peak | high, warm | the emotional high point |
| Close | low again | returns the frame to where it started |

If `color_grades.json` exists, it is authoritative. The table above is only a shape.

## FFmpeg command

```bash
ffmpeg -y -i input.mp4 \
  -vf "eq=brightness={bright}:contrast={contrast}:saturation={sat},
       colorbalance=rs={red}:gs=0:bs={blue}:rm={red*0.5}:gm=0:bm={blue*0.5}:rh={red*0.3}:gh=0:bh={blue*0.3}" \
  -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
  -c:a copy output.mp4
```

## Existing tool

For richer LUT-based grading, see the `ColorGrade` class in `tools/enhancement/color_grade.py`.
