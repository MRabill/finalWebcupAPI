#!/usr/bin/env node

const { program } = require("commander");
const versionManager = require("./utils/version.utils");

program
  .name("version-manager")
  .description("CLI tool for managing API versions")
  .version(versionManager.getCurrentVersion());

program
  .command("current")
  .description("Display current version")
  .action(() => {
    console.log(`Current version: ${versionManager.getCurrentVersion()}`);
  });

program
  .command("info")
  .description("Display detailed version information")
  .action(() => {
    const info = versionManager.getVersionInfo();
    console.log(JSON.stringify(info, null, 2));
  });

program
  .command("increment")
  .description("Increment version")
  .argument("<type>", "Version increment type (major, minor, patch)")
  .action((type) => {
    try {
      const newVersion = versionManager.incrementVersion(type);
      const result = versionManager.updatePackageVersion(newVersion);

      if (result.success) {
        console.log(
          `✅ Version incremented: ${result.oldVersion} → ${result.newVersion}`
        );
      } else {
        console.error(`❌ Failed to update version: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command("auto")
  .description("Auto-increment version based on environment variables")
  .action(() => {
    const version = versionManager.autoIncrement();
    console.log(`🚀 Version set to: ${version}`);
  });

program
  .command("build")
  .description("Get version with build information")
  .action(() => {
    const version = versionManager.getVersionWithBuild();
    console.log(`Build version: ${version}`);
  });

program
  .command("check-git")
  .description("Check if version should be updated based on git changes")
  .action(() => {
    const { execSync } = require("child_process");

    try {
      // Check if we're in a git repository
      execSync("git rev-parse --git-dir", { stdio: "ignore" });

      // Get files changed since last commit
      const changedFiles = execSync("git diff --name-only HEAD", {
        encoding: "utf8",
      });
      const codeFiles = changedFiles
        .split("\n")
        .filter(
          (file) =>
            file &&
            !file.includes("package.json") &&
            !file.includes("package-lock.json") &&
            (file.endsWith(".js") ||
              file.endsWith(".ts") ||
              file.endsWith(".jsx") ||
              file.endsWith(".tsx"))
        );

      if (codeFiles.length > 0) {
        console.log("🚨 CODE CHANGES DETECTED!");
        console.log("📝 Changed files:", codeFiles.join(", "));
        console.log("");
        console.log("💡 Consider updating version:");
        console.log("  🐛 Bug fix:      npm run version:patch");
        console.log("  ✨ New feature:  npm run version:minor");
        console.log("  💥 Breaking:     npm run version:major");
        console.log("");
        console.log("Current version:", versionManager.getCurrentVersion());
        process.exit(1); // Exit with error to indicate action needed
      } else {
        console.log("✅ No significant code changes detected");
        console.log("Current version:", versionManager.getCurrentVersion());
      }
    } catch (error) {
      console.log("ℹ️  Not in a git repository or no changes detected");
      console.log("Current version:", versionManager.getCurrentVersion());
    }
  });

program
  .command("commit-and-tag")
  .description("Increment version, commit changes, and create git tag")
  .argument("<type>", "Version increment type (major, minor, patch)")
  .option("-m, --message <msg>", "Commit message", "Version bump")
  .action((type, options) => {
    const { execSync } = require("child_process");

    try {
      // Check for uncommitted changes
      const status = execSync("git status --porcelain", { encoding: "utf8" });
      if (status.trim()) {
        console.log(
          "⚠️  You have uncommitted changes. Please commit or stash them first."
        );
        process.exit(1);
      }

      // Increment version
      const newVersion = versionManager.incrementVersion(type);
      const result = versionManager.updatePackageVersion(newVersion);

      if (!result.success) {
        console.error(`❌ Failed to update version: ${result.error}`);
        process.exit(1);
      }

      // Commit the version change
      execSync("git add package.json", { stdio: "inherit" });
      execSync(
        `git commit -m "${options.message}: ${result.oldVersion} → ${result.newVersion}"`,
        { stdio: "inherit" }
      );

      // Create git tag
      execSync(
        `git tag -a v${result.newVersion} -m "Version ${result.newVersion}"`,
        { stdio: "inherit" }
      );

      console.log(
        `✅ Version updated, committed, and tagged: ${result.oldVersion} → ${result.newVersion}`
      );
      console.log(`🏷️  Created tag: v${result.newVersion}`);
      console.log(`🚀 Ready to push with: git push origin main --tags`);
    } catch (error) {
      console.error(`❌ Git operation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
