// tslint:disable:no-var-requires
// tslint:disable:no-console

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yargs from 'yargs';
import { migrator } from '../index';
import { create } from './backup';
import { logger, timer } from './utils';

// Enable ES6 module for ES2015
require = require('esm')(module);

interface IConfigFile {
  collectionName?: string;
  backup?: boolean;
  backupsDir?: string;
  migrationsDir?: string;
  db: string;
  logs: boolean;
  logger: any;
  logIfLatest?: boolean;
  chdir?: string;
  mongodumpBinary: string;
}

interface IMigration {
  version: number;
  name: string;
  up: (db: any) => Promise<any> | any;
  down: (db: any) => Promise<any> | any;
}

const argv = yargs
  .scriptName('underbase')
  .usage('Usage: $0 <command> [OPTIONS]')
  .command('migrate <migration>', 'Execute migrations')
  // .command('create <migration>', 'Create a new migration')
  .command('init', 'Initiate migration environment')
  .command('list', 'Show all migrations versions')
  .command('status', 'Show migrations status')
  .command('unlock', 'Unlock migrations state')
  // .command('restore', 'Restore a backup archive')
  .describe('config <path>', 'JSON configuration file path')
  .describe('db <url>', 'MongoDB connection URL')
  .describe('migrations-dir <path>', 'Migrations versions directory')
  .describe('backup', 'Enable automatic backups')
  .describe('backups-dir <path>', 'Backups directory')
  .describe('collection-name <name>', 'Migrations state collection')
  .describe('logs', 'Enable logs')
  .describe('rerun', 'Force migrations execution')
  .describe('chdir <path>', 'Change the working directory')
  .describe('version', 'Show package version')
  // .describe('template <file>', 'Template to use for new migration')
  .describe(
    'mongodumpBinary <path>',
    'Binary file for mongodump (it can be a docker exec command)',
  )
  .help('h', 'Show this help message')
  .alias('h', 'help')
  .locale('en_US')
  .parse();

let configFile = {} as IConfigFile;
let workingDirectory = (argv.chdir as string) || process.cwd();

if (argv.config) {
  configFile = require(path.resolve(
    path.join(workingDirectory as string, argv.config as string),
  ));
}

if (!argv.chdir && configFile.chdir) {
  workingDirectory = configFile.chdir;
}

const config = {
  // False disables logging
  logs: (argv.logs as boolean) || (configFile.logs as boolean) || true,
  // Null or a function
  logger: logger as any,
  // Enable/disable info log "already at latest."
  logIfLatest: true,
  // Migrations collection name. Defaults to 'migrations'
  collectionName:
    (argv.collectionName as string) ||
    (configFile.collectionName as string) ||
    'migrations',
  // MongDB url
  db: (argv.db as string) || (configFile.db as string) || null,
  // Enable automatic backups
  backup: (argv.backup as boolean) || (configFile.backup as boolean) || false,
  // Directory to save backups
  backupsDir: path.resolve(
    path.join(
      workingDirectory,
      (argv.backupsDir as string) ||
        (configFile.backupsDir as string) ||
        './migrations/backups',
    ),
  ),
  migrationsDir: path.resolve(
    path.join(
      workingDirectory,
      (argv.migrationsDir as string) ||
        (configFile.migrationsDir as string) ||
        './migrations',
    ),
  ),
  mongodumpBinary:
    (argv.mongodumpBinary as string) ||
    (configFile.mongodumpBinary as string) ||
    'mongodump',
} as IConfigFile;

function exit() {
  process.exit();
}

async function setConfig() {
  logger('info', 'Connecting to MongoDB...');
  await migrator.config(config); // Returns a promise
}

async function main() {
  if (!argv._[0]) {
    logger('error', 'Invalid command. Type --help to show available commands.');
    exit();
  }

  if (!fs.existsSync(config.migrationsDir)) {
    logger('info', 'Migration directory does not exists. Please run underbase init.');
  }

  if (!fs.existsSync(config.backupsDir) && config.backup) {
    fs.mkdirpSync(config.backupsDir);
    logger('info', 'Created backup directory.');
  }

  let versions = fs
    .readdirSync(config.migrationsDir)
    .filter((v: string) => v.match(new RegExp(/^[\d].[\d]$/))) as string[];

  switch (argv._[0]) {
    case 'migrate': {
      const versionsArray = versions.map((v: string) =>
        parseFloat(v),
      ) as number[];

      if (
        argv.migration !== 0 &&
        versionsArray.indexOf(parseFloat(argv.migration as string)) < 0
      ) {
        logger('error', 'This version does not exists.');
        exit();
      }

      versions = versionsArray.map((v: number) => v.toFixed(1)) as string[];

      await setConfig();

      versions.forEach(async (v: string) => {
        const migrationObj = (await require(`${config.migrationsDir}/${v}`)
          .default) as IMigration;

        await migrator.add(migrationObj);
      });

      if (config.backup) {
        const currentVersion = await migrator.getVersion();

        await create(config.mongodumpBinary, currentVersion, config.backupsDir);
      }

      const time = timer();

      if (argv.rerun) {
        await migrator.migrateTo(`${argv.migration},rerun`);
      } else {
        await migrator.migrateTo(argv.migration as string);
      }

      logger('info', `Time spent: ${time.spent()} sec`);

      break;
    }
    case 'list': {
      logger('info', 'Versions list based on folders');

      versions.forEach((v: string) => console.log(v));

      break;
    }
    case 'status': {
      await setConfig();

      const currentVersion = await migrator.getVersion();
      const isLocked = (await migrator.isLocked()) ? 'locked' : 'not locked';

      logger('info', `Current version is ${currentVersion}`);
      logger('info', `Migration state is ${isLocked}`);

      break;
    }
    case 'unlock': {
      await setConfig();

      if (await migrator.isLocked()) {
        const time = timer();

        await migrator.unlock(); // Returns a promise

        logger('info', `Migration state unlocked.`);

        logger('info', `Time spent: ${time.spent()} sec`);
      } else {
        logger('info', `Migration state is already unlocked.`);
      }

      break;
    }
    case 'init': {
      if (!fs.existsSync(config.migrationsDir)) {
        await fs.mkdirpSync(config.migrationsDir);
        logger('info', 'Created migration directory.');
      } else {
        logger('info', 'Migration directory already exists.');
      }

      if (!fs.existsSync(config.backupsDir) && config.backup) {
        await fs.mkdirpSync(config.backupsDir);
        logger('info', 'Created backup directory.');
      }

      logger('info', 'Successfully initialized migration environment.');
      break;
    }
    default: {
      logger(
        'error',
        'Invalid command. Type --help to show available commands.',
      );
      break;
    }
  }

  exit();
}

main();