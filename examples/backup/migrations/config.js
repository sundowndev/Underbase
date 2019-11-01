const path = require('path');

module.exports = {
  db: 'mongodb://localhost:27017/underbase_example',
  migrationsDir: __dirname,
  collectionName: '_migrations',
  logs: true,
  supportFile: path.join(__dirname, 'support.js'),
};
