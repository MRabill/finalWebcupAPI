const fs = require("fs");
const path = require("path");

/**
 * Version management utility for automatic semantic versioning
 */
class VersionManager {
  constructor() {
    this.packageJsonPath = path.join(__dirname, "../package.json");
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
      console.error("Error reading package.json:", error.message);
      return "1.0.0";
    }
  }

  /**
   * Parse semantic version string
   */
  parseVersion(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null,
    };
  }

  /**
   * Increment version based on type
   */
  incrementVersion(type = "patch") {
    const currentVersion = this.getCurrentVersion();
    const parsed = this.parseVersion(currentVersion);

    switch (type.toLowerCase()) {
      case "major":
        return `${parsed.major + 1}.0.0`;
      case "minor":
        return `${parsed.major}.${parsed.minor + 1}.0`;
      case "patch":
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
      default:
        throw new Error(`Invalid version increment type: ${type}`);
    }
  }

  /**
   * Update package.json with new version
   */
  updatePackageVersion(newVersion) {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(this.packageJsonPath, "utf8")
      );
      const oldVersion = packageJson.version;

      packageJson.version = newVersion;

      fs.writeFileSync(
        this.packageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );

      console.log(`Version updated: ${oldVersion} → ${newVersion}`);
      return { success: true, oldVersion, newVersion };
    } catch (error) {
      console.error("Error updating package.json:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get version with build information
   */
  getVersionWithBuild() {
    const version = this.getCurrentVersion();
    const env = process.env.NODE_ENV || "development";
    const buildNumber = process.env.BUILD_NUMBER;
    const gitCommit = process.env.GIT_COMMIT;

    let versionString = version;

    if (env !== "production") {
      const buildInfo = [];
      if (buildNumber) buildInfo.push(`build.${buildNumber}`);
      if (gitCommit) buildInfo.push(`commit.${gitCommit.substring(0, 7)}`);

      if (buildInfo.length > 0) {
        versionString += `-${buildInfo.join(".")}`;
      }
    }

    return versionString;
  }

  /**
   * Auto-increment version based on environment variables or deployment context
   */
  autoIncrement() {
    const incrementType = process.env.VERSION_INCREMENT;

    if (!incrementType) {
      return this.getCurrentVersion();
    }

    const newVersion = this.incrementVersion(incrementType);
    const result = this.updatePackageVersion(newVersion);

    return result.success ? newVersion : this.getCurrentVersion();
  }

  /**
   * Get formatted version info for API responses
   */
  getVersionInfo() {
    const version = this.getVersionWithBuild();
    const parsed = this.parseVersion(this.getCurrentVersion());

    return {
      version,
      major: parsed.major,
      minor: parsed.minor,
      patch: parsed.patch,
      environment: process.env.NODE_ENV || "development",
      buildDate: new Date().toISOString(),
      buildNumber: process.env.BUILD_NUMBER || null,
      gitCommit: process.env.GIT_COMMIT || null,
    };
  }
}

module.exports = new VersionManager();
