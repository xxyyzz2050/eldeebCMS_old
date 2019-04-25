/* todo:
class{
 constructor(){-nothing-}
 connect(){return promise}
}
new db().connect(options).then(..) //because constructor must return this 'TypeScript'
or: new db(options).then(..) //is a valid typeScript?
constructor():Type{} //error: type annotation cannot apear on constructor
*/
import * as mongoose from "mongoose";
import { generate as shortId } from "shortId";
import $eldeeb from "./index";
import $promise from "./promise";
import $error from "./error";

let eldeeb = new $eldeeb({
  mark: "db/mongoDB"
});

export default class /*todo: extends mongoose.constructor*/ {
  //mongoose/lib/index.js exports new mongoose(), not the class itself; also mongoose is a Function
 private eldeeb:$eldeeb;
  private promise; //todo: promise: eldeeb.promise
  public connection;
  public models;
  public ext;
  public pk;
  public uri;

  constructor() {
    //todo: return Promise ; events:function
    //note: if this class didn't extends mongoose, 1- don't use super() 2- use mongoose instead of this to access mongoose properties
    //when extends
    //super(options)

    return this;
  }

  connect(
    options?: types.dbMongoDB.connectionOptions,
    done?: types.promise.NEXT,
    fail?: types.promise.NEXT,
    events?: any
  ) /* todo: : eldeeb.promise*/ {
    return eldeeb.run(["()", options /*,callback*/], () => {
      this.promise = new $promise(
        (resolve, reject) => {
          let err =  $error(100),
            defaultOptions = {
              useCreateIndex: true,
              //useNewUrlParser: true, //https://mongoosejs.com/docs/deprecations.html; now it gives "MongoError: authentication fail"
              useFindAndModify: false,
              bufferCommands: false, //https://mongoosejs.com/docs/connections.html
              autoIndex: false,
              retryWrites: true
            };

          if (typeof options == "function") options = options();
          if (eldeeb.isEmpty(options))
            reject({
              ...err,
              details: {
                uri: this.uri,
                error: "options is empty",
                options: options
              }
            });
          else if (typeof options == "string") options = { uri: options };
          else if (options instanceof Array) {
            //don't use typeof options=="Array"
            options = {
              user: options[0],
              pass: options[1],
              host: options[2],
              db: options[3]
            };
          }

          if (eldeeb.objectType(options) != "object")
            reject({
              ...err,
              details: {
                uri: this.uri,
                error: "options is not an object",
                options: options
              }
            });

          if (typeof options.uri == "function")
            options.uri = options.uri(options);

          if ("uri" in options && !eldeeb.isEmpty(options.uri)) {
            this.uri =
              (options.uri.substr(0, 7) != "mongodb"
                ? "mongodb" + (options.srv ? "+srv" : "") + "://"
                : "") + options.uri;
          } else {
            if (
              !("user" in options) ||
              !("pass" in options) ||
              eldeeb.isEmpty(options.user) ||
              eldeeb.isEmpty(options.pass)
            )
              reject({
                ...err,
                details: {
                  uri: this.uri,
                  error: "no uri or user/pass",
                  options: options
                }
              });
            if (!options["host"]) options["host"] = "localhost"; //todo: default port
            // if(!("db" in options))options["db"]="database"
            this.uri = `mongodb${options.srv ? "+srv" : ""}://${this.encode(
              options["user"]
            )}:${this.encode(options["pass"])}@${
              options["host"] instanceof Array
                ? options["host"].join(",")
                : options["host"]
            }/${options["db"]}`; //?${options["options"]
          }

          this.models = options.models ? options.models : "../../../models"; //default path for model schema objects (related to THIS file)
          this.ext = options.ext ? options.ext : "json";
          if (options.debug) {
            mongoose.set("debug", true);
            eldeeb.options.log = true;
          } else {
            mongoose.set("debug", false);
            eldeeb.options.log = false; //default is true
          }
          delete options["uri"];
          delete options["user"];
          delete options["pass"];
          delete options["host"];
          delete options["db"];
          delete options["options"]; //deprecated: options for native dbMongo (appended to uri ->uri?options)
          delete options["models"];
          delete options["ext"];
          delete options["debug"];
          delete options["srv"];
          //options may has another properties for Mongoose or mongoDB, so don't set options to null

          if (options.pk) {
            this.pk == options.pk;
            delete options.pk;
          } else this.pk == "__id";

          options = eldeeb.merge(defaultOptions, options);
          //if (eldeeb.options.log)  console.log('connection details:', this.uri, options)

          this.connection  = mongoose.createConnection(this.uri, options); //todo: convert to eldeeb.promise
          if (!this.connection)
            reject({
              ...err,
              details: {
                uri: this.uri,
                error: "connection error",
                options: options
              }
            });
          if (events) this.on("all", ev => events(ev)); //this will be run for all events, .then(..db.on('all')) will be run for all events AFTER 'open' because .then() only occurs after 'open' stage
          this.connection.then(
            () => resolve(<any>this), //db is connected & open, using .on() will be run on other events
            error =>
              reject({
                ...err,
                details: { uri: this.uri, error: error, options: options }
              })
          ); //after mongoose.createConnection() response, resolve/reject this promise
          //the error occures on mongoose, not mongoDB, success here doesn't mean we have a success connection to the real database
          //mongoose.connect() is the default connection using .createConnection, here every instance has only one connection

          // https://nodejs.org/api/events.html#events_emitter_once_eventname_listener
          //todo: needs review
          //todo: return a promise.resolve(this,status) ,on('error',reject(e))
        },
        done, //todo: pass this.connection to done()
        fail
      );

      return this.promise;
    }); //run
  }

