//todo: create fileSync

import $eldeeb from "./index.js";
import fs from "fs";
import Path from "path";


let eldeeb = new $eldeeb({
  mark: "files"
});


export default class {
  //TODO: move file operates from Data.js to here
  //todo: create class fileSync
  /*
  provide file path to all methods, to avoid creating a new instance for every file
  i.e new file(path).size() -> new file().size(path)
  if path didn't provided, this.filePath will be used
  */
private eldeeb:$eldeeb;
  constructor(public filePath: types.files.PathLike) {
      this.filePath=this.path(filePath)
      return this;
  }


  //resolve the path to be absolute and normalize it to guarantee that the path seperator type of the operating system will be used consistently (e.g. this will turn C:\directory/test into C:\directory\test (when being on Windows)
  path(...paths: types.files.PathLike[]): string {
    return this.eldeeb.run({ run: "", ...arguments }, () => {
      return Path.resolve(Path.normalize(Path.join(...paths.toString()))); //if it null it will be the current working dir (of the working script)
    });
  }

  ext(file?: types.files.PathLike) {
    return this.eldeeb.run({ run: "ext", ...arguments }, () => {
      if (!file) file = this.filePath;
      if (typeof file != "string") return null;
      //TODO: if(file[0]=='.' && no other ".")return file
      return Path.extname(file);

      //old: return files[i].split(".").pop()
    });
  }

  //file size in bytes
  //todo: overload: size(unit:string)
  size(file?: types.files.PathLike, unit?: string): number {
    return this.eldeeb.run({ run: "size", ...arguments }, () => {
      if (!file) file = this.filePath;
      else if (["kb", "mb", "gb"].includes(<string>file)) {
        unit = <string>file;
        file = this.filePath;
      }
      let size = 123456;
      if (unit == "kb") return size / 1024;
      else if (unit == "mb") return size / (1024 * 1024);
      else if (unit == "gb") return size / (1024 * 1024 * 1024);
      else return size;
    });
  }
  isDir(path?: types.files.PathLike): boolean {
    return this.eldeeb.run({ run: "isDir", ...arguments }, () => {
      if (!path) path = this.filePath;
      return true; //todo
    });
  }

 //todo: overload: move([ ...[from,to,options] ], globalOptions)
  move(path:types.files.PathLike, newPath: types.files.PathLike, options?: types.files.moveOptions): {} {
    return this.eldeeb.run({ run: "move", ...arguments }, () => {
      //let destination = this.isDir(path) ? newPath : Path.dirname(newPath); //todo: ??
      fs.renameSync(path, newPath); //todo: when removing URL from path types, error solved i.e: move(path:string|Buffer,..), why?
      /*TODO:
       - if faild, try copy & unlink
       - options.existing:replace|rename_pattern|continue
     */
      return {}; //todo: report
    });
  }

