# jextract
Allow extracting data from DOM using jQuery
## Example:
DOM:
```html
    <span id="user-name">John</span>
    <span id="user-age">27</span>
```
JS:
```javascript
   var data = jExtract({
    name: "#user-name",
    age: "#user-age"
  }); 
// data = {name: "John", age: "27"}
```

