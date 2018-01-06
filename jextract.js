/**
    jExtract: a small function for extracting data from DOM.
    Version: 0.0.6
    Author: Mikhail Kormanowsky (@kormanowsky)
    Date: 07.01.2018
*/
//Since v0.0.6: all code is wrapped by anonymous function
//Since v0.0.6: jExtract can now work without jQuery. If there's jQuery in window, jExtract will use jQuery. If not, jExtract will use its own methods
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
        isjQuery = function (v) {
            return jQueryLoaded && v instanceof $;
        },
        isNodeList = function(v){
            return v instanceof NodeList;
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
        },
        //Text
        Text = function (string) {
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
            this.element = element;
        },
        //Object creator and finder
        jQueryLoaded = isFunction(window.jQuery),
        $ = jQueryLoaded ? window.jQuery : false,
        find = function (parent, selector) {
            if (jQueryLoaded) {
                if (selector === ".")
                    return parent;
                return parent.find(selector);
            } else {
                if (selector === ".")
                    return [parent];
                var children = parent.querySelectorAll(selector);
                if (children instanceof NodeList) return children;
                else return [children];
            }
        },
        methodArgs = function (input) {
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
        //value can be: array, object, jQuery (calls with: element, index, array as in Array.forEach)
        each = function (value, callback) {
            if (isArray(value) || isNodeList(value)) {
                value.forEach(callback);
            } else if (isjQuery(value)) {
                value.each(function (i, e) {
                    callback($(e), i, value);
                });
            } else if (isObject(value)) {
                for (var i in value) {
                    var e = value[i];
                    callback(e, i, value);
                }
            }
        },
        stringToParent = function (string) {
            if (isString(string)) {
                if (jQueryLoaded) {
                    return $('<div>' + string + '</div>');
                } else {
                    var elem = document.createElement('div');
                    elem.innerHTML = string;
                    return elem;
                }
            } else {
                return string;
            }
        },
        itemToObject = function (item) {
            if (jQueryLoaded) {
                return isjQuery(item) ? item : $(item);
            } else {
                return new Element(item);
            }
        },
        defaultParentElement = function () {
            return jQueryLoaded ? $('html') : document;
        },
        //jExtract itself
        jExtract = function (struct, parent, asJSON) {
            //Object for result
            var result = {};
            //Default values
            struct = struct || {};
            parent = parent || defaultParentElement();
            asJSON = asJSON || false;
            //Since v0.0.6: allow JSON structures
            if (isString(struct)) {
                try {
                    struct = JSON.parse(struct);
                } catch (e) {
                    console.error('jExtract error: JSON error', e, struct);
                }
            }
            //Since v0.0.5: allow extracting from string
            if (isString(parent)) {
                return jExtract(struct, stringToParent(string));
            } else
                //Start our loop
                each(struct, function (e, i) {
                    //Recursion :)
                    if (isObject(e)) {
                        result[i] = jExtract(e, parent);
                        return;
                    }
                    //Get settings from the structure
                    var data = ['text', []],
                        filter = ['get', []],
                        asArray = false,
                        subresult = [],
                        element,
                        substruct;
                    if (isString(e)) {
                        element = find(parent, e);
                    } else {
                        element = find(parent, e[0]);
                        //User-deined functions support added
                        if (isObject(e[1])) {
                            substruct = e[1];
                        } else if (isArray(e[1]) && !isEmptyArray(e[1])) {
                            data = methodArgs(e[1]);
                        } else if (isFunction(e[1])) {
                            data[0] = e[1];
                        }

                        if (isFunction(e[2])) {
                            filter[0] = e[2];
                        } else if (isArray(e[2]) && !isEmptyArray(e[2])) {
                            filter = methodArgs(e[2]);
                        }

                        if (!isUndefined(e[3])) {
                            asArray = !!e[3];
                        }
                    }
                    //Find elements that match selector and extract data from them
                    each(element, function (item, index) {
                        if (isUndefined(substruct)) {
                            var Elem = itemToObject(item),
                                method,
                                args,
                                context;
                            if (isFunction(data[0])) {
                                method = data[0];
                                args = [Elem, index, element].concat(data[1]);
                                context = null;
                            } else if (isString(data[0])) {
                                if(data[0] in Elem){
                                    method = Elem[data[0]];
                                    args = data[1];
                                    context = Elem;
                                }else{
                                    console.error('jExtract error: undefined method "' + data[0] + '".');
                                    return;
                                }
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
                                    args = [Info, index].concat(filter[1]);
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
                            subresult.push(toPush);
                        } else {
                            //Or just make a recursion if needed
                            subresult.push(jExtract(substruct, item));
                        }
                    });
                    //Make a value (e.g string or number) from array if there's less than 2 elements and no need for an array
                    if (!asArray && subresult.length < 2) {
                        subresult = subresult[0];
                    }
                    //Add subresult to result object
                    result[i] = subresult;
                });
            //Return structure filled in with data
            //Since v0.0.6: JSON support added
            return asJSON ? JSON.stringify(result) : result;
        }

    /** Since v0.0.5: a short name for jExtract: $E */
    window.$E = window.jExtract = jExtract;
    /** Since v0.0.5: allow extracting from element using jQuery */
    if (jQueryLoaded) {
        window.jQuery.fn.jExtract = function (struct) {
            return jExtract(struct, $(this));
        }
    }
})();
