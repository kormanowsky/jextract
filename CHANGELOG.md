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