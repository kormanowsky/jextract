# jExtract
Allow extracting data from DOM using jQuery
## Basic usage
0. Create a HTML document and include jQuery and jExtract (jExtract should be included AFTER jQuery as it depends on this library)
```html
<h1 id="page-title">Hello, world!</h1>
<p id="page-content">Lorem ipsum dolor sit amet.</p>
<!-- Your HTML continues here -->
<script src="/path/to/jquery.js"></script>
<script src="/path/to/jextract.js"></script>
<script>
    //Your JavaScript goes here
</script>
```
1. Create a data structure containing CSS selectors of elements from which you need to extract data: 
```javascript
var structure = {
    title: "#page-title", 
    content: "#page-content"
};
```
2. Just pass your structure as a parameter to jExtract function: 
```javascript
var data = jExtract(structure);
```
`data` will be:
```javascript 
{
    title: "Hello, world!",
    content: "Lorem ipsum dolor sit amet."
}
```
3. Now you can do anything you want with extracted data. 
