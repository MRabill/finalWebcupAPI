#!/usr/bin/env node

const { Command } = require("commander");
const { exec } = require("child_process");

const program = new Command();

const fs = require("fs");
const path = require("path");

// Path to the migrations directory
const migrationsDir = path.resolve(__dirname, "./configs/migrations");

program
  .command("create")
  .description("Create a new migration or seed")
  .action(() => {
    // Prompt the user for a migration name
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    //Prompt the user to select migration or seed
    readline.question(
      "What do you want to create migration or seed (m/s): ",
      (type) => {
        if (type.toLowerCase() === "m") {
          readline.question("Enter migration name: ", (name) => {
            readline.close();
            // Execute the knex migrate:make command with the provided name
            const command = `npx knex migrate:make ${name}`;
            exec(command, (error, stdout, stderr) => {
              if (error) {
                console.error(`Failed to create migration: ${error.message}`);
                return;
              }
              if (stderr) {
                console.error(`Error: ${stderr}`);
                return;
              }
              console.log(stdout);
            });
          });
        } else if (type.toLowerCase() === "s") {
          readline.question("Enter seed name: ", (name) => {
            readline.close();
            // Execute the knex seed:make command with the provided name
            const command = `npx knex seed:make ${name}`;
            exec(command, (error, stdout, stderr) => {
              if (error) {
                console.error(`Failed to create migration: ${error.message}`);
                return;
              }
              if (stderr) {
                console.error(`Error: ${stderr}`);
                return;
              }
              console.log(stdout);
            });
          });
        } else {
          // Invalid option
          console.error('Invalid option. Please select "migration" or "seed".');
          readline.close();
        }
      }
    );
  });

// Command to revert a specific migration
program
  .command("revert")
  .description("Revert a specific migration by name")
  .action(async () => {
    try {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".js"));

      if (migrationFiles.length === 0) {
        console.log("No migrations found to revert.");
        return;
      }

      // Prompt the user for a migration name
      const rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: (line) => {
          const hits = migrationFiles.filter((name) => name.startsWith(line));
          return [hits.length ? hits : migrationFiles, line];
        },
      });

      rl.question("Enter the migration name to revert: ", async (name) => {
        rl.close();
        if (!migrationFiles.includes(name)) {
          console.error(`Migration "${name}" not found.`);
          return;
        }

        try {
          //knex migrate:down 001_migration_name.js
          console.log(`Reverting migration: ${name}`);
          const command = `npx cross-env NODE_ENV=development knex migrate:down ${name}`;
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Failed to revert migration: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`Error: ${stderr}`);
              return;
            }
            console.log(stdout);
          });
        } catch (err) {
          console.error(`Failed to revert migration: ${err}`);
        }
      });
    } catch (err) {
      console.error(`Error reading migrations: ${err.message}`);
    }
  });

// Parse arguments after all commands are registered
program.parse(process.argv);
