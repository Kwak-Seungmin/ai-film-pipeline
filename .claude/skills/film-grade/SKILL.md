---
name: film-grade
description: Applies color grading to generated scene clips using the parameters in project/plan/color_grades.json.
---

# /film-grade

Applies the planned grade to each scene clip.

## Usage

```
/film-grade [scene-number|all]
```

## Where the values come from

`project/plan/color_grades.json` is authoritative. The grade is planned before generation so the
sequence reads as one arc rather than a series of independently corrected clips — typically lowest
saturation at the opening and close, a cool cast through the tense middle, and the warmest, most
saturated point at the emotional peak.

## Agent and tools

- Agent: `.claude/agents/color-grader.md`
- Parameters: `project/plan/color_grades.json`
- Tool: `tools/enhancement/color_grade.py`
