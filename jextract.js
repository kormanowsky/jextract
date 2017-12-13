/**
    jExtract: a small function for extracting data from DOM.
    Version: 0.0.4
    Author: Mikhail Kormanowsky (@kormanowsky)
    Date: 13.12.2017
*/
function jExtract(struct, parent) {
    //Throw an error about jQuery
    if (typeof jQuery !== "function") {
        throw 'jExtract error: jExtract depends on jQuery, but it wasn`t loaded';
        return false;
    }
    //Some default values
    struct = struct || {};
    parent = parent || $("html");
    //Some functions and objects
    var find = function (selector) {
      if(selector == '.') return parent;
            return parent.find(selector);
        },
        methodAndArgs = function (input) {
            var method, args;
            if (isString(input)) method = input;
            else if (!isEmptyArray(input)) {
                method = input[0];
                if (input.length > 1) {
                    args = input.slice(1);
                }
            }
            return [method, args];
        },
        //Type checkers
        isUndefined = function (v) {
            return v === undefined;
        },
        isObject = function (v) {
            return typeof v === "object" && v instanceof Object && !(v instanceof Array);
        },
        isArray = function (v) {
            return typeof v === "object" && v instanceof Array;
        },
        isString = function (v) {
            return typeof v === "string";
        },
        isEmptyString = function (v) {
            return isString(v) && !v.length;
        },
        isEmptyArray = function (v) {
            return isArray(v) && !v.length;
        },
        isFunction = function(v){
          return typeof v === "function";
        },
        isNull = function(v){
          return v === null;
        },
        jExtractText = function (string) {
            this._text = string;
        },
        result = {};
    jExtractText.prototype.get = function (trim) {
        trim = trim || true;
        if (trim) return this._text.trim();
        return this._text;
    };
    jExtractText.prototype.match = function (regexp, index) {
        var matches = this.get().match(new RegExp(regexp));
        if (!isUndefined(index) && isArray(matches) && index in matches) {
            return matches[index];
        }
        return matches;
    };
    jExtractText.prototype.toInt = function (leaveNaN) {
        leaveNaN = leaveNaN || false;
        if(!isNaN(parseInt(this.get())) || leaveNaN) return parseInt(this.get());
        return 0;
    };
    jExtractText.prototype.toFloat = function (leaveNaN) {
        leaveNaN = leaveNaN || false;
        var str = this.get().replace(",", ".");
        if(!isNaN(parseFloat(str)) || leaveNaN) return parseFloat(str);
        return 0;
    };

    //Start our loop
    $.each(struct, function (i, e) {
        //Recursion :)
        if (isObject(e)) {
            result[i] = jExtract(e, parent);
            return;
        }
        //Get settings from the structure
        var data = ['text', []],
            filter = ['get', []],
            asArray = false,
            _result = [],
            element,
            s;
        if (isString(e)) {
            element = find(e);
        } else {
            element = find(e[0]);
            //User-deined functions support added
            if(isObject(e[1])){
              s = e[1];
            }else if(isArray(e[1]) && !isEmptyArray(e[1])){
              data = methodAndArgs(e[1]);
            }else if(isFunction(e[1])){
              data[0] = e[1];
            }

            if(isFunction(e[2])){
              filter[0] = e[2];
            }else if(isArray(e[2]) && !isEmptyArray(e[2])){
              filter = methodAndArgs(e[2]);
            }

            if(!isUndefined(e[3])){
              asArray = !!e[3];
            }
        }
        //Find elements that match selector and extract data from them
        element.each(function (a, b) {
            if (isUndefined(s)) {
                var jElement = $(b),
                    method,
                    args,
                    context;
                if(isFunction(data[0])){
                  method = data[0];
                  args = [element, a].concat(data[1]);
                  context = null;
                }else if(isString(data[0])){
                  method = jElement[data[0]];
                  args = data[1];
                  context = jElement;
                }else{
                  method = function(){};
                  context = null;
                  args = [];
                }
                var jElementProp = method.apply(context, args), toPush;
                if(isNull(jElementProp) || isUndefined(jElementProp)) return;
                else if(isObject(jElementProp) || isArray(jElementProp) || isString(jElementProp)){
                  if(!(jElementProp instanceof jExtractText)) jElementProp = new jExtractText(jElementProp + '');
                  if(isFunction(filter[0])){
                    method = filter[0];
                    args = [jElementProp, a].concat(filter[1]);
                    content = null;
                  }else if(isString(filter[0])){
                    method = jElementProp[filter[0]];
                    args = filter[1];
                    context = jElementProp;
                  }else{
                    method = function(){};
                    context = null;
                    args = [];
                  }
                  toPush = method.apply(context, args);
                }else toPush = jElementProp;
                _result.push(toPush);
            } else {
                //Or just make a recursion if needed
                _result.push(jExtract(s, $(b)));
            }
        });
        //Make a value (e.g string or number) from array if there's less than 2 elements and no need for an array
        if (!asArray && _result.length < 2) {
            _result = _result[0];
        }
        //Add result to result object
        result[i] = _result;
    });
    //Return structure filled in with data
    return result;
}
