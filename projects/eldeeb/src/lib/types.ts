/*
///<reference types="node" />
///<reference types="../../node_modules/@types/node/fs" />
///<reference path="../../node_modules/@types/node/fs.d.ts" />
contains all types for all classes, organised in namespaces, each namespace contain types declarations for each corresponding class file
todo: namespace Vs module https://www.typescriptlang.org/docs/handbook/modules.html -> Working with Other JavaScript Libraries -> Ambient Modules
*/
namespace types{
  export namespace index {
    export type TypeOptions = {
      log?: boolean; //log some events to the console
      debug?: boolean; //add 'debugger' mark
      minLogLevel?: string;
      mark?: string; //the child class of this class ex: promise,files,...
    };

    export interface obj {
      [key: string]: any;
    }
  }

  export namespace files {
    export enum moveOptionsExisting {
      "replace",
      "rename", //todo: rename pattern ex: {{filename}}({{count++}}).{{ext}}
      "continue", //ignore
      "stop"
    }
    export interface moveOptions {
      existing: moveOptionsExisting;
    }
    export interface deleteOptions {
      files?: boolean; //delete files only, dont delete folders
      keepDir?: boolean; //if false, delete the folder content, but not the folder itself, default=false
      //[name: string]: any;
    }
    export type PathLike = import("fs").PathLike; //or use ///<referce ...>  'fs' is a Node module, so it cannot be used if this module run in the browser, we will get error: cannot resolve 'fs'
     //= string | Buffer | URL, but URL here refers to typescript/URL not node/URL
  }

  export namespace data {

  }

  export namespace promise {
    export type FN = <T>(
      resolve?: RESOLVE<T>,
      reject?: (reason?: any) => void
    ) => Promise<T> | void | Array<T>;
    export type RESOLVE<T> = (value?: T | PromiseLike<T>) => void;
    export type NEXT = ((x?: any) => any);
  }

  export namespace error {
    export interface ErrObj {
      num?: number;
      type?: string;
      msg?: string;
      link?: string;
      details?: any;
    }
    export type Err = number | Array<any> | ErrObj | (() => Err);
  }

  export namespace dbMongoDB {
    //timestamp : true = Date.now | $timestamp | (()=>number) = Date.now | {type:Date, default: timeStamp}
    export type timeStamp =
      | boolean
      | number
      | (() => number)
      | { type: DateConstructor; default: number | (() => number) };

    export interface schemaObj {
      fields?: object;
      agjust?: object;
      times?: timeStamp | [timeStamp, timeStamp]; //or timestamp[] or Array<timeStamp>
      createdAt?: timeStamp;
      modifiedAt?: timeStamp; //todo: modifiedAt?:this.createdAt
      [key: string]: any;
    }

    //todo: specify keys for connectionOptions, modelOptions
    export interface connectionOptions extends index.obj {}
    export interface modelOptions extends index.obj {}
  }
}
