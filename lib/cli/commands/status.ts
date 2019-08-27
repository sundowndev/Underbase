import { IConfigFile } from '../../interfaces';
import { initMigrator, logger } from '../common/utils';

export const describe = 'Show migrations status';

export const action = async ({ config }) => {
  const migrator = await initMigrator(config as IConfigFile);

  const currentVersion = await migrator.getVersion();
  const isLocked = (await migrator.isLocked()) ? 'locked' : 'not locked';

  logger.info(`Current version is ${currentVersion}`);
  logger.info(`Migration state is ${isLocked}`);
};