  encode(str: string) {
    return encodeURIComponent(str).replace(/%/g, "%25");
  }

  on(event, callback, once?: boolean) {
    /*
    ev(event,callback) will not work because it cantains "this" whitch refers to this.connection, not to this class
    so we use ev.call() to change the context to this.connection
   */ return eldeeb.run(
      once ? "once" : "on",
      () => {
        if (this.connection) {
          let ev = once ? this.connection.once : this.connection.on;
          //console.log('==ev==', ev)
          //console.log('==this==', this.connection)
          //console.log(ev('error')); //OK gives mongooseError
          //console.log('conn:', this.connection) //OK
          //console.log('ev:', this.connection.on('error', function() {})) //error!
          if (event == "all")
            event = [
              "connected",
              "disconnected",
              "reconnected",
              "connecting",
              "reconnecting",
              "disconnecting",
              "index",
              "close",
              "error",
              "open"
            ];
          if (event instanceof Array) {
            for (let i = 0; i < event.length; i++) {
              //todo: useing var instead of let gives a wrong (i) inside function(){..}, why?
              ev.call(this.connection, event[i], function() {
                callback(event[i]);
              });
            }
          } else ev.call(this.connection, event, callback); //todo: if once .once(..)
        }
        return this; //chaining this function will NOT wait it to finish, so on(error,fn).on(open,fn) will work fine
      }
    );
  }

  once(event, callback) {
    return this.on(event, callback, true);
  }

  schema(
    obj: types.dbMongoDB.schemaObj | mongoose.Schema,
    options?: object,
    indexes?: Array<object | [object, object]> // [{fields} | [{fields},{options}] ]
  ): mongoose.Schema {
    return eldeeb.run("schema", () => {
      /*
        todo: if(options.times){
          createdAt: { type: Date, default: Date.now },
          modifiedAt: { type: Date, default: Date.now },
        }
        */
      /*
        adjust adds properties 'after' creating mongoose.schema (ex: statics,methode,...)
        fields are added to obj (i.e before creating the schema)

        */

      obj = obj || {};
      options = options || {}; //console.log('Options:', obj)
      let schema: mongoose.Schema,
        adjust = options["adjust"] || {};
      delete options["adjust"];

      if (<mongoose.Schema>obj) schema = <mongoose.Schema>obj;
      else {
        //if(<schemaObj>obj) or eldeeb.objectType(obj) == "object"
        if ("fields" in options) obj = eldeeb.merge(obj, options["fields"]);
        delete options["fields"];

        if ("times" in obj && obj.times !== false) {
          if (eldeeb.objectType(obj.times) !== "array")
            (<[types.dbMongoDB.timeStamp, types.dbMongoDB.timeStamp]>obj.times) = [
              <types.dbMongoDB.timeStamp>obj.times,
              <types.dbMongoDB.timeStamp>obj.times
            ];
          if (!("createdAt" in obj) && obj.tomes[0] !== false) {
            //obj.times dosen't override obj.createdAt ot obj.modifiedAt
            // to supress createdAt: pass false to times[0] or to createdAt(deprecated)
            obj.createdAt = {
              type: Date,
              default: obj.times[0] === true ? Date.now : obj.tomes[0]
            };
          }

          if (!("modifiedAt" in obj) && obj.tomes[1] !== false) {
            obj.modifiedAt = {
              type: Date,
              default: obj.times[1] === true ? Date.now : obj.tomes[1]
            };
          }

          delete obj.times;
        }

        /*
        deprecated! use obj.times instead of obj.createdAt & obj.modifiedAt
        if((<schemaObj>obj).createdAt===false)delete obj.createdAt; //or pass false to times[0]
        if(obj.modifiedAt===false)delete obj.modifiedAt;
        */

        options = eldeeb.merge({ strict: false }, options);
        schema = new mongoose.Schema(obj, options);
      }

      if (adjust) {
        //deeply modify obj fields, allowing to create base obj and modify it for each schema
        for (let key in adjust) {
          if (eldeeb.objectType(adjust[key] == "object")) {
            for (let x in adjust[key]) {
              schema[key][x] = adjust[key][x];
            }
          } else schema[key] = adjust[key];
        }
      }

      //add indexes to schema, use this option to create indexes via autoIndex:true or model.createIndexes()
      //to create indexes without adding them to schama: eldeeb.db().index(model,indexes,options)

      if (indexes && indexes instanceof Array) {
        for (let i = 0; i < indexes.length; i++)
          if (indexes[i] instanceof Array)
            schema.index(indexes[i][0], indexes[i][1]);
          //[{fields},{options}]
          else schema.index(indexes[i]); //{fields}
      }

      return schema;
    });
  }

