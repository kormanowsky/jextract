# jExtract
## What is this function for?
It makes possible extracting data from DOM. 
May be useful when you are working with data from websites that don't have any data APIs. In that case you can use this function to read data directly from DOM (or HTML string).
### Live Demo: https://jsfiddle.net/475d24ts/
### Warning! Internet Explorer is NOT supported since v1.0.0. If you need that browser to be supported, please use v0.0.7 (no longer maintained).
## Installation 
### Browser 
Just download jextract.min.js and include it in your page. 
### Node.js
```bash 
npm install jextract 
```
## Basic usage
0. Create a HTML document and include jExtract
```html
<h1 id="page-title">Hello, world!</h1>
<p id="page-content">Lorem ipsum dolor sit amet.</p>
<!-- Your HTML continues here -->
<script src="/path/to/jextract.min.js"></script>
<script>
    //Your JavaScript goes here
</script>
```
or 
```javascript 
// Import jExtract 
const jExtract = require("jextract")
```
1. Create a data structure containing CSS selectors of elements from which you need to extract data: 
```javascript
var structure = {
    title: "#page-title", 
    content: "#page-content"
};
```
2. Just pass your structure as a parameter to jExtract function and call .fromDocument(): 
```javascript
var data = jExtract(structure).fromDocument();
```
`data` will be:
```javascript 
{
    title: "Hello, world!",
    content: "Lorem ipsum dolor sit amet."
}
```
3. Now you can do anything you want with extracted data. 
## Extended usage
### jExtract has the following ways of usage: 
```javascript 
// 1. Extract data from specified root (root may be an element, a CSS selector or a HTML string)
jExtract(structure).using(options).from(root); // .using() is optional
// 2. Extract data from the whole document (only in browser)
jExtract(structure).using(options).fromDocument(); // Does not work in Node.js
```
#### Possible options 
|Name|Description|Possible Values|Default Value|
|-----|-----------|---------------|-------------|
|json|Should the output be in JSON format?|`true/false`|`false`|

### JSON as input
You can pass structure as JSON.
```javascript
var data = jExtract("JSON here").fromDocument(); 
```
### Substructures
You can add substructures into your main structure. 
```javascript
var struct = {
    key1: 'selector1',
    key2: {
        subkey1: 'selector2',
        subkey2: 'selector3'
    }
}, data = jExtract(struct).fromDocument();
```
### Options per key
By default, jExtract returns the text of matched element(s). But you can change this behavior by passing more than argument in your structure keys (`key: [selector, dataGettingMethod, filterMethod, options]` instead of `key: selector`).
#### Data getting method
It's a function that returns data that is extracted from element. 
Default: `text()`.
Before v0.0.4, jExtract used its own element object that was based on jQuery. 
Since v0.0.4 until v0.0.6, jExtract used a plain jQuery object without any additions/deletions, so you were able to call any jQuery object methods while extracting data with jExtract.
There are a few ways to pass data getting method to jExtract: 
1. a string that is a jQuery object method (e. g.: `width`);
2. an array in which first element is a jQuery object method, and others are parameters for this method (e.g.: `['attr', 'href']`);
3. your own function that recieves three parameters: `element`, `index`, `elements`: 
```javascript
var struct = {
    key1: ['div', function(element, index, elements){
        //in element -> one div (current in the loop)
        //in index -> index of this div
        //in elements -> all matched elements
    }]
}
```

Since v0.0.7, jExtract uses its own object again, but its behavior was changed. Here's what jExtract does while extracting data: 
1. It looks for method in its own object.
2. If method was not found, jExtract chacks if jQuery was loaded and then looks for method in jQuery object created from jExtract's own object.
3. If nothing was found again, it calls `console.error()` and stops extracting data from this structure key.

