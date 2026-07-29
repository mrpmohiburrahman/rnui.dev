# 05 — The documented Poster workflow produces a valid Poster

**What to build:** A contributor runs the command the tooling tells them to run and ends up with a Poster that passes the test suite.

Right now they cannot. The Poster generator writes JPG. The catalogue and its test require AVIF. The converter that used to bridge the two was removed as unreachable code — correctly, it was unreachable — but it was the only bridge. So the printed instructions produce a file the suite rejects, and nothing anywhere tells the contributor what to do next.

Make the generator write AVIF directly. The project's ffmpeg dependency already carries an AV1 encoder, so this is one step with no intermediate file and no converter to reinstate. The generator asks the Asset path module where each Poster belongs rather than replacing the file extension itself.

Then close the loop at the only seam that can verify it: the codec checker already confirms every Demo is H.264 and every referenced Asset has a Staging copy on disk. Add the matching fact for Posters. Format is a property of the bytes, so no data test can establish it.

Accepted cost: AVIF encoding takes seconds per image rather than being instantaneous. The generator runs once per new recording, so it sits on no hot path.

**Blocked by:** 04. The generator derives each Poster's destination through the Asset path module.

**Status:** ready-for-agent

- [ ] The Poster generator writes AVIF directly, with no intermediate file and no separate converter
- [ ] It asks the Asset path module where each Poster goes rather than manipulating the extension itself
- [ ] A Poster produced by the documented command passes the data suite unmodified
- [ ] The codec checker asserts that every Poster present is genuinely AVIF
- [ ] That assertion fails naming the offending files, and its message says how to re-encode them
- [ ] The contributor instructions printed by the ingest script, and the maintainer checklist on a submission pull request, describe what the tooling actually does
- [ ] Type check, test suite and build all pass, and the codec checker passes against Staging copies
