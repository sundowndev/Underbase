/*
  Adds migration capabilities. Migrations are defined like:

  Migrations.add({
    up: function() {}, //*required* code to run to migrate upwards
    version: 1, //*required* number to identify migration order
    down: function() {}, //*optional* code to run to migrate downwards
    name: 'Something' //*optional* display name for the migration
  });

  The ordering of migrations is determined by the version you set.

  To run the migrations, set the MIGRATE environment variable to either
  'latest' or the version number you want to migrate to.

  e.g:
  MIGRATE="latest"  # ensure we'll be at the latest version and run the app
  MIGRATE="2,rerun"  # re-run the migration at that version

  Note: Migrations will lock ensuring only 1 app can be migrating at once. If
  a migration crashes, the control record in the migrations collection will
  remain locked and at the version it was at previously, however the db could
  be in an inconsistant state.
*/
// tslint:disable:variable-name
// tslint:disable:no-console

import { QueryInterface } from '@underbase/query-interface';
import {
  IMigration,
  IMigrationOptions,
  IMigrationUtils,
} from '@underbase/types';
import { logger } from '@underbase/utils';
import chalk from 'chalk';
import _ from 'lodash';
import { Collection, Db, MongoClient } from 'mongodb';
import { typeCheck } from 'type-check';
import Observable from './Observable';

const check = typeCheck;

export class Migration {
  private defaultMigration = {
    version: 0,
    // tslint:disable-next-line:no-empty
    up: () => {},
  };
  private _list: any[];
  private _collection: Collection;
  private _connection: MongoClient;
  private _db: Db;
  private options: IMigrationOptions;
  private _emitter: Observable;

  /**
   * Creates an instance of Migration.
   * @param {IMigrationOptions} [opts]
   * @memberof Migration
   */
  constructor(opts?: IMigrationOptions) {
    // Since we'll be at version 0 by default, we should have a migration set for it.
    this._list = [this.defaultMigration];
    this._collection = null as any;
    this._connection = null as any;
    this._db = null as any;
    this.options = opts
      ? opts
      : {
          // False disables logging
          logs: true,
          // Null or a function
          logger: null as any,
          // Enable/disable info log "already at latest."
          logIfLatest: true,
          // Migrations collection name
          collectionName: 'migrations',
          // Mongdb url or mongo Db instance
          db: null as any,
        };
    this._emitter = new Observable();
  }

