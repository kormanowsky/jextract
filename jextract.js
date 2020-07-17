/**
    jExtract: a function for extracting data from DOM.
    Version: 1.0.0
    Author: Mikhail Kormanowsky (@kormanowsky)
    Date: 17.07.2020
*/
(function () {
    // The JExtractError class
    class JExtractError extends Error {
        constructor(message) {
            super();
            this.name = "JExtractError";
            this.message = message;
        }
    }

    //Type checkers (The Is class)
    class Is {
        static NaN(v) {
            return Is.NaN(v);
        }
        static null(v) {
            return v === null;
        }

        static undefined(v) {
            return v === undefined;
        }

        static object(v) {
            return (
                typeof v === "object" &&
                v instanceof Object &&
                !(v instanceof Array)
            );
        }

        static array(v) {
            return typeof v === "object" && v instanceof Array;
        }

        static emptyArray(v) {
            return this.array(v) && !v.length;
        }

        static function(v) {
            return typeof v === "function";
        }

        static jQuery(v) {
            return $ && v instanceof $;
        }

        static jExtractElement(v) {
            return v instanceof Element;
        }

        static NodeList(v) {
            return v instanceof NodeList;
        }

        static string(v) {
            return typeof v === "string";
        }

        static emptyString(v) {
            return this.string(v) && !v.length;
        }

        static CSSSelector(v) {
            if (!this.string(v) || this.emptyString(v)) {
                return false;
            }
            // TODO: check if we are in browser
            v = document.querySelector(v);
            return !this.null(v);
        }

        static JSON(v) {
            if (!this.string(v) || this.emptyString(v)) {
                return false;
            }
            try {
                v = JSON.parse(v);
            } catch (e) {
                return false;
            }
            return true;
        }

        static HTML(v) {
            if (!this.string(v) || this.EmptyString(v)) {
                return false;
            }
            v = v.trim();
            return v[0] == "<" && v[v.length - 1] == ">";
        }
    }

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
            if (
                !Is.undefined(index) &&
                Is.array(matches) &&
                index in matches
            ) {
                return matches[index];
            }
            return matches;
        }

        toInt(leaveNaN) {
            leaveNaN = leaveNaN || false;
            if (!Is.NaN(parseInt(this.get())) || leaveNaN) {
                return parseInt(this.get());
            }
            return 0;
        }

        toFloat(leaveNaN) {
            leaveNaN = leaveNaN || false;
            let str = this.get().replace(",", ".");
            if (!Is.NaN(parseFloat(str)) || leaveNaN) {
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
    // TODO: check if we are in browser
    let $ = Is.function(window.jQuery) ? window.jQuery : false,
        find = function (parent, selector) {
            if (!parent.get()) {
                throw new JExtractError(`Incorrect parent element or selector`);
            }
            if (selector == ".") {
                return [parent];
            } else {
                if (!Is.CSSSelector(selector)) {
                    throw new JExtractError(
                        `Could not find elements that match given selector: ${selector}`
                    );
                }
                let children = parent.get().querySelectorAll(selector),
                    resultChildren = [];
                children = Is.NodeList(children) ? children : [children];
                each(children, function (e, i, a) {
                    resultChildren[i] = new Element(e);
                });
                return resultChildren;
            }
        },
        parseDefaultArgs = function (custom, defaults) {
            let method = defaults[0],
                args = defaults[1];
            if (!Is.undefined(custom)) {
                if (Is.string(custom) || Is.function(custom)) method = custom;
                else if (Is.array(custom) && !Is.empt.array(custom)) {
                    method = custom[0];
                    if (custom.length > 1) {
                        args = custom.slice(1);
                    }
                }
            }
            return [method, args];
        },
        //value can be: array, object, jQuery (calls with: element, index, array as in.array.forEach)
        each = function (value, callback) {
            if (Is.array(value) || Is.NodeList(value)) {
                value.forEach(callback);
            } else if (Is.object(value)) {
                for (let i in value) {
                    let e = value[i];
                    callback(e, i, value);
                }
            }
        },
        stringToParent = function (string) {
            if (Is.CSSSelector(string)) {
                return new Element(document.querySelector(string));
            } else if (Is.HTML(string)) {
                let elem = document.createElement("div");
                elem.innerHTML = string;
                return elem;
            }
        },
        //jExtract itself
        jExtract = function (struct, options) {
            //Object for result
            let result = {};
            //Default values
            struct = struct || {};
            options = Is.object(options) ? options : {};
            options.json = options.json || false;
            let parent = options.parent || new Element(document);

            if (!Is.object(struct)) {
                if (Is.JSON(struct)) {
                    struct = JSON.parse(struct);
                } else {
                    throw new JExtractError("Incorrect JSON");
                }
            }
            if (Is.string(parent)) {
                parent = stringToParent(parent);
            }
            if (Is.jQuery(parent)) {
                parent = parent[0];
            }
            if (!Is.jExtractElement(parent)) {
                parent = new Element(parent);
            }
            //Start our loop
            each(struct, function (e, i) {
                //Recursion :)
                if (Is.object(e)) {
                    result[i] = jExtract(e, parent);
                    return;
                }
                //Get settings from the structure
                let data = ["text", []],
                    filter = ["get", []],
                    options = {},
                    subresult = [],
                    elements,
                    substruct;

                if (Is.string(e)) {
                    elements = find(parent, e);
                } else {
                    elements = find(parent, e[0]);
                    //User-defined functions support added
                    if (Is.object(e[1])) {
                        substruct = e[1];
                    } else {
                        data = parseDefaultArgs(e[1], data);
                    }

                    filter = parseDefaultArgs(e[2], filter);

                    if (Is.object(e[3])) {
                        options = e[3];
                    }

                    options.keepArray = options.keepArray || false;
                }
                //Find elements that match selector and extract data from them
                each(elements, function (item, index) {
                    if (Is.undefined(substruct)) {
                        let method = function () {},
                            args = [],
                            context = null;
                        if (Is.function(data[0])) {
                            method = data[0];
                            args = [item, index, elements].concat(data[1]);
                        } else if (Is.string(data[0])) {
                            args = data[1];
                            if (data[0] in item) {
                                method = item[data[0]];
                                context = item;
                            } else if ($ && data[0] in $(item.get())) {
                                method = $(item.get())[data[0]];
                                context = $(item.get());
                            } else {
                                throw new JExtractError(
                                    `Undefined Element method: ${data[0]}`
                                );
                            }
                        }
                        let extractedData = method.apply(context, args),
                            itemResult;
                        if (Is.string(extractedData) && filter[0]) {
                            method = function () {};
                            args = [];
                            context = null;
                            extractedData = new Text(extractedData);
                            if (Is.function(filter[0])) {
                                method = filter[0];
                                args = [extractedData.get(), index].concat(
                                    filter[1]
                                );
                            } else if (Is.string(filter[0])) {
                                args = filter[1];
                                if (filter[0] in extractedData) {
                                    method = extractedData[filter[0]];
                                    context = extractedData;
                                } else if (
                                    filter[0] in new String(extractedData.get())
                                ) {
                                    method = extractedData.get()[filter[0]];
                                    context = extractedData.get();
                                } else {
                                    throw new JExtractError(
                                        `Undefined Element method: ${filter[0]}`
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
                if (!options.keepAarray && subresult.length < 2) {
                    subresult = subresult[0];
                }
                //Add subresult to result object
                result[i] = subresult;
            });
            //Return structure filled in with data
            return options.json ? JSON.stringify(result) : result;
        };
    jExtract.extendText = function (extension) {
        Object.assign(Text.prototype, extension);
    };
    jExtract.extendElement = function (extension) {
        Object.assign(Element.prototype, extension);
    };
    if (window) window.$E = window.jExtract = jExtract;
    if ($) {
        window.jQuery.fn.jExtract = function (struct) {
            return jExtract(struct, $(this));
        };
    }
})();
