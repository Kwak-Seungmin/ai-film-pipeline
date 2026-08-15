---
name: img2video
description: Converts cut images into clips via a video generation backend, then upscales to 1920×1080 and writes to project/final/videos/.
tools: Bash, Read, Write
---

# img2video

Turns a still cut into a moving clip.

## Role

- Loads cut images from `project/final/frames/`
- Generates a clip through the configured backend
- Upscales to 1920×1080 with FFmpeg
- Writes `project/final/videos/scene{N}_cut{M}.mp4`

## Resolution handling

Generation resolution is fixed by the backend and rarely matches delivery, so the flow is generate →
upscale:

- Input frame: `project/final/frames/scene{N}_cut{M}_hd.png` at 1920×1080
- Resize down to the backend's supported size before submitting
- Upscale the result: `scale=1920:1080:flags=lanczos`

Check the backend's supported sizes and durations before planning shot length.

## Choosing a backend

| Backend | Quality | Duration | Notes |
|---|---|---|---|
| Hosted, high-end | best | fixed set | supports pinning the first frame via a reference image |
| Hosted, mid-tier | good | fixed | content filters are stricter on violence |
| Local | varies | flexible | no API cost, slower, needs a GPU |

All backends sit behind the same interface in `tools/video/`, so swapping one does not affect the
stages around it.

## Example — hosted backend with a first-frame reference

```python
import openai
from PIL import Image

client = openai.OpenAI()

# resize the delivery frame down to the backend's supported input size
img = Image.open("sceneXX_cutYY_hd.png").resize((1792, 1024), Image.LANCZOS)
img.save("/tmp/input.png")

with open("/tmp/input.png", "rb") as f:
    job = client.videos.create(
        model="<model>",
        prompt="...",
        input_reference=f,
        seconds=8,
        size="1792x1024",
    )
video = client.videos.poll(job.id, poll_interval_ms=10000)
client.videos.download_content(video.id).write_to_file("/tmp/raw.mp4")

# upscale to delivery resolution
import subprocess
subprocess.run([
    "ffmpeg", "-y", "-i", "/tmp/raw.mp4",
    "-vf", "scale=1920:1080:flags=lanczos",
    "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "output.mp4"
], check=True)
```

## Example — CLI backend

```bash
upload_id=$(<cli> upload create sceneXX.png --json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
job_id=$(<cli> generate create <model> --prompt "..." --image $upload_id --json | python3 -c "import sys,json; print(json.load(sys.stdin)[0])")
<cli> generate wait $job_id --timeout 15m --json --quiet
```

## Notes

- Concurrency limits are per plan, not per key — parallel submission has to respect them or jobs
  queue silently
- Content filters block violent imagery on some backends; fall back to a text prompt without the
  reference image
- Always write with `-pix_fmt yuv420p -movflags +faststart` for QuickTime compatibility
- Per-scene prompts and image paths come from `project/plan/film_plan.md`
