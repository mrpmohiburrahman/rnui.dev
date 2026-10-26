Status: ready-for-agent
Type: task
Blocked by: 04, 05, 06, 07, 08, 11, 12

## Question

What is the record and data plan for each new Recording?

For each animation that passes the earlier tickets, give one row. The row has caption, Contributor, Category, exact folder or file source link, app entry point, and Asset path from the `add-recording` skill. Build the app one time per repo. Record each Demo alone on the iPhone 18 Pro simulator. Do not use the Expo Demo file.

Then run the `add-recording` steps per Recording: compress to Staging, generate the Poster, append the data row, and run `pnpm check-types`, `pnpm lint`, `pnpm test`, and the codec check. Commit the data change only.
