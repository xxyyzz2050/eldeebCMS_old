/// <reference path="./types.ts" />

/*
todo:
- transpiler to auto inject eldeeb.run(), using notation @eldeeb.run()
- run(): auto get function name & arguments list,
- run(): mark may be object: arguments -> if(mark:obj && mark.collee)mark={run:mark/mark.callee.name,...arguments}
*/
import util from "util";

/*
// moved to index.d.ts
export type FN = import("./promise").FN; //https://stackoverflow.com/a/52115295; export type FN=...
export type NEXT = import("./promise").NEXT;
export type ERROR = import("./error").Err;
*/

/*
//todo: the problem is that typescript types are not available in runtime (i.e JS code), so we cannot use it as a value or a plain obj property
export const types = {
  //or move it inside the class as a class property
  promise: {
    FN: (import("./promise") as any).FN, //why "as any" removed the error?; test:types.promise.FN -> cannot find namespace types
    NEXT: import("./promise").NEXT
  },
  ERROR: import("./error").Err
};*/

//todo: convert from plain object to class to use TypeScript  features, other codes must instance it i.e: new eldeeb(options)
//todo: dynamically import types

//console.log('util:', util) //using require&module.exports will prevent this line from calling when run via localhost (called when run via cmd) ,the problem is in : eldeeb/index/isArray->Symbol.iterator, adding quotes will fix it obj['Symbol.iterator'] but it will return a wrong value; may be the error is by Nuxt or babel
export default class {
  constructor(public options?: types.index.TypeOptions) {
    let defaultOptions: types.index.TypeOptions = {
      log: false, //nx: min log level
      minLogLevel: "log", //log,warn,error (verbose)
      debug: false,
      mark: "" //mark prefix
    };
    //toDo: merge options with defaultOptions
    this.options = this.merge(defaultOptions, options);
  }

  /*
todo: what is the usage of this function?
  mode(mode: string):string | boolean {
    if (mode == "dev") mode = "development";
    return mode ? process.env.NODE_ENV == mode : process.env.NODE_ENV;
    // or: return mode ? mode=="dev"?"development":process.env.NODE_ENV:undefined;
  }*/

  run(mark?: any, fn?: () => any, isPromise?: boolean): any {
    //nx: create function overloads
    //always use arrow function to keep "this" referce to the original function context (not "run()" context)
    //nx: mark="eldeeb:"+this.run.caller (not allowed in strict mode), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments/callee
    /*
     if fn returns a value, you mast return this.run()
     ex test(){
           return eldeeb.run("test",function(){return 123});
         }
         alert(test()); //123

         nx: to use await pass async fn, ex: this.run(async fn(){await sleep(1); alert(1);});
    */

    /*if (typeof promise == "function") {
      fn = promise;
      promise = false;
    } else if (typeof mark == "function") {
      fn = mark;
      mark = "";
      //  promise=false
    }*/

    if (this.options.debug) debugger;
    if (typeof fn != "function") {
      if (this.options.log)
        console.warn("eldeeb run: not a function ", mark, fn);
      return;
    }

    if (typeof mark == "string")
      mark = (this.options.mark != "" ? this.options.mark + "/" : "") + mark;
    else if (mark instanceof Array)
      mark[0] =
        (this.options.mark != "" ? this.options.mark + "/" : "") + mark[0];
    else if (this.objectType(mark) == "object" && mark.run)
      mark.run =
        (this.options.mark != "" ? this.options.mark + "/" : "") + mark.run;

    if (!isPromise) {
      try {
        let f = fn();
        if (mark && this.options.log) console.log("success: eldeeb:", mark, f);
        return f;
      } catch (e) {
        this.err(e, mark, fn);
      }
    } else {
      let promise = new Promise(fn); //fn must resolve the promise, fn(resolve,reject){if(finished)resolve(value)}
      if (mark && this.options.log)
        console.log("promise: eldeeb:", mark, promise /*, fn*/);
      return promise;
    }
    //note that any console.log() inside fn() will appear BEFORE console.log("Success:**"), success must be at the end of try{}
    //don't concatenate mark (or other objects) to expand them to show their properties (concatenation will cast it to string)
  }

  err(e: any, at?: number | string, extra?: any): void {
    //todo: e:Error
    //  if (typeof at == "undefined") at = "eldeeb.js";
    console.error(
      `Error @eldeeb: ${at} ${e.name}${
        e.message ? ": " + e.message : e.description ? ": " + e.description : ""
      }\n${
        e.lineNumber ? " @" + e.lineNumber + " in" + e.fileName + "\n" : ""
      }${e.stack ? e.stack : ""}\n->`,
      extra ? extra : ""
    );
    //console.error("Error @eldeeb: " + at + "(" + e.name + "): " + e.message + " @" + (e.lineNumber || "") + ":" + (e.columnNumber || "") + " in: " + (e.fileName || "--") + " \n->", (extra ? extra : "")) //+"; by:"+(e.stack||e.description||"")
  }

  log(obj: any, mark?: string | Array<any>, type?: string): void {
    //nx: log(mark='',type='log',...obj)
    if (!this.options.log || process.env.NODE_ENV != "development") return;
    mark = mark || "";
    type = type || mark == "error" ? "error" : "log";
    obj = util.inspect(obj, {
      maxArrayLength: null,
      depth: null,
      colors: true,
      //compact: false,
      breakLength: 100
    });
    if (typeof mark == "string")
      mark = (this.options.mark != "" ? this.options.mark + "/" : "") + mark;
    else if (mark instanceof Array)
      mark[0] =
        (this.options.mark != "" ? this.options.mark + "/" : "") + mark[0];

    console[type](`---\n ${mark}:\n`, obj, "\n---");
  }

