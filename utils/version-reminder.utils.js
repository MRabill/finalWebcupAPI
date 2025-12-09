const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Version reminder utility for git workflows
 */
class VersionReminder {
  constructor() {
    this.packageJsonPath = path.join(__dirname, "../package.json");
    this.lastVersionFile = path.join(__dirname, "../.last-version");
  }

  /**
   * Check if we're in a git repository
   */
  isGitRepo() {
    try {
      execSync("git rev-parse --git-dir", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current version from package.json
   */
  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(this.packageJsonPath, "utf8")
      );
      return packageJson.version;
    } catch (error) {
      return "1.0.0";
    }
  }

  /**
   * Save current version to tracking file
   */
  saveCurrentVersion() {
    const version = this.getCurrentVersion();
    fs.writeFileSync(this.lastVersionFile, version);
    return version;
  }

  /**
   * Get last saved version
   */
  getLastVersion() {
    try {
      return fs.readFileSync(this.lastVersionFile, "utf8").trim();
    } catch {
      return null;
    }
  }

  /**
   * Check if there are code changes since last version update
   */
  hasCodeChangesSinceLastVersion() {
    if (!this.isGitRepo()) return false;

    try {
      // Get all changed files since last commit
      const changedFiles = execSync("git diff --name-only HEAD", {
        encoding: "utf8",
      });

      // Filter for code files (exclude package.json, lock files, etc.)
      const codeFiles = changedFiles
        .split("\n")
        .filter(
          (file) =>
            file &&
            !file.includes("package.json") &&
            !file.includes("package-lock.json") &&
            !file.includes(".last-version") &&
            (file.endsWith(".js") ||
              file.endsWith(".ts") ||
              file.endsWith(".jsx") ||
              file.endsWith(".tsx") ||
              file.endsWith(".vue") ||
              file.endsWith(".py") ||
              file.includes("controllers/") ||
              file.includes("routes/") ||
              file.includes("middlewares/") ||
              file.includes("utils/"))
        );

      return {
        hasChanges: codeFiles.length > 0,
        changedFiles: codeFiles,
        totalChanges: codeFiles.length,
      };
    } catch (error) {
      return { hasChanges: false, changedFiles: [], totalChanges: 0 };
    }
  }

  /**
   * Check if version was updated in current changes
   */
  wasVersionUpdated() {
    if (!this.isGitRepo()) return false;

    try {
      const changedFiles = execSync("git diff --name-only HEAD", {
        encoding: "utf8",
      });
      return changedFiles.includes("package.json");
    } catch {
      return false;
    }
  }

  /**
   * Generate version reminder message
   */
  generateReminderMessage() {
    const currentVersion = this.getCurrentVersion();
    const lastVersion = this.getLastVersion();
    const codeChanges = this.hasCodeChangesSinceLastVersion();
    const versionUpdated = this.wasVersionUpdated();

    const message = {
      shouldRemind: false,
      currentVersion,
      lastVersion,
      hasCodeChanges: codeChanges.hasChanges,
      changedFiles: codeChanges.changedFiles,
      versionUpdated,
      message: "",
      suggestions: [],
    };

    if (codeChanges.hasChanges && !versionUpdated) {
      message.shouldRemind = true;
      message.message =
        `🚨 CODE CHANGES DETECTED WITHOUT VERSION UPDATE!\n\n` +
        `📦 Current version: ${currentVersion}\n` +
        `📝 Changed files (${
          codeChanges.totalChanges
        }): ${codeChanges.changedFiles.slice(0, 5).join(", ")}${
          codeChanges.totalChanges > 5 ? "..." : ""
        }\n\n` +
        `💡 Please consider updating the version before pushing:`;

      message.suggestions = [
        {
          type: "patch",
          command: "npm run version:patch",
          desc: "🐛 Bug fixes, small changes",
        },
        {
          type: "minor",
          command: "npm run version:minor",
          desc: "✨ New features, backwards compatible",
        },
        {
          type: "major",
          command: "npm run version:major",
          desc: "💥 Breaking changes",
        },
        {
          type: "tag",
          command: "npm run version:tag-patch",
          desc: "🏷️  Auto-commit and tag version bump",
        },
      ];
    } else if (codeChanges.hasChanges && versionUpdated) {
      message.message = `✅ Great! Code changes detected and version updated to ${currentVersion}`;
    } else if (!codeChanges.hasChanges) {
      message.message = `ℹ️  No significant code changes detected. Version update not required.`;
    }

    return message;
  }

  /**
   * Display version reminder
   */
  displayReminder() {
    const reminder = this.generateReminderMessage();

    console.log("🔍 VERSION CHECK");
    console.log("================");
    console.log(reminder.message);

    if (reminder.suggestions.length > 0) {
      console.log("\n📋 Quick Commands:");
      reminder.suggestions.forEach((suggestion) => {
        console.log(`  ${suggestion.command.padEnd(30)} ${suggestion.desc}`);
      });
    }

    console.log("");
    return reminder.shouldRemind;
  }

  /**
   * Interactive version update prompt
   */
  async interactiveUpdate() {
    const reminder = this.generateReminderMessage();

    if (!reminder.shouldRemind) {
      console.log(reminder.message);
      return false;
    }

    this.displayReminder();

    // For CI/CD environments, just show the reminder without interaction
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.log(
        "🤖 Running in CI/CD environment - please update version manually"
      );
      return true; // Return true to indicate reminder was shown
    }

    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      readline.question(
        "\n❓ Would you like to update the version now? (patch/minor/major/skip): ",
        (answer) => {
          readline.close();

          const choice = answer.toLowerCase().trim();

          if (["patch", "minor", "major"].includes(choice)) {
            try {
              execSync(`npm run version:${choice}`, { stdio: "inherit" });
              console.log(`✅ Version updated successfully!`);
              resolve(false); // No reminder needed anymore
            } catch (error) {
              console.log(`❌ Failed to update version: ${error.message}`);
              resolve(true); // Still need reminder
            }
          } else {
            console.log("⚠️  Proceeding without version update...");
            resolve(true); // User chose to skip
          }
        }
      );
    });
  }

  /**
   * Initialize version tracking
   */
  init() {
    this.saveCurrentVersion();
    console.log(
      `📦 Version tracking initialized at ${this.getCurrentVersion()}`
    );
  }
}

module.exports = new VersionReminder();
