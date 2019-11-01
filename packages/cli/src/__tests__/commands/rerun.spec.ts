// tslint:disable:no-console
// tslint:disable:no-empty
import { IConfigFile } from '@underbase/types';
import * as utils from '@underbase/utils';
// Import * as fs from 'fs-extra';
import 'jest-extended';
import * as rerunCmd from '../../commands/rerun';
import * as cliUtils from '../../common/utils';

describe('UNIT - CLI/Commands', () => {
  let mockedInitMigrator: any;
  let mockedExit: any;
  let mockedImportFile: any;

  beforeEach(() => {
    mockedInitMigrator = jest.spyOn(cliUtils, 'initMigrator');
    mockedExit = jest.spyOn(utils, 'exit');
    mockedImportFile = jest.spyOn(utils, 'importFile');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rerun', () => {
    test('should rerun current version', async () => {
      jest
        .spyOn(cliUtils, 'getMigrationsEntryFiles')
        .mockImplementation((): any => {
          return ['/test/1.0/index.js', '/test/1.2/index.js'];
        });

      const config: IConfigFile = {
        db: '',
        logs: false,
        logger: {
          info: () => {},
          error: () => {},
          warn: () => {},
          success: () => {},
          log: () => {},
        },
      };
      const versions = ['1.0', '1.2'];

      mockedExit.mockImplementation(() => {
        return;
      });

      mockedInitMigrator.mockImplementation((configObject: IConfigFile) => {
        expect(config).toBe(configObject);

        return Promise.resolve({
          add: (migration: any) => {
            expect(migration).toContainKeys([
              'version',
              'describe',
              'up',
              'down',
            ]);

            return Promise.resolve();
          },
          getVersion: () => {
            // Expect(1).toBe(0);
            return Promise.resolve(1.2);
          },
          migrateTo: (version: string) => {
            expect(version).toBe('1.2,rerun');

            return Promise.resolve();
          },
        });
      });

      mockedImportFile.mockImplementation((path: string) => {
        expect(path).toBeOneOf(['/test/1.0/index.js', '/test/1.2/index.js']);

        return Promise.resolve({
          version: 1,
          describe: 'test',
          up: () => {},
          down: () => {},
        });
      });

      await rerunCmd.action({ config, versions });

      expect(mockedInitMigrator).toHaveBeenCalledTimes(1);
      expect(mockedImportFile).toHaveBeenCalledTimes(2);
      expect(mockedExit).toHaveBeenCalledTimes(0);
    });
  });
});
