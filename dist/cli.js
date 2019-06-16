!function(e){var i={};function o(t){if(i[t])return i[t].exports;var n=i[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,o),n.l=!0,n.exports}o.m=e,o.c=i,o.d=function(e,i,t){o.o(e,i)||Object.defineProperty(e,i,{enumerable:!0,get:t})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,i){if(1&i&&(e=o(e)),8&i)return e;if(4&i&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(o.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&i&&"string"!=typeof e)for(var n in e)o.d(t,n,function(i){return e[i]}.bind(null,n));return t},o.n=function(e){var i=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(i,"a",i),i},o.o=function(e,i){return Object.prototype.hasOwnProperty.call(e,i)},o.p="",o(o.s=1)}([function(e,i,o){"use strict";Object.defineProperty(i,"__esModule",{value:!0}),i.logger=((e,...i)=>console.log(`[${e.toUpperCase()}]`,...i)),i.timer=(()=>{const e=(new Date).getTime();return{spent:()=>((new Date).getTime()-e)/1e3}})},function(e,i,o){"use strict";(function(e){var t,n=this&&this.__awaiter||function(e,i,o,t){return new(o||(o=Promise))(function(n,r){function s(e){try{a(t.next(e))}catch(e){r(e)}}function c(e){try{a(t.throw(e))}catch(e){r(e)}}function a(e){e.done?n(e.value):new o(function(i){i(e.value)}).then(s,c)}a((t=t.apply(e,i||[])).next())})};Object.defineProperty(i,"__esModule",{value:!0});const r=o(3),s=o(4),c=o(5),a=o(6),l=o(13),u=o(0);t=o(15)(e);const d=c.scriptName("underbase").usage("Usage: $0 <command> [OPTIONS]").command("migrate <migration>","Execute migrations").command("init","Initiate migration environment").command("list","Show all migrations versions").command("status","Show migrations status").command("unlock","Unlock migrations state").describe("config <path>","JSON configuration file path").describe("db <url>","MongoDB connection URL").describe("migrations-dir <path>","Migrations versions directory").describe("backup","Enable automatic backups").describe("backups-dir <path>","Backups directory").describe("collection-name <name>","Migrations state collection").describe("logs","Enable logs").describe("rerun","Force migrations execution").describe("chdir <path>","Change the working directory").describe("version","Show package version").describe("mongodumpBinary <path>","Binary file for mongodump (it can be a docker exec command)").help("h","Show this help message").alias("h","help").locale("en_US").parse();let g={},f=d.chdir||process.cwd();d.config&&(g=t(s.resolve(s.join(f,d.config)))),!d.chdir&&g.chdir&&(f=g.chdir);const h={logs:d.logs||g.logs||!0,logger:u.logger,logIfLatest:!0,collectionName:d.collectionName||g.collectionName||"migrations",db:d.db||g.db||null,backup:d.backup||g.backup||!1,backupsDir:s.resolve(s.join(f,d.backupsDir||g.backupsDir||"./migrations/backups")),migrationsDir:s.resolve(s.join(f,d.migrationsDir||g.migrationsDir||"./migrations")),mongodumpBinary:d.mongodumpBinary||g.mongodumpBinary||"mongodump"};function p(){process.exit()}function m(){return n(this,void 0,void 0,function*(){u.logger("info","Connecting to MongoDB..."),yield a.migrator.config(h)})}!function(){n(this,void 0,void 0,function*(){d._[0]||(u.logger("error","Invalid command. Type --help to show available commands."),p()),r.existsSync(h.migrationsDir)||u.logger("info","Migration directory does not exists. Please run underbase init."),!r.existsSync(h.backupsDir)&&h.backup&&(r.mkdirpSync(h.backupsDir),u.logger("info","Created backup directory."));let e=r.readdirSync(h.migrationsDir).filter(e=>e.match(new RegExp(/^[\d].[\d]$/)));switch(d._[0]){case"migrate":{const i=e.map(e=>parseFloat(e));if(0!==d.migration&&i.indexOf(parseFloat(d.migration))<0&&(u.logger("error","This version does not exists."),p()),e=i.map(e=>e.toFixed(1)),yield m(),e.forEach(e=>n(this,void 0,void 0,function*(){const i=yield t(`${h.migrationsDir}/${e}`).default;yield a.migrator.add(i)})),h.backup){const e=yield a.migrator.getVersion();yield l.create(h.mongodumpBinary,e,h.backupsDir)}const o=u.timer();d.rerun?yield a.migrator.migrateTo(`${d.migration},rerun`):yield a.migrator.migrateTo(d.migration),u.logger("info",`Time spent: ${o.spent()} sec`);break}case"list":u.logger("info","Versions list based on folders"),e.forEach(e=>console.log(e));break;case"status":{yield m();const e=yield a.migrator.getVersion(),i=(yield a.migrator.isLocked())?"locked":"not locked";u.logger("info",`Current version is ${e}`),u.logger("info",`Migration state is ${i}`);break}case"unlock":if(yield m(),yield a.migrator.isLocked()){const e=u.timer();yield a.migrator.unlock(),u.logger("info","Migration state unlocked."),u.logger("info",`Time spent: ${e.spent()} sec`)}else u.logger("info","Migration state is already unlocked.");break;case"init":r.existsSync(h.migrationsDir)?u.logger("info","Migration directory already exists."):(yield r.mkdirpSync(h.migrationsDir),u.logger("info","Created migration directory.")),!r.existsSync(h.backupsDir)&&h.backup&&(yield r.mkdirpSync(h.backupsDir),u.logger("info","Created backup directory.")),u.logger("info","Successfully initialized migration environment.");break;default:u.logger("error","Invalid command. Type --help to show available commands.")}p()})}()}).call(this,o(2)(e))},function(e,i){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children||(e.children=[]),Object.defineProperty(e,"loaded",{enumerable:!0,get:function(){return e.l}}),Object.defineProperty(e,"id",{enumerable:!0,get:function(){return e.i}}),e.webpackPolyfill=1),e}},function(e,i){e.exports=require("fs-extra")},function(e,i){e.exports=require("path")},function(e,i){e.exports=require("yargs")},function(e,i,o){"use strict";Object.defineProperty(i,"__esModule",{value:!0});const t=o(7);i.Migration=t.Migration;const n=new t.Migration;i.migrator=n,process.env.MIGRATE&&n.migrateTo(process.env.MIGRATE)},function(e,i,o){"use strict";var t=this&&this.__awaiter||function(e,i,o,t){return new(o||(o=Promise))(function(n,r){function s(e){try{a(t.next(e))}catch(e){r(e)}}function c(e){try{a(t.throw(e))}catch(e){r(e)}}function a(e){e.done?n(e.value):new o(function(i){i(e.value)}).then(s,c)}a((t=t.apply(e,i||[])).next())})};Object.defineProperty(i,"__esModule",{value:!0});const n=o(8),r=o(9),s=o(10),c=o(11),a=o(12),l=c.typeCheck;i.Migration=class{constructor(e){this.defaultMigration={version:0,up:()=>{}},this._list=[this.defaultMigration],this.options=e||{logs:!0,logger:null,logIfLatest:!0,collectionName:"migrations",db:null}}getConfig(){return this.options}getMigrations(){return this._list}isLocked(){return t(this,void 0,void 0,function*(){return null!==(yield this._collection.findOne({_id:"control",locked:!0}))})}config(e){return t(this,void 0,void 0,function*(){if(this.options=Object.assign({},this.options,e),!this.options.logger&&this.options.logs&&(this.options.logger=((e,...i)=>console.log(e,...i))),!1===this.options.logs&&(this.options.logger=((e,...i)=>{})),!(this._db instanceof s.Db||this.options.db))throw new ReferenceError("Option.db canno't be null");let i;i="string"==typeof this.options.db?(yield s.MongoClient.connect(this.options.db,{promiseLibrary:n.Promise,useNewUrlParser:!0})).db():this.options.db,this._collection=i.collection(this.options.collectionName),this._db=i})}add(e){if("function"!=typeof e.up)throw new Error("Migration must supply an up function.");if("function"!=typeof e.down)throw new Error("Migration must supply a down function.");if("number"!=typeof e.version)throw new Error("Migration must supply a version number.");if(e.version<=0)throw new Error("Migration version must be greater than 0");Object.freeze(e),this._list.push(e),this._list=r.sortBy(this._list,e=>e.version)}migrateTo(e){return t(this,void 0,void 0,function*(){if(!this._db)throw new Error("Migration instance has not be configured/initialized. Call <instance>.config(..) to initialize this instance");if(r.isUndefined(e)||""===e||0===this.getMigrations().length)throw new Error("Cannot migrate using invalid command: "+e);let i,o;"number"==typeof e?i=e:(i=e.split(",")[0],o=e.split(",")[1]);try{"latest"===i?yield this.execute(r.last(this.getMigrations()).version):yield this.execute(parseFloat(i),"rerun"===o)}catch(e){throw this.options.logger("info","Encountered an error while migrating. Migration failed."),e}})}getNumberOfMigrations(){return this.getMigrations().length-1}getVersion(){return t(this,void 0,void 0,function*(){return(yield this.getControl()).version})}unlock(){return t(this,void 0,void 0,function*(){yield this._collection.updateOne({_id:"control"},{$set:{locked:!1}})})}reset(){return t(this,void 0,void 0,function*(){this._list=[this.defaultMigration],yield this._collection.deleteMany({})})}execute(e,i){return t(this,void 0,void 0,function*(){const o=this;let n=(yield this.getControl()).version;const r=(e,i)=>t(this,void 0,void 0,function*(){const t=o.getMigrations()[i];if("function"!=typeof t[e])throw yield s(),new Error("Cannot migrate "+e+" on version "+t.version);this.options.logger("info","Running "+e+"() on version "+t.version+(t.name?" ("+t.name+")":"")),yield t[e](new a.MongoInterface(o._db))}),s=()=>o.setControl({locked:!1,version:n}),c=()=>t(this,void 0,void 0,function*(){return yield o.setControl({locked:!0,version:n})});if(!1===(yield(()=>t(this,void 0,void 0,function*(){const e=yield o._collection.findOneAndUpdate({_id:"control",locked:!1},{$set:{locked:!0,lockedAt:new Date}});return null!=e.value&&1===e.ok}))()))return void this.options.logger("info","Not migrating, control is locked.");if(i)return this.options.logger("info","Rerunning version "+e),yield r("up",e),this.options.logger("info","Finished migrating."),void(yield s());if(n===e)return this.options.logIfLatest&&this.options.logger("info","Not migrating, already at version "+e),void(yield s());const l=this.findIndexByVersion(n),u=this.findIndexByVersion(e);if(this.options.logger("info","Migrating from version "+this.getMigrations()[l].version+" -> "+this.getMigrations()[u].version),n<e)for(let e=l;e<u;e++)try{yield r("up",e+1),n=o.getMigrations()[e+1].version,yield c()}catch(i){throw this.options.logger("error",`Encountered an error while migrating from ${e} to ${e+1}`),i}else for(let e=l;e>u;e--)try{yield r("down",e),n=o.getMigrations()[e-1].version,yield c()}catch(i){throw this.options.logger("error",`Encountered an error while migrating from ${e} to ${e-1}`),i}yield s(),this.options.logger("info","Finished migrating.")})}getControl(){return t(this,void 0,void 0,function*(){return(yield this._collection.findOne({_id:"control"}))||(yield this.setControl({version:0,locked:!1}))})}setControl(e){return t(this,void 0,void 0,function*(){l("Number",e.version),l("Boolean",e.locked);const i=yield this._collection.updateOne({_id:"control"},{$set:{version:e.version,locked:e.locked}},{upsert:!0});return i&&i.result.ok?e:null})}findIndexByVersion(e){for(let i=0;i<this.getMigrations().length;i++)if(this.getMigrations()[i].version===e)return i;throw new Error("Can't find migration version "+e)}}},function(e,i){e.exports=require("bluebird")},function(e,i){e.exports=require("lodash")},function(e,i){e.exports=require("mongodb")},function(e,i){e.exports=require("type-check")},function(e,i,o){"use strict";var t=this&&this.__awaiter||function(e,i,o,t){return new(o||(o=Promise))(function(n,r){function s(e){try{a(t.next(e))}catch(e){r(e)}}function c(e){try{a(t.throw(e))}catch(e){r(e)}}function a(e){e.done?n(e.value):new o(function(i){i(e.value)}).then(s,c)}a((t=t.apply(e,i||[])).next())})};Object.defineProperty(i,"__esModule",{value:!0});const n=o(0);i.MongoInterface=class{constructor(e){this._db=e,this._actions=[],this.cursorOptions={cursor:{batchSize:500},allowDiskUse:!0}}MongoClient(){return this._db}collection(e){const i=this;i.collectionName=e,i._collection=i.MongoClient().collection(e);let o={},r={};const s=()=>i.cursor(r||{},e=>{i._collection.updateOne({_id:e._id},o)});return{applySchema:e=>{for(const i in e)for(const t in e[i]){switch(r=e[i][t].$where||{},o[t]={},t){case"$rename":o[t][i]=e[i][t].$value;case"$set":o[t][i]=e[i][t].$value;case"$unset":o[t][i]=1;default:o[t][i]=e[i][t]}s()}},rename:(e,i)=>{const t={};return{where:n=>(r=n||{},t[e]=i,o={$rename:t},s())}},unset:e=>{const i={};return{where:t=>{if("string"==typeof e)i[e]=1;else{if(!Array.isArray(e))throw new Error("Field name in .unset() must of type string or array.");for(const o of e)i[o]=1}return r=t||{},o={$unset:i||{}},s()}}},set:(e,i)=>{const t={};return{where:n=>(t[e]=i,r=n||{},o={$set:t||{}},s())}},destroy:e=>(r=e||{},i.cursor(r,e=>{i._collection.deleteOne({_id:e._id})})),drop:()=>{const o=new Promise((o,r)=>t(this,void 0,void 0,function*(){yield i.MongoClient().dropCollection(e,(e,i)=>o()),n.logger("info","Deleted collection "+e)}));this._actions.push(o)},update:(e,i)=>{},iterate:(e,o)=>(r=e||{},i.cursor(r,o))}}save(){return t(this,void 0,void 0,function*(){try{return Promise.all(this._actions)}catch(e){return new Error(e)}})}cursor(e,i){return t(this,void 0,void 0,function*(){const o=new Promise((o,n)=>t(this,void 0,void 0,function*(){const t=yield this._collection.aggregate([{$match:e||{}}],this.cursorOptions,null);t.on("data",e=>{i(e)}),t.on("close",()=>n("MongoDB closed the connection")),t.on("end",()=>o())}));this._actions.push(o)})}}},function(e,i,o){"use strict";Object.defineProperty(i,"__esModule",{value:!0});const t=o(14),n=o(0);i.create=((e,i,o)=>new Promise((r,s)=>{n.logger("info","Creating backup...");const c=[i.toFixed(1),`${Date.now()}.gz`].join("_"),a=[e,"--host localhost:27017",`--archive=${o}/${c}`,"--gzip --db underbase_test"].join(" ");t.exec(a,(e,i,o)=>(e&&(n.logger("error","An error occured while creating backup... Cancelling."),console.error(e),process.exit()),n.logger("success","Backup created : "+c),r()))}))},function(e,i){e.exports=require("child_process")},function(e,i){e.exports=require("esm")}]);