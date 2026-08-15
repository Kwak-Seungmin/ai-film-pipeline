export const meta = {
  name: 'film-pipeline',
  description: 'Full production pipeline — storyboard through final review',
  phases: [
    { title: 'Storyboard', detail: 'Storyboard JSON per scene (4–6 cuts each)' },
    { title: 'Frame Art', detail: 'One image per cut, with character references injected (1920×1080)' },
    { title: 'Production', detail: 'One clip per cut, upscaled to 1920×1080' },
    { title: 'Color Grade', detail: 'Apply the planned grade per scene' },
    { title: 'Edit', detail: 'Assemble the final cut' },
    { title: 'QA', detail: 'Review against the plan' },
  ],
}

// Scene list for the project being produced. Read this from the plan when adapting.
const SCENES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

const STORYBOARD_SCHEMA = {
  type: 'object',
  required: ['scene_id', 'total_duration_sec', 'cuts'],
  properties: {
    scene_id: { type: 'string' },
    title: { type: 'string' },
    total_duration_sec: { type: 'number' },
    color_mood: { type: 'string' },
    cuts: {
      type: 'array',
      minItems: 4,
      maxItems: 7,
      items: {
        type: 'object',
        required: ['cut_id', 'type', 'duration_sec', 'frame_prompt'],
        properties: {
          cut_id: { type: 'string' },
          type: { type: 'string', enum: ['scene', 'insert', 'transition'] },
          duration_sec: { type: 'number' },
          camera: { type: 'string' },
          subject: { type: 'string' },
          action: { type: 'string' },
          characters: { type: 'array', items: { type: 'string' } },
          background_ref: { type: 'string' },
          character_refs: { type: 'array', items: { type: 'string' } },
          insert_ref: { type: 'string' },
          frame_prompt: { type: 'string' },
          motion_desc: { type: 'string' },
        },
      },
    },
  },
}

// ─── Phase 1: Storyboard ───────────────────────────────────────────────────
phase('Storyboard')
log(`Building storyboards for ${SCENES.length} scenes (4–6 cuts each)`)

const storyboards = await parallel(
  SCENES.map(scene => () =>
    agent(
      `Build the storyboard for scene ${scene}.

      Required references:
      - project/plan/film_plan.md (the scene ${scene} section)
      - project/plan/color_grades.json (scene ${scene} color)
      - project/images/01_character_sheets/
      - project/images/03_background_art/
      - project/images/05_cuts/action_cuts/

      Rules:
      - 4–6 cuts per scene, mixing scene / insert / transition types
      - scene cuts 8s, insert cuts 3–4s, transition cuts 4–6s
      - every cut with a character must list that character's sheet in character_refs
      - follow .claude/agents/storyboard-artist.md
      - save to project/storyboard/scene${scene}_storyboard.json
      - return structured output`,
      {
        label: `storyboard:scene${scene}`,
        phase: 'Storyboard',
        agentType: 'storyboard-artist',
        schema: STORYBOARD_SCHEMA,
      }
    )
  )
)

const validBoards = storyboards.filter(Boolean)
const allCuts = validBoards.flatMap(sb =>
  sb.cuts.map(cut => ({ scene_id: sb.scene_id, ...cut }))
)
const totalDuration = validBoards.reduce((sum, sb) => sum + (sb.total_duration_sec || 0), 0)

log(`Storyboards done — ${validBoards.length} scenes, ${allCuts.length} cuts, about ${Math.round(totalDuration / 60)}m ${totalDuration % 60}s`)

// ─── Phase 2: Frame Art ────────────────────────────────────────────────────
phase('Frame Art')
log(`Generating ${allCuts.length} cut images with character references`)

