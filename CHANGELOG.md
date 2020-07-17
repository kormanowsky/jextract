### Changes since v1.0.0
- Internet Explorer is NOT longer supported. To use jExtract with that browser, downgrade to v0.0.7 (no longer maintained).
- jExtract now supports Node.js
- jExtract accepts only 2 parameters: struct and options. Options are described in README. 
- jExtract's per-key options now accept an object of options as the forth parameter. Per-key options are described in README. 
- jExtract throws JExtractErrors instead of calling `console.error`
- Custom filter methods receive plain String object instead of jExtract's own Text object. To work with Text object, just extend it. 
- `jExtract.addTextMethod(name, method)` renamed to `jExtract.extendText({ name1: method1, name2: method2, ... })`, `jExtract.addElementMethod` renamed to `jExtract.extendElement` with identical parameters. 
- Note: you cannot use `this` in custom methods defined as arrow functions. Define these arrow functions as shown below: 
```javascript 
let myMethod = textInstance => { 
  // stuff with textInstance 
  return textInstance.get().toLowerCase(); // This is just an example
}
```
- Removed short name: `$E` from window object to improve code readability. 

### Changes since v0.0.7
- Level of independence from jQuery has increased: all elements you pass as parent will be converted to jExtract own Element object. It's done to let developers extend jExtract by adding their own data getting methods (they are described here: *Readme -> Data getting method*) and filter methods (they are described here: *Readme -> Filter methods*).
- You now can extend jExtract. See *Readme -> Extend* jExtract for more.
### Changes since v0.0.6
jExtract does not depend on jQuery, but pure-JavaScript version supports only getting text and attributes from element. 
If you need more, include jQuery, or post an issue for me to know what functionality is needed.
Actually, there are two modes of working: 
1. With jQuery: 
If you include jQuery before jExtract, it will work with jQuery and use jQuery methods. It will be possible to do something like this: 
```javascript 
var data = $("#element").jExtract(someStructure);
```
2. Without jQuery: 
jExtract will use pure-JS methods to get data from HTML. 
