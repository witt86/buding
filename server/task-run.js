if(!process.env.__ISCOMPILING__ && process.env.NODE_ENV!='production'){
    console.dir("global.__ISCOMPILING__ = false, load babel-register ...");
    require('babel-register');
}
//
require('./task');