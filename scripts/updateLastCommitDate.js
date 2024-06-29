// scripts/updateLastCommitDate.js
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "lastCommitDate.json");
const lastCommitDate = new Date().toISOString();

const data = {
  lastCommitDate,
};

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
console.log("Last commit date updated:", lastCommitDate);
