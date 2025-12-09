const path = require("path");
const fs = require("fs-extra");
const util = require("util");

const promisify = util.promisify;
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Get a list of all files in a directory
 * @param {String} dir The directory to inventory
 * @returns {Array} Array of files
 */
const files = [];

const readRecursively = async (dir) => {
  // eslint-disable-next-line
  const filesInDirectory = await readdir(dir);
  for (const file of filesInDirectory) {
    const absolute = path.join(dir, file);
    // eslint-disable-next-line
    const getFileStat = await stat(absolute);
    if (getFileStat.isDirectory()) {
      await readRecursively(absolute);
    } else {
      files.push(absolute);
    }
  }
  return files;
};

module.exports = readRecursively;
