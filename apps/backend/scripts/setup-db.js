#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Helper function to execute commands and log output
function runCommand(command, message) {
  console.log(`${colors.bright}${colors.blue}> ${message}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.green}✓ Done!${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Failed!${colors.reset}\n`);
    return false;
  }
}

// Check if .env file exists, if not create from example
function setupEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log(`${colors.yellow}No .env file found. Creating from .env.example...${colors.reset}`);
    fs.copyFileSync(envExamplePath, envPath);
    console.log(`${colors.green}✓ Created .env file. Please update it with your database credentials.${colors.reset}\n`);
    return true;
  } else if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}✗ No .env or .env.example file found!${colors.reset}\n`);
    return false;
  }
  return true;
}

// Main function to run the setup
async function main() {
  console.log(`\n${colors.bright}${colors.magenta}=== Hymnal App Database Setup ===${colors.reset}\n`);
  
  // Setup environment variables
  if (!setupEnvFile()) {
    process.exit(1);
  }
  
  // Generate Prisma client
  if (!runCommand('npx prisma generate', 'Generating Prisma client')) {
    process.exit(1);
  }
  
  // Run database migrations
  if (!runCommand('npx prisma migrate dev --name init', 'Running database migrations')) {
    console.log(`${colors.yellow}Note: If this is the first time, the migration might fail if the database doesn't exist yet.${colors.reset}`);
    process.exit(1);
  }
  
  // Seed the database
  if (!runCommand('npm run db:seed', 'Seeding the database with initial data')) {
    process.exit(1);
  }
  
  console.log(`${colors.bright}${colors.cyan}Database setup completed successfully!${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}You can now run 'npm run dev' to start the server.${colors.reset}\n`);
  console.log(`${colors.bright}${colors.cyan}Additional commands:${colors.reset}`);
  console.log(`${colors.yellow}- npm run db:studio${colors.reset} - Open Prisma Studio to view/edit data`);
  console.log(`${colors.yellow}- npm run db:reset${colors.reset} - Reset the database (caution: deletes all data)`);
  console.log(`${colors.yellow}- npm run db:migrate${colors.reset} - Run migrations after schema changes\n`);
}

main().catch(error => {
  console.error(`${colors.red}Error during setup:${colors.reset}`, error);
  process.exit(1);
});