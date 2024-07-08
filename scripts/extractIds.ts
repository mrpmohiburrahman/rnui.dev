const fs = require("fs");
const path = require("path");

// Define the interface for the data objects
interface DataObject {
  caption: string;
  demo: string;
  Author: string;
  source: string;
  twitterId?: string;
  linkedInId?: string;
  githubId?: string;
}

// Define the interface for the result objects
interface ResultObject {
  linkedInId: string;
  twitterId: string;
}

// Function to read JSON files and extract the required data
const extractIdsFromJsonFiles = (dataFolder: string): ResultObject[] => {
  const result: ResultObject[] = [];

  // List of linkedinIds to exclude
  const excludeLinkedInIds = ["hewad-mubariz", "thefriyia", "aleqsio"];

  // Sets to track unique IDs
  const seenLinkedInIds = new Set<string>();
  const seenTwitterIds = new Set<string>();

  // Read all files in the data folder
  const files = fs.readdirSync(dataFolder);

  files.forEach((file: string) => {
    const filePath = path.join(dataFolder, file);

    // Read and parse the JSON file
    const rawData = fs.readFileSync(filePath, "utf-8");
    const dataObjects: DataObject[] = JSON.parse(rawData);

    // Extract linkedInId and twitterId
    dataObjects.forEach((dataObject: DataObject) => {
      if (dataObject.linkedInId && dataObject.twitterId) {
        if (
          !excludeLinkedInIds.includes(dataObject.linkedInId) &&
          !seenLinkedInIds.has(dataObject.linkedInId) &&
          !seenTwitterIds.has(dataObject.twitterId)
        ) {
          seenLinkedInIds.add(dataObject.linkedInId);
          seenTwitterIds.add(dataObject.twitterId);
          result.push({
            linkedInId: dataObject.linkedInId,
            twitterId: dataObject.twitterId,
          });
        }
      }
    });
  });

  return result;
};

// Define the path to the data folder
const dataFolder = path.join(__dirname, "../data");

// Call the function to get the result
const extractedIds = extractIdsFromJsonFiles(dataFolder);

// ANSI escape codes for coloring
const blueBold = "\x1b[34m\x1b[1m";
const greenBold = "\x1b[32m\x1b[1m";
const cyan = "\x1b[36m";
const reset = "\x1b[0m";

// Print LinkedIn IDs with URLs
console.log(`${blueBold}LinkedIn Profiles:${reset}`);
extractedIds.forEach((item) => {
  console.log(
    `ID: ${greenBold}${item.linkedInId}${reset}, URL: ${cyan}https://www.linkedin.com/in/${item.linkedInId}${reset}`
  );
});

// Print Twitter IDs with URLs
console.log(`${blueBold}\nTwitter Profiles:${reset}`);
extractedIds.forEach((item) => {
  console.log(
    `ID: ${greenBold}${item.twitterId}${reset}, URL: ${cyan}https://twitter.com/${item.twitterId}${reset}`
  );
});
