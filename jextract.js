/** jExtraxct extracts information from DOM using jQuery */
/** Example:
  DOM:
    <span id="user-name">John</span>
    <span id="user-age">27</span>
  JS:
    var data = jExtract({
    name: "#user-name",
    age: "#user-age"
  }); // data = {name: "John", age: "27"}
*/
function jExtract(struct){
  struct = struct || {};
  $.each(struct, function(i, e){
    var r; switch(typeof e){
      case "string":
      r = $(e).text().trim();
      break;
      case "object":
      if(e instanceof Array){
        var a = [];
        if(e.length == 1 && typeof e[0] === "string"){
          $(e[0]).each(function(x, y){
            a.push($(y).text().trim()); });
          }else if(e.length == 2 && typeof e[0] === "string" && typeof e[1] === "object"){
            $(e[0]).each(function(x, y){
              var b = {};
              $.each(e[1], function(i, j){
                b[i] = $(y).find(j).text().trim();
              });
              a.push(b);
            });
          }else{
            e.forEach(function(b, c, d){
              a.push($(b).text().trim());
            });
          }
          r = a;
        }else{
          r = jExtract(e);
        }
        break;
      } struct[i] = r;
    });
    return struct;
  }

