Status: resolved
Type: task
Blocked by: 02

## Question

Which candidate animations match a Recording in the catalogue now?

Compare each candidate against all 348 Recordings. Compare repo, exact folder or file, caption, Contributor, Category, and visual likeness from the Demo and the Poster. Put each candidate in one class: exact duplicate, near-duplicate, or new.

An exact duplicate needs the same repo folder or file and the same animation. A near-duplicate shares visual likeness but not an exact source match. Save the table in `research/duplicate-match.md` in this effort folder.

## Answer

The catalogue holds 348 Recordings. The 191 candidates split into 120 exact duplicates, 26 near-duplicates, and 45 new candidates.

An exact duplicate uses the same repository folder. A commit SHA does not create a new folder. Those 120 candidates already have a Recording. Do not add a second Recording for the same example.

A near-duplicate is not a verdict. The 26 pairs go to [Near-duplicate verdicts](04-near-duplicate-verdicts.md). The strongest evidence is source identity plus caption. I inspected two Posters. The Furniture App Poster is a product page, not the WebGPU viewer. The Neural Network Poster uses a digit grid, like the MNIST candidate. Candidate motion was not captured.

The full tables sit in `research/duplicate-match.md`.

## Comments

2026-10-22: Compared every candidate path with every Recording source. No app build, capture, Expo media download, or catalogue edit occurred.

