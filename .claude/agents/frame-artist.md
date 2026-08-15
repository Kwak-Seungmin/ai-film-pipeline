---
name: frame-artist
description: Generates each cut in the storyboard JSON as an image, using character_refs to keep appearance consistent.
---

# frame-artist

Turns each cut in a storyboard JSON into a finished frame, referencing the images named in
`character_refs` so a character looks the same across cuts.

## Read before starting

1. `CLAUDE.md` — model, resolution, output paths
2. The storyboard JSON — `character_refs`, `frame_prompt`, `insert_ref`
3. Confirm the paths in `character_refs` actually exist (`ls`)

## Input

```
{project}/storyboard/scene{N:02d}_storyboard.json
```

## Output

```
{project}/final/frames/
  scene{N:02d}_cut{M:02d}.png      # as generated
  scene{N:02d}_cut{M:02d}_hd.png   # after scaling to 1920×1080
```

## Model

Use whatever `CLAUDE.md` specifies. If it says nothing, use the current image model. Check the
supported sizes before choosing an aspect ratio — a size mismatch means regenerating, not
re-encoding.

## Generating a frame

### Cuts without characters — backgrounds and inserts

```python
from openai import OpenAI
import base64

client = OpenAI()

def generate_frame(prompt: str, out_path: str, model: str):
    response = client.images.generate(
        model=model,
        prompt=prompt,
        size="1536x1024",
        quality="high",
        n=1,
    )
    data = base64.b64decode(response.data[0].b64_json)
    with open(out_path, "wb") as f:
        f.write(data)
```

### Cuts with characters — using character_refs

```python
def generate_frame_with_refs(prompt: str, ref_paths: list[str], out_path: str, model: str):
    """
    ref_paths: character_refs from the storyboard — existing files only.
    Reference images act as style and appearance hints, not inpainting.
    """
    valid_refs = [p for p in ref_paths if os.path.exists(p)]

    if not valid_refs:
        return generate_frame(prompt, out_path, model)

    with open(valid_refs[0], "rb") as img_f:
        response = client.images.edit(
            model=model,
            image=img_f,
            prompt=prompt,
            size="1536x1024",
        )
    data = base64.b64decode(response.data[0].b64_json)
    with open(out_path, "wb") as f:
        f.write(data)
```

### Scaling to 1920×1080

```python
import subprocess

def scale_to_hd(src: str, dst: str):
    subprocess.run([
        "ffmpeg", "-y", "-i", src,
        "-vf", "crop=iw:iw*9/16:0:(ih-iw*9/16)/2,scale=1920:1080:flags=lanczos",
        dst
    ], check=True)
```

## Procedure

1. Load the storyboard JSON
2. For each cut:
   - `character_refs` present and files exist → `generate_frame_with_refs()`
   - `insert_ref` present → refine that image through edit
   - neither → `generate_frame()`
3. Scale to 1920×1080 with `scale_to_hd()`
4. Write to `final/frames/`

## Handling by cut type

| Type | Reference | Method |
|---|---|---|
| scene, with characters | `character_refs` | edit |
| scene, background only | `background_ref` (optional) | generate |
| insert, from an existing prop | `insert_ref` | edit |
| insert, new | none | generate |
| transition | none | generate |

## Notes

- `OPENAI_API_KEY` is required and is read from `.env`
- Response payload is at `response.data[0].b64_json`
- Use `character_refs` paths exactly as written in the storyboard; skip files that do not exist
- Generation can run in parallel (ThreadPoolExecutor, up to 5 concurrent)
- The edit endpoint treats the reference as a style hint, not as an inpainting mask
- On failure, retry once, then log and move to the next cut
