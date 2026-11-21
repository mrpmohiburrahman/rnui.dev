Continue the rnui.dev Recording work in this worktree. Add one more WebGPU Recording to the catalogue, and publish it.

Use a demo that the already built app already contains. Do not build a new app. Do not write a new scene. Do not rebuild the app from scratch. The app is `react-native-motion-lab` at commit `ba9b8e4`. Its existing copy is in `$TMPDIR/motion-lab`. The simulator app is `com.hewad.mubariz.birds`. The scheme is `react-native-motion-lab`. Metro runs on port 8081.

First action: ask me one interactive question with the question tool. Let me pick the next demo from these built demos only: Football stadium (Match seats), Pixel explosion (Tiger reform effect), Voxel city morph, Bar chart. Do not start work until I pick one. After that, ask me for permission before each new action. Use one question at a time. Give selectable options.

Five Recordings are already published. Do not redo them: Furniture showcase, Card flip, Bird flock murmuration, WebGPU art gallery corridor, WebGPU salon seat selection. The Salon Recording is `01M5XVT0FZZHQVS2Y8ABRTWBFN`. Commit `e215fbb` added it. The catalogue now has 353 Recordings, 211 in Misc, and 36 for Hewad Mubariz. Those pins are in `tests/recording-counts.test.ts`. Bump all three by one for the new Recording.

Read these files before you write code: `.scratch/expo-demos/recording-checklist.md`, `CONTEXT.md`, `data/misc.ts` (the Salon entry is the last one and is your template), and `.claude/skills/add-recording/SKILL.md`. Do exactly what the checklist and the skill say. One video is one Recording. Never split a clip. Use the path prefix `demo/` (singular). Never reuse a published Asset path (ADR-0003).

Record on simulator `94273D2F-EA9C-4833-8437-107B507EDE71` with Argent. A reload opens the BIRDS "Choose a scene" menu, not the demo. Run this, then tap the menu item for the demo I picked:

```
xcrun simctl terminate 94273D2F-EA9C-4833-8437-107B507EDE71 com.hewad.mubariz.birds
sleep 1
xcrun simctl openurl 94273D2F-EA9C-4833-8437-107B507EDE71 "react-native-motion-lab://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"
sleep 16
```

Menu items sit at x ≈ 0.40. Their y values are in list order: Murmuration, Art gallery, Salon selection, Football stadium, Card flip, Pixel explosion, Furniture showcase, Bar chart, Voxel city morph. Read the current screenshot to get the exact y for the item I picked. Do not trust a y value from memory.

While you record, show the demo's own interaction. Make one clear action, let it finish, then show one camera move or second action. Keep the dead time at the start below 1 second. Verify the take with extracted frames before you publish it. Extract frames with `-threads 2`. Build small contact sheets and read them yourself. Reject a take that shows the wrong screen, a missed tap, or a long still start.

Known trap in the Salon scene only: `src/scenes/salon-selection/scene.ts` already has a fix after `camera.lookAt(cameraTarget);`. Do not remove it. Other scenes may need the same check if taps do not select anything: call `camera.updateMatrixWorld()` and copy the inverted matrix into `camera.matrixWorldInverse`, and do not gate the projection block on a dirty flag.

Use these scripts only. Do not invent new ones:
- Trim with ffmpeg, `-threads 2`, `nice -n 10`.
- `./scripts/compress-demo.sh <input> public/demo/misc/<slug>.mp4`
- `pnpm posters:generate`
- `bash scripts/check-video-codecs.sh <slug>`
- `pnpm assets:publish <slug>`
- `pnpm assets:measure <slug>`

New Asset slug: `webgpu_<demo_name>_hewad_mubariz`, derived from the caption with `filenameSlug()`. Confirm the path is not already published before you use it.

The Demo must be 1206×2622. The Poster is the frame at 2 seconds, AVIF. Leave `durationMs`, `aspect`, and `hue` out of the data entry. `pnpm assets:measure` fills them after publish. Append the new object after the Salon entry in `data/misc.ts`. Copy the Contributor fields from the Salon entry exactly. Set `source` to the demo's screen file in `react-native-motion-lab` at `ba9b8e4`. Generate the `id` with `ulid`. Never write an id by hand.

Run the publish with a fragment, for example `pnpm assets:publish <slug>`. A bare `pnpm assets:publish` fails: other Recordings have no Staging copy on this machine, and the script refuses to publish anything. That refusal is correct. Do not work around it.

Set `TMPDIR=/Users/mrp/.cache/rnui-tmp` before you run any `pnpm` or `tsx` command. The arena `$TMPDIR` breaks tsx with `listen EINVAL ... tsx-501/*.pipe`. Put an ffmpeg shim on PATH that adds `-threads 4`. Run `source ~/.zshrc.secrets` before publish, measure, and deploy. Never print or commit a secret.

Verify in this order, and fix every failure before you go on: `pnpm check-types`, `pnpm lint`, `pnpm test -- --maxWorkers=3`, `bash scripts/check-video-codecs.sh <slug>`. Note: `pnpm lint` reports one old error in `.scratch/social-cards/probe/avif-datauri.tsx`. That file is not yours. Do not fix it. Lint your own changed files and report the old error as pre-existing.

Commit the data change, the count pins, and `scripts/lastCommitDate.json` together. Use this message form: `feat(catalogue): add the WebGPU <demo name> Recording`. `public/demo/` and `public/thumbnails/` are gitignored. Never force-add them.

Deploy from a clean copy, never from the worktree:
```
rm -rf /Users/mrp/.cache/rnui-deploy && mkdir -p /Users/mrp/.cache/rnui-deploy
git archive HEAD | tar -x -C /Users/mrp/.cache/rnui-deploy
cp -R .vercel /Users/mrp/.cache/rnui-deploy/
cp .env .env.local /Users/mrp/.cache/rnui-deploy/
```
Then run `npx vercel --prod --yes` in `/Users/mrp/.cache/rnui-deploy`. After the deploy, check `https://www.rnui.dev/recording/<new id>` returns 200 and contains the new caption. Then update `.scratch/expo-demos/recording-checklist.md`.

Keep CPU below 80% of 800% and swap used below 6144 MB. Measure both before and after each heavy step with `ps -A -o %cpu= | awk '{s+=$1}END{print s" of 800%"}'` and `sysctl -n vm.swapusage`. Use `nice -n 10`. Never run two heavy jobs at the same time. Stop and ask me if a limit is crossed.

Write every message to me in ASD-STE100 Simplified Technical English: short sentences, active voice, one instruction per sentence, no emojis, no filler. Do not add comments to code. Do not contact the Contributor. Do not accept any terms for anyone.

Done means: the take is verified, the Demo and Poster are published, `durationMs`/`aspect`/`hue` are measured, all checks pass, the commit exists, production returns 200 for the new Recording, and the checklist records it.
