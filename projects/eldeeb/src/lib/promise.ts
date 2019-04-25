/*
import x=require(); for types only http://www.typescriptlang.org/docs/handbook/modules.html#optional-module-loading-and-other-advanced-loading-scenarios
//todo: https://github.com/Microsoft/TypeScript/issues/15397 , https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work ,

*/

import $eldeeb from "./index.js";

let eldeeb = new $eldeeb({
  mark: "promise"
});
//or: eldeeb.options.mark = "promise";

/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

promise.finally() is 'Draft' https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally

 promise.when("any value,will be immediatly resolved",x=>"inline then",err=>{})
         .then(x=>"separated then",err=>{})
         .done(x=>"=then(done,null)")
         .fail(err=>"=then(null,fail,stop=true)")
         .catch(err=>"=then(null,fail,stop=false), if 'stop=true' this will not run")
         .when(new promise(),x=>"another instance")
         .when(new Promise(function(){}),"x"=>"unresolved promise can be settled using .resolve() & .reject()")
         .resolve(x=>"resolved")
         .wait(5,x=>"wait 5 seconds")
         .all([p1,p2,p3],(r1,r2,r3)=>"wait untill all tasks finished",(err`,err2,err3)=>{})
         .stop()
         .done(x=>"will not run")
         .done(x=>"this also stop() and exit the chain",true)
         .fail(err=>"only works if the previous promise rejected",false)
         .done(x=>"the previous fail() will catche the exception and pass a new resolved promise, let's try another resource")
         .fail(err=>"in case of failure don't continue, so we will stop",true)

         - Don't use custom methode by this class after Native Promise methods until it have been overridden, because they return promise (not "this")
         - important: all functions must apply .then() to wait the previous function in the chain ex: promise().wait(3).done(x=>log(x)).wait(1).done(..) wait(1) will not wait untill wait(3) finish untill it apply .then() before returning a value
         - nx: control timeout that returned from wait(), wait() must return a promise (not timeout) and resolve(timeout) cause the next .then() wait untill wait() finish then receive timeout

*/

//type FN = ((resolve?: any, reject?: any) => any) | Array<any>;
//from: lib.es2015.promise.d.ts (but it also returns void | Array of race functions)

 interface Timer extends NodeJS.Timer {
    seconds?:number | (() => number)
}

export default class extends Promise<any> {
  //todo: class promise<T> extends Promise<T>
  /*
  why Promise<any>? check theese links
  https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#customevent-is-now-a-generic-type
  https://github.com/Microsoft/TypeScript/issues/21549
  */
  public clearTimeout: <T>(value?: T | PromiseLike<T>) => void; //same type of resolve; check this.wait(); //todo: remove from class properties, move scope to .wait()
   private _promise:Promise<any>;
  constructor(
    fn: any, //promise.FN | Array<promise.FN>,
    done?: types.promise.NEXT,
    failed?: types.promise.NEXT,
    public $stop?: boolean
  ) {
    //wait until fn finish excuting, fn() has to settle (resolve or reject) the promise
    //stop is used in case of a new instance is created from anoter context ex: this.wait(1) will create another instance and may like to stop the chain after resolving it
    //if fn is array of functions-> apply this.all() or: {all:[fn1,..]} because it can be any other array
    super(fn); //todo: temporary for typescript
    return eldeeb.run({ run: "{}", ...arguments }, () => {
      if (typeof fn != "function") {
        if (eldeeb.objectType(fn) == "array") {
          //array of functions or promises
          let tmp = fn; //don't use: fn=r=>Promise.all(fn)
          this._promise= Promise.all(tmp).then(done, failed);
        }
        //todo: cannot use this.all() before super()
        //else fn = r => r(fn); //todo: what is r??
      }
      this.$stop = false;
      if (done || failed) this._promise= this.then(done, failed, $stop);

      return this; //don't return promise to enable chaining for other (non-Promise) functions such as done() and to customise then, also typescript don't allow returning any other type than 'this'
    });
  }
  when(
    fn: any,
    done?: types.promise.NEXT,
    failed?: types.promise.NEXT,
    stop?: boolean
  ) {
    console.log(this)
    return new (<any>this)(fn, done, failed, stop); //todo: removing <any> gives typescript error: cannot use 'new' within an expression whose type lacks a call or construct signature

    /*
    now wait() creats a new instance of this class, before it was change this.promise value witch make problems:
    ex: this.all(this.wait(1),this.wait(2)) => both share the same this.promise value whitch store only the latest value
    fot(..){if(p[i] instanceof this.constractor)p[i]=p[i].promise} -> give the same promise to all promises whitch is wrong
    this.all(p1,p2,p3).done(..) -> .all() returns this, and the next done() works with this.promise i.e the last promise value whitch is wrong because it dosen't match the array of promises in .all(), if .all() set this.promise=[promises] how done() will use this array?
    */
  }

  wait(
    seconds: number | (() => number),
    done?: types.promise.NEXT,
    fail?: types.promise.NEXT,
    stop?: boolean
  ) {
    return eldeeb.run({ run: "wait", ...arguments }, () => {
      //pause the script & pass a timeout object to the next .then() (contains: seconds) https://nodejs.org/api/timers.html#timers_class_timeout
      //to canxel it: clearTimeout(timeout)
      if (typeof seconds == "function") seconds = seconds();
      else if (typeof seconds != "number") seconds = 0;
      return eldeeb.run(["wait", seconds], () => {
        //https://stackoverflow.com/questions/53237418/javascript-promise-a-problem-with-settimeout-inside-a-promise-race
        return this.then(() =>
          //todo: is it necessary to run .when() inside .then()? i.e remove .then()
          this.when(
            //todo: why using .when() inside .then()
            resolve => {
              this.clearTimeout = resolve; //to stop it from outside  or this.clearTimeout(timeout)
              let timeout:Timer = setTimeout(function() {
                timeout.seconds = seconds; //=(timeout._idleTimeout)/1000 ;todo: allow typeScript to add new property to an object, or extend the object difinition (modifing difinition is not available)
                resolve(timeout); //returning "timeout" will immediatley call the next .then(), and using resolve(timeout) will orevent the next .then() from using it untill it finished
              }, <number>seconds * 1000);
            },
            done,
            fail,
            stop
          )
        );
      });

      /*resolve=>{
          let timeout =setTimeout(resolve, seconds * 1000)
          timeout.seconds = seconds
          return timeout //wrong, this will return before setTimeout finish


          resolve=>setTimeout(resolve,seconds*1000,seconds) //it works, but how to pass timeout instead of seconds
          resolved=>{var timeout=setTimeout(...,timeout)} also failed
        }*/

      //nx: pass timeout insteadof seconds or [{timeout object},seconds] to control the timeout (ex: clearTimeout), note that Promise.resolve() occepts only one parameter ,so the second parameter (4th argument) of setTimeout() will be ignored [Solved by defining timeout]
      //nx: this function immediatly returns seconds then wait until setTimeout finished
      //or: ()=>{setTimeout(fn(){}) return seconds}
      //or: return timeout id to control it (clearTimeOut(id))

      /*
       //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
        return eldeeb.run('delay', false, () => {
          //don't return a promise, return a function, because when() accepts a function
          return new Promise(resolve => setTimeout(resolve, seconds * 1000))
        })*/
    });
  }


  then(done?: types.promise.NEXT, fail?: types.promise.NEXT, stop?: boolean): Promise<any>  {
    return eldeeb.run({ run: "then", ...arguments }, async () => {
      //nx: if the promise not settled call this.resolve()
      // nx: if (eldeeb.objectType(fn) == 'object' &&fn.then &&typeof obj.then == 'function') {//thenable object}
      if (!this.$stop) {
        if (stop) this.stop(); //for the next .then();
        let tmp: types.promise.NEXT;
        if (
          done !== null &&
          typeof done != "undefined" &&
          typeof done != "function"
        ) {
          //if done=null don't do anything, just pass the promise to the next .then(), else return the value passed to it
          tmp = done;
          done = () => tmp; //or done=()=>Promise.resolve(done) ; we return the value (or resolve it) to pass it to the next then() as a parameter
          // don't use the same name i.e done=()=>done this copy 'done' by reference, so it will always pass a function (()=>x) to the next .then()
        }
        if (
          fail !== null &&
          typeof fail != "undefined" &&
          typeof fail != "function"
        ) {
          tmp = fail;
          fail = () => tmp;
        }
        //return this.when(done, fail, false, true)
        //console.log('done:', done)
        //console.log('fail:', fail)
        return this._promise.then(done, fail)
        //return super.then(done, fail); //error: Uncaught SyntaxError: 'super' keyword unexpected here;  nx: how to return this as a new promise??
      }
      return this;
    });
  }
  done(done: types.promise.NEXT, stop?: boolean) {
    return this.then(done, null, typeof stop == "undefined" ? true : false); //default:stop=true
  }

  fail(fail: types.promise.NEXT, stop?: boolean) {
    //same as catch() but eits the chain by default
    return this.then(null, fail, typeof stop == "undefined" ? true : false);
  }

  /*catch(fn, stop) {
    //catche the current exception then pass a new resolved Promise
    //same as fail() but the default value of stop is false, so it will only catch the error and continue the chain without existing the chain
    return this.then(null, fn, stop)
  }*/

  stop() {
    //exit the current chain, i.e don't run the next functions; to resume the chain: set this.stop=false or create a new promise instance, but dont make a new chain ex: p.stop().then(..)  p.then(..)
    //ex: p.then(()=>if(true)p.stop()).then(..)
    this.$stop = true;
    return this;
  }

  complete(fn: types.promise.NEXT, done?: types.promise.NEXT, fail?: types.promise.NEXT) {
    //=finally() but default value of stop=true
    //return this.then(fn, done, fail, typeof stop == "undefined" ? true : false);
    this.stop(); //todo: test if this line must be after this.finally()
    return this.finally(fn, done, fail);
  }

  finally(fn: types.promise.NEXT, done?: types.promise.NEXT, fail?: types.promise.NEXT) {
    //here fn is NEXT not FN, because it will be escecuted inside .then() i.e as done not as an executor function
    //return this.then(fn).then(done, fail);  //temporary until finally oficially released, now promise.finally still in 'Draft' https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally
    return this.finally(fn).then(done, fail);
  }

  limit(seconds: number, ...fn: Array<() => any>) {
    //nx: test this function by loading a big resource via ajax or reading a big file
    //nx: limit(1000).then().then() //or .exec()
    //max time limit for excuting fn()
    return eldeeb.run({ run: "limit", ...arguments }, () => {
      return Promise.race([
        new Promise(
          reject =>
            setTimeout(
              () => reject(new Error("request timeout")),
              seconds * 1000
            ) //nx: custom error
        ),
        ...fn
      ]);
    });
  }

  //###### static methods: race,all,reject,resolve; use Promice.race() not this.promise.race
   all(promises: Array<any>, done?: types.promise.NEXT, fail?: types.promise.NEXT) {
    //if (!eldeeb.isArray(promises)) return this; //nx: or any iterable ->see eldeeb.isArray()
    return this.then(() => Promise.all(promises)).then(done, fail);
    //done() accept array of arguments, one for each promise
    /*
      nx:
       - to wait for the previous function in the chain this function must be used inside .then() or return .then(promise)
        - if (this) passed, convert it to a promise ex: this.wait(1).promise ->super() must holde the current promise
        - allow separated .then() with all ex: .all([promises],done,fail) working, but .all([promises]).done(value) only pass one value (not array)
      */
  }

  race(promises: any[], done?: types.promise.NEXT, fail?: types.promise.NEXT) {
    return eldeeb.run({ run: "race", ...arguments }, () => {
      //typically same as .all()
      if (!eldeeb.isArray(promises)) return this;
      return this.then(() => Promise.race(promises)).then(done, fail);
    });
  }

  resolve(value?: any, seconds?: number) {
    return eldeeb.run({ run: arguments.callee.name, ...arguments }, () => {
      if (seconds) return this.wait(seconds).resolve(value);
      Promise.resolve(value);
      return this;
    });
  }

  reject(error?: any, seconds?: number) {
    if (seconds) return this.wait(seconds).reject(error);
    Promise.reject(error);
    return this;
  }
}
//############3 /Static methods