  now(): number {
    //ms
    return Math.round(new Date().getTime());
  }

  isArray(obj: any): boolean {
    return (
      obj &&
      (obj instanceof Array ||
        (typeof obj != "string" && typeof obj[Symbol.iterator] == "function"))
    );
  }

  inArray(
    el: any,
    arr: Array<any> | object | string,
    sensitive?: boolean //case sensitive
  ): boolean {
    return this.run({ run: "eldeeb/inArray", ...arguments }, () => {
      if (!sensitive && typeof el == "string") el = el.toLowerCase();
      if (this.isArray(arr)) {
        for (let i = 0; i < (<Array<any>>arr).length; i++) {
          if (!sensitive && typeof arr[i] == "string")
            arr[i] = arr[i].toLowerCase();
          if (arr[i] == el) return true;
        }
      } else if (typeof arr == "object") return el in arr;
      else if (typeof arr == "string") return arr.indexOf(el);
    });
  }

  sleep(seconds?: number) /*: Promise<number>*/ {
    //todo: return type: Promise<T???>
    //to pause a js function make it async and use await sleep(duration);
    //ex: this.run(async fn(){await this.sleep(1); alert(1);})
    if (!seconds) seconds = 2;
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  //assigns a default value to a variable; if(!x)use y
  //or: df<A,B>(x:A,y:B):A|B
  df(x: any, y: any): typeof x | typeof y {
    //todo: test if it works (i.e it capures the typeof x,y not use 'any'), try df(1,2){return "string"}
    return typeof x == "undefined" ? y : x;
  }

  objectType(obj: any): string {
    return Object.prototype.toString
      .call(obj)
      .replace("[object ", "")
      .replace("]", "")
      .toLowerCase();
    /*
    examples:
   {} => object
   [] => array
   null => null
   function(){} => function
   1 => number
   "x", 'x', `x` => string
   */
  }

  isEmpty(obj: any): boolean {
    return typeof obj == "undefined" || this.inArray(obj, ["", null, [], {}]);
  }

  /*
   log:function(...msg){
    if(msg[0]=="e" || msg[0]=="error"){msg.shift();cns=console.error;}
    else if(msg[0]=="w" || msg[0]=="warn" || msg[0]=="warning"){msg.shift();cns=console.warn;}
    else{
      if(msg[0]=="log")msg.shift();
      cns=console.log;
    }
    cns(...msg);
  },*/

  merge(target: any, ...obj: any[]): any {
    //merge objects,arrays,classes (must besame type) ;
    //don't use "arguments" in an arrow functions, also don't use 'this' inside a normal function, so we declare a new variable = arguments
    let _arg = arguments; //the arguments of merge() not run()
    return this.run(["merge", ..._arg], () => {
      let type = this.objectType(target); //todo: error: Cannot read property 'objectType' of undefined
      for (let i = 1; i < _arg.length; i++) {
        if (this.objectType(_arg[i]) !== type) return target;
      }
      if (type == "array") {
        target = target.concat(...obj);
      } else if (type == "object") {
        //target=Object.assign(target,...obj) //later objects dosen't override previous ones
        for (let i = 1; i < _arg.length; i++) {
          for (let p in _arg[i]) {
            target[p] = _arg[i][p]; //to override current values
          }
        }
      } else if (type == "class") {
        //add or override target's methods & properties
      }

      return target;
    });
  }

  json(data: string | object) {
    if (typeof data == "string") {
      if (data.trim().charAt(0) == "{") return JSON.parse(data);
      if (
        data
          .split(".")
          .pop()
          .toLowerCase() == "json"
      )
        return require(data); //load a .json file, todo: ES2015 modules don't allow dynamic imports, and causes typescript error: 'Critical dependency: the request of a dependency is an expression'
      data = require("fs").readFileSync(data);
      return JSON.parse(<string>data);
    } else return JSON.stringify(data);
    //nx: if(string & !start)
  }

  // =======================================================================================//
  //dynamically Loading modules, deprecated to remove ciclic dependencies i.e index reqires promise whitch requires index, consumer to import the proper class

  /*  db(
    type: string,
    options: object,
    done?: () => any,
    fail?: () => any,
    events?: any
  ) {
    if (typeof type == "undefined" || type == "mongo" || type == "mongoose")
      type = "mongoDB";

    //todo: swipe arguments; create overload functions
    //else if (this.objectType(type) == "object") {fail = done;done = options;options = type;type = "mongoDB";}
    let db = require(`./db-${type}.js`).default;
    return new db(options, done, fail, events); //nx: if file_exists
  }

  promise(fn: types.promise.FN, done?: types.promise.NEXT, failed?: types.promise.NEXT) {
    //eldeeb = this
    let promise = require("./promise.js").default;
    return new promise(fn, done, failed);
  }

  when(fn: () => any, done?: () => any, failed?: () => any) {
    return this.promise(fn, done, failed);
  }

  error(error: types.error.Err, throwError?: boolean, jsError?: boolean) {
    let err = require("./error.js").default;
    return new err(error, throwError, jsError);
  }

  files(root: string) {
    let files = require("./files.js").default;
    return new files(root);
  }
  */
}