#### Filter method
##### Note: filter method is called only if data getting method returns a string.
It's a function that filters extracted data.
Default: `jExtractText.get()`
jExtractText is a class that exists only in jExtract function, so you can't access it outside of it. In this class I collect useful methods for working with strings. Currently supported: 
1.`jExtractText.get(trim)`: if trim is true - trims text that is stored in jExtractText and returns it. Defaults: `trim = true`.
2.`jExtractText.match(regexp, index)`: tries to match text with a given regular expression and returns a match with index = `index` if it is given or full match if is not. Defaults: no defaults.
3.`jExtractText.toInt(leaveNaN)`: tries to parseInt() text. If `leaveNaN` is true returns NaN if it appears. If `leaveNaN` is false returns 0 instead of NaN. Defaults: `leaveNaN = false`.
4.`jExtractText.toFloat(leaveNaN)`: tries to parseFloat() text. If `leaveNaN` is true returns NaN if it appears. If `leaveNaN` is false returns 0 instead of NaN. Defaults: `leaveNaN = false`.
If you want to use one of these methods, just pass a name and optionally arguments as a third parameter in your value: 
```javascript
var struct = {
    key1: [selector, dataGettingMethod, [name, ...arguments]]
}
```
If you want to use your own method, pass it as third parameter. Your method will recieve 2 parameters: `value` and `index`.
```javascript
var struct = {
    key1: ['div', 'text', function(value, index){
        // Value will be a number/boolean/etc., that was returned by dataGettingMethod.
        // Index is an ordinal number of element (starting with 0)
        return value;
    }]
}
```

Since v0.0.7, jExtract's behavior with filter methods is the following: 
1. It looks for method in its own jExtractText object.
2. If nothing was found, it looks for method in a String object created from its own object.
3. If nothing was found again, it throws an error and stops extracting data from this structure key.

#### Possible options per key
|Name|Description|Possible Values|Default Value|
|-----|-----------|---------------|-------------|
|keepArray|What to do with a single value? jExtract generates an array of values during its loop. If there is less than two elements in the resulting array, the result will contain only first element of this array. If you don't want to lose an array in the result, set this to `true`|`true/false`|`false`|

### Parent elements

By default, jExtract searches for elements in `<html>` tag. You can call .from() instead of .fromDocument() to change this:
```javascript
var data = jExtract(structure).from($("#someElement"));
```
Also you can create a substructure that will be applied to each matched element. 
Think of the following HTML: 
```html
<div class="user">
  <div class="uname">User 1</div>
  <div class="uid">1</div>
  <div class="uemail">user1example.com</div>
</div>
<div class="user">
  <div class="uname">User 2</div>
  <div class="uid">2</div>
  <div class="uemail">user2example.com</div>
</div>
<div class="user">
  <div class="uname">User 3</div>
  <div class="uid">3</div>
  <div class="uemail">user3example.com</div>
</div>
<div class="user">
  <div class="uname">User 4</div>
  <div class="uid">4</div>
  <div class="uemail">user4example.com</div>
</div>
<div class="user">
  <div class="uname">User 5</div>
  <div class="uid">5</div>
  <div class="uemail">user5example.com</div>
</div>
```
You can create an array of all users with each element filled with each user data. In your key pass two parameters: selector and a structure that you want to be applied to this selector.
```javascript
jExtract({
    user: ['.user', {
        name: '.uname',
        id: ['.uid', [], 'toInt'],
        email: '.uemail'
      }]
}).fromDocument();
```
You will get an array: 
```javascript
[
    {name: "User 1", id: 1, email: "user1example.com"},
    {name: "User 2", id: 2, email: "user2example.com"},
    {name: "User 3", id: 3, email: "user3example.com"},
    {name: "User 4", id: 4, email: "user4example.com"},
    {name: "User 5", id: 5, email: "user5example.com"}
]
```

Since v0.0.6, it's possible to pass a HTML string as parent element.

Since v0.0.7, it's possible to pass a selector as parent element.

### Referring to current element

In your values you can refer to current element using `"."` as a selector.

### Extending jExtract (since v0.0.7)

You can extend jExtract's Element and Text objects. 
- To extend jExtract's element:
```javascript
//1. Register your method
jExtract.extendElement('methodName', function(){
    //this will be an Element object. To get a plain HTML element use this.get();
});
//2. Use your method
var data = jExtract({
    key: ['selector', 'methodName']
});
```
- To extend jExtract's text object:
```javascript
//1. Register your method
jExtract.extendText('methodName', function(){
    //this will be a Text object. To get a plain string use this.get();
});
//2. Use your method
var data = jExtract({
    key: ['selector', false, 'methodName']
});
```
