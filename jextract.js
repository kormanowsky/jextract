function jExtract(struct, parent){
  //Throw an error about jQuery
  if(typeof $ !== "function"){
    throw 'jExtract error: jExtract depends on jQuery, but it wasn`t loaded';
    return false;
  }
  //Some default values...
  struct = struct || {};
  parent = parent || $("html");
  //...and useful functions
  var $g = function(selector){
    return parent.find(selector);
  }, $e = function(key){
    throw 'jExtract error: key "' + key + '" in your struct is of type "' + typeof struct[key] + '" but only strings and objects are allowed.';
  }, data = {};
  //Start our loop
  $.each(struct, function(i, e){
    //Very simple case: just replace selector with text
    if(typeof e == "string"){
      data[i] = $g(e).text().trim();
    }else if(typeof e == "object"){
      if(e instanceof Array){
        //if it's array, check how much elements it has.
        //We support only arrays like [string] to get texts of all elements with selector
        //and [string, object] to extract children structure inside an each element with selector
        data[i] = [];
        $g(e[0]).each(function(j, f){
          if(e.length == 1){
            data[i].push($(f).text().trim());
          }else if(e.length == 2){
            data[i].push(jExtract(e[1], $(f)));
          }
        });
      }else if(e !== null){
        //if it's object, just call jExtract for this object
        data[i] = jExtract(e, parent);
      }
    }else{
      $e(i);
    }
  });
  //Return structure filled in with data
  return data;
}
