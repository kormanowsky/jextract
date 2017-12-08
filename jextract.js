/** 
    jExtract: a small function for extracting data from DOM. 
    Version: 0.0.1
    Author: Mikhail Kormanowsky (@kormanowsky)
    Date: 08.12.2017
*/
//Type checkers
var isUndefined = function (v) {
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
    }
//jExtractText with methods
var jExtractText = function (string) {
    this._text = string;
};
jExtractText.prototype.get = function () {
    return this._text;
};
jExtractText.prototype.match = function (regexp, index) {
    var matches = this.get().match(new RegExp(regexp));
    if (!isUndefined(index) && isArray(matches) && index in matches) {
        return matches[index];
    }
    return matches;
};
jExtractText.prototype.toInt = function () {
    return parseInt(this.get());
};
jExtractText.prototype.toFloat = function () {
    return parseFloat(this.get());
};
//Extend this in future versions
//jExtractElement with methods
var jExtractElement = function (element) {
    this._jquery = element;
};
jExtractElement.prototype.text = function () {
    return new jExtractText(this._jquery.text());
};
jExtractElement.prototype.attr = function (attrName) {
    return new jExtractText(this._jquery.attr(attrName));
};
//Extend this in future versions
//Extended dot notation (a["b.c"] = a.b.c);
jExtractElement.prototype.recget = function (key) {
    var val = this;
    key = key.split('.');
    key.forEach(function (k) {
        if (k in val) val = val[k];
    });
    return val;
};
//jExtract itself
function jExtract(struct, parent) {
    //Throw an error about jQuery
    if (typeof jQuery !== "function") {
        throw 'jExtract error: jExtract depends on jQuery, but it wasn`t loaded';
        return false;
    }
    //Some default values...
    struct = struct || {};
    parent = parent || $("html");
    //...functions and a result object.
    //find(selector) finds elements with selector inside a parent one
    //methodAndArgs(input) parses input to find method name and arguments
    var find = function (selector) {
            return parent.find(selector);
        },
        methodAndArgs = function (input) {
            var method, args;
            if(isString(input)) method = input;
            else if(!isEmptyArray(input)){
                method = input[0];
                if(input.length > 1){
                    args = input.slice(1);
                }
            }
            return [method, args];
        },
        result = {};
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
            if(!isUndefined(e[1])){
                if(isArray(e[1])){
                    data = methodAndArgs(e[1]);
                    if(!isUndefined(e[2])){
                        filter = methodAndArgs(e[2]);
                        if(!isUndefined(e[3])){
                            asArray = !!e[3];
                        }
                    }
                }else{
                    s = e[1];
                }
            }
        }
        //Find elements that match selector and extract data from them
        element.each(function(a, b){
            if(isUndefined(s)){
                var jElement = new jExtractElement($(b)),
                jElementProp = jElement.recget(data[0]).apply(jElement, data[1]);
                _result.push(jElementProp[filter[0]].apply(jElementProp, filter[1]));
            }else{
                //Or just make a recursion if needed
                _result.push(jExtract(s, $(b)));
            }
        });
        //Make a value (e.g string or number) from array if there's less than 2 elements and no need for an array
        if(!asArray && _result.length < 2){
            _result = _result[0];
        } 
        //Add result to result object
        result[i] = _result;
    });
    //Return structure filled in with data
    return result;
}