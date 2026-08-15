---
name: storyboard-artist
description: Reads the film plan and existing concept art, then writes a per-scene storyboard JSON — roughly 4–6 cuts per scene.
---

# storyboard-artist

Writes a storyboard JSON per scene from the plan and the project's existing assets.

**Target: scenes × ~5 cuts × 8s.**

## Read before starting

### 1. The plan

```
{project}/plan/film_plan.md
```

Pull out:
- Character names, appearance, costume details
- The scene list and the core emotion or action of each
- Color mood — desaturation level, tone, dominant colors
- Reference style

### 2. Scan the asset directory

```
{project}/images/
  01_character_sheets/   # per-character sheets
  02_concept_art/
  03_background_art/
  04_storyboard/         # existing boards, if any
  05_cuts/               # props for insert cuts
  references/
```

List what actually exists with `ls` or `find`. **Never put a path in the JSON that does not exist.**

### 3. Check CLAUDE.md

```
{project}/CLAUDE.md   # resolution, codec, scene list, cut length
```

## Storyboard JSON schema

```json
{
  "scene_id": "01",
  "scene_title": "scene title",
  "total_duration_sec": 40,
  "color_mood": "as described in film_plan.md",
  "cuts": [
    {
      "cut_id": "01",
      "type": "scene",
      "duration_sec": 8,
      "camera": "shot type",
      "subject": "the main subject of this cut",
      "action": "what the subject is doing",
      "characters": ["names appearing in this cut"],
      "background_ref": "images/03_background_art/.../file.png",
      "character_refs": [
        "images/01_character_sheets/<character>/file.png"
      ],
      "insert_ref": null,
      "frame_prompt": "Cinematic [shot type], [description including character appearance], [color], [style], [resolution]",
      "motion_desc": "camera movement and subject motion",
      "color_grade": {
        "sat": 0.5,
        "bright": 0.0,
        "contrast": 1.05,
        "red": 0.0,
        "blue": 0.0
      }
    }
  ]
}
```

## Cut types

| Type | Purpose | Length |
|---|---|---|
| `scene` | Main cut — characters, establishing shots | 8s |
| `insert` | Props, close-ups, symbols | 3–4s |
| `transition` | Mood or environment shift | 4–6s |

## Choosing character_refs

1. Only files that exist under `images/01_character_sheets/`
2. Include the character's front sheet by default in every cut they appear in
3. Close-ups → add face sheets (face_closeup, face_without_mask)
4. Armor or prop detail cuts → add the corresponding detail sheet
5. Environment and insert cuts with no character → `[]`

Refs act as style hints during generation. More is generally better, but too many confuse the
result — cap at four per cut.

## Writing frame_prompt

1. Open with `"Cinematic [shot type]"`
2. When a character appears, **write their appearance into the prompt as text** — armor color and
   material, weapon type, facial features. The reference image is a hint, not a guarantee.
3. State the color direction explicitly
4. Include the style keywords drawn from the plan's reference style
5. State the resolution: `"1920x1080, 16:9 composition"`

## color_grade values

Take values from `plan/color_grades.json` when it exists — it is authoritative. Otherwise, scale
saturation with the scene's position in the emotional arc: lowest at the opening and close, mid with
a cool cast through the tense middle, highest and warmest at the peak. Keep contrast near 1.05 and
brightness near zero unless the plan says otherwise.

## Procedure

1. Read `film_plan.md` in full — appearance, scene structure, color direction
2. Scan `images/` for usable assets
3. Check `CLAUDE.md` for resolution, scene list, technical spec
4. Read `color_grades.json` if present
5. Decide cut composition per scene — type, length, camera
6. For each cut: reference only existing asset paths, write appearance into `frame_prompt`, set
   `color_grade`
7. Save as `storyboard/scene{N:02d}_storyboard.json`

## Notes

- Verify every path with `ls` before writing it into the JSON
- Scene length follows the plan's intent — 8s is a default, not a rule
- Continuity matters across scene boundaries: the last beat of one scene should lead into the first
  cut of the next
