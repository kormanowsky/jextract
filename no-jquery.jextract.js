/**
    jExtract: a small function for extracting data from DOM.
    Version with no jQuery needed.
    Version: 0.0.1
    Author: Mikhail Kormanowsky (@kormanowsky)
    Date: 06.01.2018
*/
(function () {
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
        },
        isFunction = function (v) {
            return typeof v === "function";
        },
        isNull = function (v) {
            return v === null;
        };
    //Text
    var Text = function (string) {
            this.get = function (trim) {
                trim = trim || true;
                if (trim) return string.trim();
                return string;
            };
            this.match = function (regexp, index) {
                var matches = this.get().match(new RegExp(regexp));
                if (!isUndefined(index) && isArray(matches) && index in matches) {
                    return matches[index];
                }
                return matches;
            };
            this.toInt = function (leaveNaN) {
                leaveNaN = leaveNaN || false;
                if (!isNaN(parseInt(this.get())) || leaveNaN) return parseInt(this.get());
                return 0;
            };
            this.toFloat = function (leaveNaN) {
                leaveNaN = leaveNaN || false;
                var str = this.get().replace(",", ".");
                if (!isNaN(parseFloat(str)) || leaveNaN) return parseFloat(str);
                return 0;
            };
        },
        Element = function (element) {
            this.text = function () {
                return element.innerText || element.textContent;
            };
            this.attr = function (attr) {
                return element.getAttribute(attr);
            }
        },

        jExtract = function (struct, parent) {
            //Object for result
            var result = {};
            //Some default values
            struct = struct || {};
            parent = parent || document;
            //Some functions and objects
            var find = function (selector) {
                    if (selector == '.') return parent;
                    return parent.querySelectorAll(selector);
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
                };
            //Since v0.0.5: allow extracting from string
            if (isString(parent)) {
                var _parent = parent;
                parent = document.createElement('div');
                parent.innerHTML = _parent;
                return jExtract(struct, parent);
            } else
                //Start our loop
                for (var i in struct) {
                    var e = struct[i];
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
                        if (isObject(e[1])) {
                            s = e[1];
                        } else if (isArray(e[1]) && !isEmptyArray(e[1])) {
                            data = methodAndArgs(e[1]);
                        } else if (isFunction(e[1])) {
                            data[0] = e[1];
                        }

                        if (isFunction(e[2])) {
                            filter[0] = e[2];
                        } else if (isArray(e[2]) && !isEmptyArray(e[2])) {
                            filter = methodAndArgs(e[2]);
                        }

                        if (!isUndefined(e[3])) {
                            asArray = !!e[3];
                        }
                    }
                    
                    if(!(element instanceof NodeList)){
                        element = [element];
                    }
                    //Find elements that match selector and extract data from them
                   element.forEach(function(b, a){
                        var b = element[a];

                        if (isUndefined(s)) {
                            var Elem = new Element(b),
                                method,
                                args,
                                context;
                            if (isFunction(data[0])) {
                                method = data[0];
                                args = [Elem, a, element].concat(data[1]);
                                context = null;
                            } else if (isString(data[0])) {
                                method = Elem[data[0]];
                                args = data[1];
                                context = Elem;
                            } else {
                                method = function () {};
                                context = null;
                                args = [];
                            }
                            var Info = method.apply(context, args),
                                toPush;
                            if (isNull(Info) || isUndefined(Info)) return;
                            else if (isObject(Info) || isArray(Info) || isString(Info)) {
                                if (!(Info instanceof Text)) Info = new Text(Info + '');
                                if (isFunction(filter[0])) {
                                    method = filter[0];
                                    args = [Info, a].concat(filter[1]);
                                    content = null;
                                } else if (isString(filter[0])) {
                                    method = Info[filter[0]];
                                    args = filter[1];
                                    context = Info;
                                } else {
                                    method = function () {};
                                    context = null;
                                    args = [];
                                }
                                toPush = method.apply(context, args);
                            } else toPush = Info;
                            _result.push(toPush);
                        } else {
                            //Or just make a recursion if needed
                            _result.push(jExtract(s, b));
                        }
                    });
                    //Make a value (e.g string or number) from array if there's less than 2 elements and no need for an array
                    if (!asArray && _result.length < 2) {
                        _result = _result[0];
                    }
                    //Add result to result object
                    result[i] = _result;
                }
            //Return structure filled in with data
            return result;
        }

    /** Since v0.0.5: a short name for jExtract: $E */
    window.$E = window.jExtract = jExtract;

})();