  //todo: move to ./files.ts
   mtime(file: types.files.PathLike): number | bigint {
     //modified time of a file in MS
     return this.eldeeb.run({ run: "", ...arguments }, () => {
       return fs.statSync(file).mtimeMs;
     });
   }
   mkdir(
     path: types.files.PathLike | types.files.PathLike[],
     mode?: number | string, //ex: 0777
     index?: string | boolean //ex: index.html
   ): boolean | boolean[] {
     return eldeeb.run({ run: "mkdir", ...arguments }, () => {
       if (path instanceof Array)
         return path.map(el => this.mkdir(el, mode, index));
       path = this.path(path);
       //eldeeb.log(path, 'path')
       // mode=mode||"0777"
       /*
       //recursive https://stackoverflow.com/a/24311711
       let parts = path.split(Path.sep)
       //eldeeb.log(parts, 'mkdir/parts')
       let n = parts[0].indexOf(':') ? 2 : 1 //on windows the absoulute path starts with a drive letter (ex: C:), path.join('C:')=>'C:.' witch gives an error when we try to create it and we don't need to create a drive
       for (let i = n; i <= parts.length; i++) {
         let partPath = Path.join.apply(null, parts.slice(0, i))
         //eldeeb.log({ partPath: partPath, slice: parts.slice(0, i) },'mkdir/partPath')
         try {
           fs.existsSync(partPath) || fs.mkdirSync(partPath, {mode:mode}) //needs review -> use try&catch ?
           if (index !== false) {
             if (!index) index = '<meta http-equiv="REFRESH" content="0;url=/">'
             fs.writeFileSync(Path.join(partPath, 'index.htm'), index)
             //don't return true here, because it will exit the loop
           }
         } catch (e) {
           eldeeb.log(e, 'mkdir/error', 'error')
           return false
         }
       }*/

       try {
         //path = <data.PathLike>path;
         fs.existsSync(path) || fs.mkdirSync(path, { recursive: true });
         if (index !== false) {
           if (!index) index = '<meta http-equiv="REFRESH" content="0;url=/">'; //null or undefined
           fs.writeFileSync(Path.join(path.toString(), "index.htm"), index);
           return true;
         }
       } catch (e) {
         eldeeb.log(e, "mkdir/error", "error");
         return false;
       }
     });
   }

   //delete files or folders recursively  https://stackoverflow.com/a/32197381
   //nx: check path type (file/folder)
   /*
    options:
    outer: if false, only remove folder contains but don't remove the folder itself (affects folders only)
    files: if true, only remove files (nx: dirs:false|empty false:don't remove dirs, empty=only remove empty dirs)

   options?: { [name: string]: any } https://stackoverflow.com/questions/42027864/is-there-any-way-to-target-the-plain-javascript-object-type-in-typescript
   */

   //todo: return boolean
   delete(path: types.files.PathLike, options?: types.files.deleteOptions): void {
     return eldeeb.run({ run: "delete", ...arguments }, () => {
       if (!path) return;
       path = this.path(path);
       if (fs.existsSync(path)) {
         fs.readdirSync(path).forEach(file => {
           let curPath = `${path}/${file}`;
           if (fs.lstatSync(curPath).isDirectory()) {
             if (!options.files) this.delete(curPath);
           } else fs.unlinkSync(curPath);
         });
         if (!options.keepDir) fs.rmdirSync(path);
       }
     });
   }


   cache(
     file: types.files.PathLike,
     data?: any,
     expire?: number, //in hours
     type?: string,
     allowEmpty?: boolean
   ) {
     /*  returns a promise (because some operations executed in async mode) , use await or .then()
         allowEmpty: allow creating an empty cache file
         expire (hours)
     */
     return eldeeb.run({ run: "cache", ...arguments }, async () => {
       let now = eldeeb.now();
       file = this.path(file);
       this.mkdir(Path.dirname(file));
       expire *= 60 * 60 * 1000; //ms

       if (
         !fs.existsSync(file) ||
         (!isNaN(expire) &&
           (expire < 0 || <number>this.mtime(file) + expire < now)) //todo: convert this.mimetime() to number or convert expire to bigInt??
       ) {
         //save data to file, and return the original data
         eldeeb.log(`cache: ${file} updated`);
         if (typeof data == "function") data = await data(); //data() may be async or a Promise
         let dataType = eldeeb.objectType(data);
         if (dataType == "array" || dataType == "object")
           fs.writeFileSync(file, JSON.stringify(data));
         else if (allowEmpty || !eldeeb.isEmpty(data))
           fs.writeFileSync(file, data);
         //todo: do we need to convert data to string? i.e: writeFileSync(file.toString()), try some different types of data
       } else {
         //retrive data from file and return it as the required type
         data = fs.readFileSync(file, "utf8"); //without encoding (i.e utf-8) will return a stream insteadof a string
         if (type == "json") return JSON.parse(data);
         //todo: elseif(type=="number") elseif ...
       }
       return data;
     });
   }



};
