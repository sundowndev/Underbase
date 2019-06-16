module.exports = {
  db: "mongodb://localhost:27017/underbase_test",
  migrationsDir: "./examples/cli/underbase_test",
  collectionName: "migrations",
  backupsDir: "./examples/cli/underbase_test/backups",
  mongodumpBinary: "mongodump",
  backup: false,
  logs: true
}