await parallel(
  allCuts.map(cut => () =>
    agent(
      `Generate the image for scene ${cut.scene_id}, cut ${cut.cut_id}.

      Cut:
      - type: ${cut.type}
      - prompt: "${cut.frame_prompt}"
      - character refs: ${JSON.stringify(cut.character_refs || [])}
      - background ref: ${cut.background_ref || 'none'}
      - insert ref: ${cut.insert_ref || 'none'}

      Rules:
      - follow .claude/agents/frame-artist.md
      - with character_refs, use the image edit endpoint to inject the reference
      - with insert_ref, refine from that image
      - generate at 1536×1024, then convert to 1920×1080 with FFmpeg
      - save to project/final/frames/scene${cut.scene_id}_cut${cut.cut_id}_hd.png`,
      {
        label: `frame:s${cut.scene_id}c${cut.cut_id}`,
        phase: 'Frame Art',
        agentType: 'frame-artist',
      }
    )
  )
)

log('Cut images complete')

// ─── Phase 3: Production ───────────────────────────────────────────────────
phase('Production')
log(`Generating ${allCuts.length} clips`)

await parallel(
  allCuts.map(cut => () =>
    agent(
      `Generate the clip for scene ${cut.scene_id}, cut ${cut.cut_id}.

      - input image: project/final/frames/scene${cut.scene_id}_cut${cut.cut_id}_hd.png
      - follow .claude/agents/img2video.md
      - duration: ${cut.duration_sec <= 4 ? 4 : cut.duration_sec <= 8 ? 8 : 12}s, at the backend's supported size
      - motion: "${cut.motion_desc || cut.action || ''}"
      - prompt: "${cut.frame_prompt}"
      - upscale to 1920×1080 with FFmpeg
      - save to project/final/videos/scene${cut.scene_id}_cut${cut.cut_id}.mp4`,
      {
        label: `video:s${cut.scene_id}c${cut.cut_id}`,
        phase: 'Production',
        agentType: 'img2video',
      }
    )
  )
)

log('Clips complete')

// ─── Phase 4: Color Grade ──────────────────────────────────────────────────
phase('Color Grade')
log('Applying the planned grade per scene')

await parallel(
  SCENES.map(scene => () =>
    agent(
      `Grade every clip in scene ${scene}.
      - input: project/final/videos/scene${scene}_cut*.mp4
      - follow .claude/agents/color-grader.md
      - apply the scene ${scene} parameters from project/plan/color_grades.json
      - save to project/final/graded/scene${scene}_cut*.mp4`,
      {
        label: `grade:scene${scene}`,
        phase: 'Color Grade',
        agentType: 'color-grader',
      }
    )
  )
)

log('Grading complete')

// ─── Phase 5: Edit ─────────────────────────────────────────────────────────
phase('Edit')
log('Assembling the final cut')

await agent(
  `Assemble every graded clip in scene and cut order into the final film.
  - input: all mp4 files in project/final/graded/, in order
  - follow .claude/agents/video-editor.md
  - 0.8s xfade crossfade at each scene boundary
  - hard cuts within a scene
  - save to project/final/final_cut_v2.mp4
    (1920×1080, H.264, yuv420p, movflags +faststart)`,
  {
    label: 'final-edit',
    phase: 'Edit',
    agentType: 'video-editor',
  }
)

log('Edit complete')

// ─── Phase 6: QA ───────────────────────────────────────────────────────────
phase('QA')
log('Reviewing against the plan')

const report = await agent(
  `Review the finished film against the plan and write an evaluation report.
  - target: project/final/final_cut_v2.mp4
  - follow .claude/agents/film-critic.md
  - confirm the total runtime matches the scene structure in the plan
  - save to project/final/review_report.md`,
  {
    label: 'film-critic',
    phase: 'QA',
    agentType: 'film-critic',
  }
)

log('Pipeline complete')
return {
  scenes: validBoards.length,
  cuts: allCuts.length,
  estimated_duration: `${Math.round(totalDuration / 60)}m ${totalDuration % 60}s`,
  output: 'project/final/final_cut_v2.mp4',
  report,
}
