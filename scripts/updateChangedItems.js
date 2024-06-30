const fs = require("fs-extra");
const path = require("path");
const simpleGit = require("simple-git");

const dataDir = path.join(__dirname, "../data");
const changedItemsPath = path.join(__dirname, "../data/changedItems.json");
const git = simpleGit();

const getJsonFilesContent = async (branch) => {
  await git.checkout(branch);
  const files = await fs.readdir(dataDir);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  const jsonData = {};
  for (const file of jsonFiles) {
    const data = await fs.readJson(path.join(dataDir, file));
    jsonData[file] = data.map((item) => ({
      ...item,
      category: path.basename(file, ".json"),
    }));
  }

  return jsonData;
};

const findNewItems = (localData, remoteData) => {
  const newItems = [];

  for (const [file, localItems] of Object.entries(localData)) {
    const remoteItems = remoteData[file] || [];

    for (const localItem of localItems) {
      if (
        !remoteItems.some(
          (remoteItem) =>
            JSON.stringify(remoteItem) === JSON.stringify(localItem)
        )
      ) {
        newItems.push(localItem);
      }
    }
  }

  return newItems;
};

const updateChangedItemsFile = async (jsonData) => {
  await fs.writeFile(
    changedItemsPath,
    JSON.stringify(jsonData, null, 2),
    "utf8"
  );
  console.log("Successfully updated changedItems.json with recent changes.");
};

const main = async () => {
  try {
    const currentBranch = (await git.branch()).current;

    const localData = await getJsonFilesContent(currentBranch);
    const remoteData = await getJsonFilesContent("origin/main");

    const newItems = findNewItems(localData, remoteData);

    if (newItems.length > 0) {
      await updateChangedItemsFile(newItems);
    } else {
      console.log("No new items found.");
    }

    await git.checkout(currentBranch); // Ensure we're back on the current branch
  } catch (error) {
    console.error("Error updating changedItems.json:", error);
  }
};

main();