  /**
   * Configure migration
   *
   * @param {IMigrationOptions} [opts]
   * @returns {Promise<void>}
   * @memberof Migration
   */
  public async config(opts?: IMigrationOptions): Promise<void> {
    this.options = Object.assign({}, this.options, opts);

    if (this.options.logger === null && this.options.logs === true) {
      this.options.logger = logger;
    }

    if (this.options.logs === false) {
      this.options.logger = {
        // tslint:disable-next-line:no-empty
        success: () => {},
        // tslint:disable-next-line:no-empty
        error: () => {},
        // tslint:disable-next-line:no-empty
        warn: () => {},
        // tslint:disable-next-line:no-empty
        info: () => {},
        // tslint:disable-next-line:no-empty
        log: () => {},
      };
    }

    if (this.options.db === null) {
      throw new ReferenceError('Option.db canno\'t be null');
    }

    let db: Db;

    if (typeof this.options.db === 'string') {
      this._connection = await MongoClient.connect(this.options.db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      db = this._connection.db();

      this._collection = db.collection(this.options.collectionName as string);
    } else {
      db = this.options.db;
      this._collection = db.collection(this.options.collectionName as string);
    }

    this._db = db;

    await this.emitEvent('connect');
  }

  /**
   * Destroy MongoDB instance pool
   *
   * @returns {void}
   * @memberof Migration
   */
  public closeConnection(): void {
    this._connection.close();
  }

  /**
   * Register an event
   *
   * @param {string} event
   * @param {any} f
   * @returns {void}
   * @memberof Migration
   */
  public registerEvent(event: string, f: (...args: any[]) => any): void {
    this._emitter.on(event, f);
  }

  /**
   * Get migration configuration
   *
   * @returns {IMigrationOptions}
   * @memberof Migration
   */
  public getConfig(): IMigrationOptions {
    return this.options;
  }

  /**
   * Get migrations
   *
   * @returns {any[]}
   * @memberof Migration
   */
  public getMigrations(): any[] {
    return this._list;
  }

  /**
   * Indicate if the migration state is locked or not
   *
   * @returns {Promise<boolean>}
   * @memberof Migration
   */
  public async isLocked(): Promise<boolean> {
    const result = await this._collection.findOne({
      _id: 'control',
      locked: true,
    });

    return null !== result;
  }

  /**
   * Add a new migration
   *
   * @param {IMigration} migration
   * @memberof Migration
   */
  public add(migration: IMigration): void {
    if (typeof migration.up !== 'function') {
      throw new Error('Migration must supply an up function.');
    }

    if (typeof migration.down !== 'function') {
      throw new Error('Migration must supply a down function.');
    }

    if (typeof migration.version !== 'number') {
      throw new Error('Migration must supply a version number.');
    }

    if (migration.version <= 0) {
      throw new Error('Migration version must be greater than 0');
    }

    // Freeze the migration object to make it hereafter immutable
    Object.freeze(migration);

    this._list.push(migration);
    this._list = _.sortBy(this._list, (m: any) => m.version);
  }

  /**
   * Run the migrations
   *
   * @example 'latest' - migrate to latest, 2, '2,rerun'
   * @example 2 - migrate to version 2
   * @example '2,rerun' - if at version 2, re-run up migration
   *
   * @param {string | number} command
   * @memberof Migration
   */
  public async migrateTo(command: string | number): Promise<void> {
    if (!this._db) {
      throw new Error(
        'Migration instance has not be configured/initialized.' +
          ' Call <instance>.config(..) to initialize this instance',
      );
    }

    if (
      _.isUndefined(command) ||
      command === '' ||
      this.getMigrations().length === 0
    ) {
      throw new Error('Cannot migrate using invalid command: ' + command);
    }

    let version: string | number;
    let subcommand: string = '';

    if (typeof command === 'number') {
      version = command;
    } else {
      version = command.split(',')[0];
      subcommand = command.split(',')[1];
    }

    try {
      if (version === 'latest') {
        await this.execute(_.last<any>(this.getMigrations()).version);
      } else {
        await this.execute(
          parseFloat(version as string),
          subcommand === 'rerun',
        );
      }
    } catch (e) {
      this.options.logger.info(
        `Encountered an error while migrating. Migration failed.`,
      );
      throw e;
    }
  }

  /**
   * Returns the number of migrations
   *
   * @returns {number}
   * @memberof Migration
   */
  public getNumberOfMigrations(): number {
    // Exclude default/base migration v0 since its not a configured migration
    return this.getMigrations().length - 1;
  }

  /**
   * Returns the current version
   *
   * @returns {Promise<number>}
   * @memberof Migration
   */
  public async getVersion(): Promise<number> {
    const control = await this.getControl();
    return control.version;
  }

  /**
   * Unlock control
   *
   * @memberof Migration
   */
  public async unlock(): Promise<any> {
    await this._collection.updateOne(
      { _id: 'control' },
      { $set: { locked: false } },
    );
  }

  /**
   * Reset migration configuration. This is intended for dev and test mode only. Use wisely
   *
   * @returns {Promise<void>}
   * @memberof Migration
   */
  public async reset(): Promise<void> {
    this._list = [this.defaultMigration];
    await this._collection.deleteMany({});
  }

  /**
   * Emit an event
   *
   * @returns {void}
   * @param {string} event
   * @memberof Migration
   */
  private async emitEvent(
    event: string,
    data = { config: this.options },
  ): Promise<void> {
    await this._emitter.emit(event, data);
  }

  /**
   * Migrate to the specific version passed in
   *
   * @private
   * @param {string | number} version
   * @param {boolean} [rerun]
   * @returns {Promise<void>}
   * @memberof Migration
   */
  private async execute(version: number, rerun?: boolean): Promise<void> {
    const self = this;
    const control = await this.getControl(); // Side effect: upserts control document.
    let currentVersion = control.version;

    // Run the actual migration
    const migrate = async (direction: string, idx: number): Promise<any> => {
      const migration = self.getMigrations()[idx];

      this.options.logger.log(
        '\n',
        chalk.yellow(
          'Running ' + direction + '() on version ' + migration.version,
        ),
      );

      if (migration.describe) {
        this.options.logger.log(' '.repeat(4), chalk.grey(migration.describe));
      }

      if (
        migration[direction].constructor.name !== 'AsyncFunction' &&
        migration[direction].constructor.name !== 'Promise'
      ) {
        this.options.logger.log(
          ' '.repeat(4),
          chalk.bold('[WARNING]'),
          chalk.yellow(
            `One of the ${direction} functions is nor Async or Promise (${migration.describe ||
              'not described'})`,
          ),
        );
      }

      const logLevel = 8;
      const _MigrationUtils: IMigrationUtils = {
        MongoClient: this._db as Db,
        Migrate: async (migrations: Array<Promise<any>> | any[]) => {
          for (const i in migrations) {
            if (migrations.hasOwnProperty(i)) {
              if (
                migrations[i][direction].constructor.name !== 'AsyncFunction' &&
                migrations[i][direction].constructor.name !== 'Promise'
              ) {
                this.options.logger.warn(
                  `One of the ${direction} functions is nor Async or Promise`,
                  `(${migrations[i].describe || 'not described'})`,
                );
              }

              if (migrations[i].describe) {
                this.options.logger.log(
                  ' '.repeat(logLevel),
                  chalk.grey(migrations[i].describe),
                );
              }

              try {
                await migrations[i][direction](_MigrationUtils);
              } catch (error) {
                throw new Error(error);
              }
            }
          }
        },
        Query: new QueryInterface(self._db),
        Logger: (...args: string[]) =>
          this.options.logger.log(
            ' '.repeat(logLevel),
            chalk.inverse(' LOGGER '),
            ...args,
          ),
      };

      try {
        await migration[direction](_MigrationUtils);
        this.options.logger.log('');
      } catch (error) {
        throw new Error(error);
      }
    };

    // Returns true if lock was acquired.
    const lock = async () => {
      /*
       * This is an atomic op. The op ensures only one caller at a time will match the control
       * object and thus be able to update it.  All other simultaneous callers will not match the
       * object and thus will have null return values in the result of the operation.
       */
      const updateResult = await self._collection.findOneAndUpdate(
        {
          _id: 'control',
          locked: false,
        },
        {
          $set: {
            locked: true,
            lockedAt: new Date(),
          },
        },
      );

      return null != updateResult.value && 1 === updateResult.ok;
    };

    // Side effect: saves version.
    const unlock = () =>
      self.setControl({
        locked: false,
        version: currentVersion,
      });

    // Side effect: saves version.
    const updateVersion = async () =>
      await self.setControl({
        locked: true,
        version: currentVersion,
      });

    if ((await lock()) === false) {
      this.options.logger.info('Not migrating, control is locked.');
      return;
    }

    if (rerun) {
      this.options.logger.info('Rerunning version ' + version);
      await migrate('up', this.findIndexByVersion(version));
      this.options.logger.success('Finished migrating');
      await unlock();
      return;
    }

    if (currentVersion === version) {
      if (this.options.logIfLatest) {
        this.options.logger.error(
          'Not migrating, already at version ' + version,
        );
      }
      await unlock();
      return;
    }

    const startIdx = this.findIndexByVersion(currentVersion);
    const endIdx = this.findIndexByVersion(version);

    // Log.info('startIdx:' + startIdx + ' endIdx:' + endIdx);
    this.options.logger.info(
      'Migrating from version ' +
        this.getMigrations()[startIdx].version +
        ' -> ' +
        this.getMigrations()[endIdx].version,
    );

    await this.emitEvent(rerun ? 'rerun' : 'migrate');

    if (currentVersion < version) {
      for (let i = startIdx; i < endIdx; i++) {
        try {
          await migrate('up', i + 1);
          currentVersion = self.getMigrations()[i + 1].version;
          await updateVersion();
        } catch (e) {
          this.options.logger.error(
            `Encountered an error while migrating from ${currentVersion} to ${version}`,
          );
          throw e;
        }
      }
    } else {
      for (let i = startIdx; i > endIdx; i--) {
        try {
          await migrate('down', i);
          currentVersion = self.getMigrations()[i - 1].version;
          await updateVersion();
        } catch (e) {
          this.options.logger.error(
            `Encountered an error while migrating from ${currentVersion} to ${version}`,
          );
          throw e;
        }
      }
    }

    await unlock();
    this.options.logger.success('Finished migrating.');
  }

  /**
   * Gets the current control record, optionally creating it if non-existant
   *
   * @private
   * @returns {Promise<{ version: number, locked: boolean }>}
   * @memberof Migration
   */
  private async getControl(): Promise<{ version: number; locked: boolean }> {
    const con = await this._collection.findOne({ _id: 'control' });
    return (
      con ||
      (await this.setControl({
        version: 0,
        locked: false,
      }))
    );
  }

  /**
   * Set the control record
   *
   * @private
   * @param {{ version: number, locked: boolean }} control
   * @returns {(Promise<{ version: number, locked: boolean } | null>)}
   * @memberof Migration
   */
  private async setControl(control: {
    version: number;
    locked: boolean;
  }): Promise<{ version: number; locked: boolean } | null> {
    // Be quite strict
    check('Number', control.version);
    check('Boolean', control.locked);

    const updateResult = await this._collection.updateOne(
      {
        _id: 'control',
      },
      {
        $set: {
          version: control.version,
          locked: control.locked,
        },
      },
      {
        upsert: true,
      },
    );

    return updateResult && updateResult.result.ok ? control : null;
  }

  /**
   * Returns the migration index in _list or throws if not found
   *
   * @private
   * @param {string | number} version
   * @returns {number}
   * @memberof Migration
   */
  private findIndexByVersion(version: string | number): number {
    for (let i = 0; i < this.getMigrations().length; i++) {
      if (this.getMigrations()[i].version === version) {
        return i;
      }
    }

    throw new Error('Can\'t find migration version ' + version);
  }
}
