import { ICommand } from '@underbase/types';
import * as fs from 'fs';
import * as path from 'path';

export async function getCommands(): Promise<ICommand[]> {
  const commandsList: ICommand[] = [];
  const commandFiles = fs
    .readdirSync(path.join(__dirname, 'commands'))
    .filter((f: string) => f.match(new RegExp(/^(.*).(js)$/)));

  for (const cmd of commandFiles) {
    const object = await import(path.join(__dirname, 'commands', cmd));

    Object.assign(object, {
      name: object.command.replace(/( )\<([\w]*)\>/, ''),
    });

    commandsList.push(object);
  }

  return commandsList;
}

export const usage = 'Usage: $0 <command> [OPTIONS]';
export const docs = 'Documentation: https://sundowndev.github.io/underbase/';

export const options = {
  config: {
    default: 'underbase.config.js',
    description: 'Configuration file path.',
    type: 'string' as 'string',
  },
  db: {
    default: '',
    description: 'MongoDB connection URL.',
    type: 'string' as 'string',
  },
  migrationsDir: {
    default: './migrations',
    description: 'Migrations versions directory.',
    type: 'string' as 'string',
  },
  collectionName: {
    default: 'migrations',
    description: 'Migrations state collection.',
    type: 'string' as 'string',
  },
  logs: {
    default: true,
    description: 'Enable logs.',
    type: 'boolean' as 'boolean',
  },
  logIfLatest: {
    default: true,
    description:
      'Log in the terminal if you are already at the specified version.',
    type: 'boolean' as 'boolean',
  },
  supportFile: {
    default: undefined,
    description: 'Support file path.',
    type: 'string' as 'string',
  },
};