  model(
    //renamed from db_mongoDB_model()
    coll: string,
    schema?: string | mongoose.Schema | types.dbMongoDB.schemaObj,
    options?: types.dbMongoDB.modelOptions,
    indexes?: Array<object | [object, object]>
  ) {
    //todo: field: anotherSchema ??
    if (!this.connection) return { model: null, schema: null };
    return eldeeb.run(["model", schema, options], () => {
      if (typeof schema == "string") schema = require(schema) || {}; //todo: dynamic import -> see index/json()
      else if (schema == null || typeof schema == "undefined") {
        schema = require(`${this.models}/${coll}.${this.ext}`) || {};
      }

      if (!(schema instanceof mongoose.Schema)) {
        options = options || {};
        if (!("collection" in options)) options["collection"] = coll;
        schema = this.schema(<types.dbMongoDB.schemaObj>schema, options, indexes);
      }

      return { model: this.connection.model(coll, schema), schema: schema }; //var {model,schema}=db.model(..); or {model:MyModel,schema:mySchema}=db.model(..) then: schema.set(..)
      //todo: override mongoose.model
      //don't use $super(model) because it referce to the default connection created by mongoose.connect(), not the current connection
    });
  }

  createIndex(model, index, options) {
    //todo: if(model:object)model=this.model(model); todo: directly use mongoDB
    //if schema contains indexes (schema.index()), use autoIndex:true or model.createIndexes()
    //use this function to create indexes that is not defined in the schema
    // model.collection perform native mongodb queries (not mongoose queries)
    let defaultOptions = {
      /*name:'index'*/
    }; //index name must be unique accross the table
    options = eldeeb.merge(defaultOptions, options);
    if (index instanceof Array) {
      let r = [];
      for (let i = 0; i < index.length; i++) {
        if (index[i] instanceof Array)
          return this.createIndex(model, index[i][0], index[i][1]);
        //or merge(options,index[i][1])
        else return this.createIndex(model, index[i][0], options);
      }
      return r;
    }
    return model.collection.createIndex(index, options); //promise
    /*
      eldeeb.promise(model.collection.createIndex(indexes, options),x=>x,err=>console.error(err))
      return this
      */
  }
  index(model, index, options) {
    return this.createIndex(model, index, options);
  }

  set(key, value) {
    if (eldeeb.objectType(key) == "object") {
      for (var k in key) this.set(k, key[k]);
    }
    if (key == "models") this.models = value;
    else mongoose.set(key, value);
  }

  //todo: move to mongoose-model() extends mongoose.model
  select() {
    //aggregate=select([stages])
  }

  get() {}

  shortId() {
    return shortId();
  }

  //----------------------- aggregation helpers -> move to class aggregate ------------------------ //
  replace(entry, oldString, newString) {
    return {
      $trim: {
        input: {
          $reduce: {
            input: {
              $split: [entry, oldString]
            },
            initialValue: "",
            in: {
              $cond: [
                { $eq: ["$$this", ""] }, //todo: or null
                "$$value",
                { $concat: ["$$value", newString, "$$this"] }
              ]
            }
          }
        },
        chars: newString
      }
    };
  }

  implode(array, delimeter) {
    delimeter = delimeter || ",";
    return array; //todo: return a string of elements separated by the delimeter
  }
  //----------------------- /aggregation helpers ------------------------ //
}

/*class db_mongoDB_model extends mongoose.Model {
  constructor(public coll, public schema) {
    super(coll, schema);
    return this;
    //todo: test: this code changed from return super(..); https://stackoverflow.com/questions/26213256/ts2409-return-type-of-constructor-signature-must-be-assignable-to-the-instance
  }
}*/
