/**
    jExtract: a function for extracting data from DOM.
    Version: 0.0.7
    Author: Mikhail Kormanowsky (@kormanowsky)
    Date: 08.01.2018
*/
(function () {
    //Type checkers
    let isUndefined = function (v) {
            return v === undefined;
        },
        isObject = function (v) {
            return (
                typeof v === "object" &&
                v instanceof Object &&
                !(v instanceof Array)
            );
        },
        isArray = function (v) {
            return typeof v === "object" && v instanceof Array;
        },
        isjQuery = function (v) {
            return $ && v instanceof $;
        },
        isjExtractElement = function (v) {
            return v instanceof Element;
        },
        isNodeList = function (v) {
            return v instanceof NodeList;
        },
        isString = function (v) {
            return typeof v === "string";
        },
        isEmptyString = function (v) {
            return isString(v) && !v.length;
        },
        isCSSSelector = function (v) {
            if (!isString(v) || isEmptyString(v)) return false;
            v = document.querySelector(v);
            if (v === null) {
                return false;
            } else {
                return true;
            }
        },
        isJSON = function (v) {
            if (!isString(v) || isEmptyString(v)) return false;
            try {
                v = JSON.parse(v);
            } catch (e) {
                return false;
            }
            return true;
        },
        isHTML = function (v) {
            if (!isString(v) || isEmptyString(v)) return false;
            v = v.trim();
            if (v[0] == "<" && v[v.length - 1] == ">") {
                return true;
            } else {
                return false;
            }
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

    // The Text class
    class Text {
        constructor(text) {
            this.text = text;
        }

        get(trim) {
            trim = trim || true;
            if (trim) {
                return this.text.trim();
            }
            return this.text;
        }

        match(regexp, index) {
            let matches = this.get().match(new RegExp(regexp));
            if (!isUndefined(index) && isArray(matches) && index in matches) {
                return matches[index];
            }
            return matches;
        }

        toInt(leaveNaN) {
            leaveNaN = leaveNaN || false;
            if (!isNaN(parseInt(this.get())) || leaveNaN) {
                return parseInt(this.get());
            }
            return 0;
        }

        toFloat(leaveNaN) {
            leaveNaN = leaveNaN || false;
            var str = this.get().replace(",", ".");
            if (!isNaN(parseFloat(str)) || leaveNaN) {
                return parseFloat(str);
            }
            return 0;
        }
    }

    // The Element class
    class Element {
        constructor(element) {
            this.element = element;
        }

        text() {
            return this.element.innerText || this.element.textContent;
        }

        attr(attr) {
            return this.element.getAttribute(attr);
        }

        get() {
            return this.element;
        }
    }
    //Object creator and finder
    let $ = isFunction(window.jQuery) ? window.jQuery : false,
        find = function (parent, selector) {
            if (selector == ".") {
                return [parent];
            } else {
                if (!isCSSSelector(selector)) {
                    throw (
                        'jExtract error: couldn`t find elements that match selector "' +
                        selector +
                        '".'
                    );
                }
                var children = parent.get().querySelectorAll(selector),
                    resultChildren = [];
                children = isNodeList(children) ? children : [children];
                each(children, function (e, i, a) {
                    resultChildren[i] = new Element(e);
                });
                return resultChildren;
            }
        },
        methodArgs = function (input, defs) {
            var method = defs[0],
                args = defs[1];
            if (!isUndefined(input)) {
                if (isString(input) || isFunction(input)) method = input;
                else if (isArray(input) && !isEmptyArray(input)) {
                    method = input[0];
                    if (input.length > 1) {
                        args = input.slice(1);
                    }
                }
            }
            return [method, args];
        },
        //value can be: array, object, jQuery (calls with: element, index, array as in Array.forEach)
        each = function (value, callback) {
            if (isArray(value) || isNodeList(value)) {
                value.forEach(callback);
            } else if (isObject(value)) {
                for (var i in value) {
                    var e = value[i];
                    callback(e, i, value);
                }
            }
        },
        stringToParent = function (string) {
            if (isCSSSelector(string)) {
                return new Element(document.querySelector(string));
            } else if (isHTML(string)) {
                var elem = document.createElement("div");
                elem.innerHTML = string;
                return elem;
            }
        },
        //jExtract itself
        jExtract = function (struct, parent, asJSON) {
            //Object for result
            var result = {};
            //Default values
            struct = struct || {};
            parent = parent || new Element(document);
            asJSON = asJSON || false;
            if (!isObject(struct)) {
                if (isJSON(struct)) {
                    struct = JSON.parse(struct);
                } else {
                    throw "jExtract error: incorrect JSON";
                }
            }
            if (isString(parent)) {
                return jExtract(struct, stringToParent(parent));
            } else {
                if (isjQuery(parent)) parent = parent[0];
                if (!isjExtractElement(parent)) parent = new Element(parent);
                //Start our loop
                each(struct, function (e, i) {
                    //Recursion :)
                    if (isObject(e)) {
                        result[i] = jExtract(e, parent);
                        return;
                    }
                    //Get settings from the structure
                    var data = ["text", []],
                        filter = ["get", []],
                        asArray = false,
                        subresult = [],
                        elements,
                        substruct;
                    if (isString(e)) {
                        elements = find(parent, e);
                    } else {
                        elements = find(parent, e[0]);
                        //User-deined functions support added
                        if (isObject(e[1])) {
                            substruct = e[1];
                        } else {
                            data = methodArgs(e[1], data);
                        }

                        filter = methodArgs(e[2], filter);

                        if (!isUndefined(e[3])) {
                            asArray = !!e[3];
                        }
                    }
                    //Find elements that match selector and extract data from them
                    each(elements, function (item, index) {
                        if (isUndefined(substruct)) {
                            var method = function () {},
                                args = [],
                                context = null;
                            if (isFunction(data[0])) {
                                method = data[0];
                                args = [item, index, elements].concat(data[1]);
                            } else if (isString(data[0])) {
                                args = data[1];
                                if (data[0] in item) {
                                    method = item[data[0]];
                                    context = item;
                                } else if ($ && data[0] in $(item.get())) {
                                    method = $(item.get())[data[0]];
                                    context = $(item.get());
                                } else {
                                    throw (
                                        'jExtract error: undefined element method "' +
                                        data[0] +
                                        '".'
                                    );
                                }
                            }
                            var extractedData = method.apply(context, args),
                                itemResult;
                            if (isString(extractedData) && filter[0]) {
                                method = function () {};
                                args = [];
                                context = null;
                                extractedData = new Text(extractedData);
                                if (isFunction(filter[0])) {
                                    method = filter[0];
                                    args = [extractedData, index].concat(
                                        filter[1]
                                    );
                                } else if (isString(filter[0])) {
                                    args = filter[1];
                                    if (filter[0] in extractedData) {
                                        method = extractedData[filter[0]];
                                        context = extractedData;
                                    } else if (
                                        filter[0] in
                                        new String(extractedData.get())
                                    ) {
                                        method = extractedData.get()[filter[0]];
                                        context = extractedData.get();
                                    } else {
                                        throw (
                                            'jExtract error: undefined text method "' +
                                            filter[0] +
                                            '".'
                                        );
                                    }
                                }
                                itemResult = method.apply(context, args);
                            } else {
                                itemResult = extractedData;
                            }
                            subresult.push(itemResult);
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
            }
            //Return structure filled in with data
            return asJSON ? JSON.stringify(result) : result;
        };
    jExtract.addTextMethod = function (name, callback) {
        Text.prototype[name] = callback;
    };
    jExtract.addElementMethod = function (name, callback) {
        Element.prototype[name] = callback;
    };
    window.$E = window.jExtract = jExtract;
    if ($) {
        window.jQuery.fn.jExtract = function (struct) {
            return jExtract(struct, $(this));
        };
    }
})();
