/**
    jExtract: a function for extracting data from DOM.
    Version: 1.1.1
    Author: Mikhail Kormanowsky (@kormanowsky)
    Date: 18.07.2020
*/
(function () {
    const BROWSER = typeof window === "object";
    let document = BROWSER ? window.document : null,
        jQuery,
        HTMLParser;

    if (BROWSER) {
        jQuery = window.jQuery;
    } else {
        HTMLParser = require("node-html-parser");
        try {
            jQuery = require("jquery");
        } catch (e) {
            jQuery = null;
        }
    }

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
            return jQuery && v instanceof jQuery;
        }

        static jExtractElement(v) {
            return v instanceof Element;
        }

        static NodeList(v) {
            if (!BROWSER) {
                return this.array(v);
            }
            return v instanceof window.NodeList;
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
            if (BROWSER) {
                try {
                    document.querySelector(v);
                    return true;
                } catch (e) {
                    return false;
                }
            } else {
                const CssSelectorParser = require("css-selector-parser")
                        .CssSelectorParser,
                    parser = new CssSelectorParser();
                try {
                    parser.parse(v);
                    return true;
                } catch (e) {
                    return false;
                }
            }
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
            if (!this.string(v) || this.emptyString(v)) {
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
            if (!Is.undefined(index) && Is.array(matches) && index in matches) {
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
            return (
                this.element.innerText ||
                this.element.textContent ||
                this.element.text
            );
        }

        attr(attr) {
            return this.element.getAttribute(attr);
        }

        get() {
            return this.element;
        }
    }

    //Object creator and finder
    function find(parent, selector) {
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
    }

    function parseDefaultArgs(custom, defaults) {
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
    }

    //collection may be: array, object, jQuery (calls with: element, index, array as in.array.forEach)
    function each(collection, callback) {
        if (Is.array(collection) || Is.NodeList(collection)) {
            collection.forEach(callback);
        } else if (Is.object(collection)) {
            for (let i in collection) {
                let e = collection[i];
                callback(e, i, collection);
            }
        }
    }

    // Converts a string (CSS selector or plain HTML) to an Element object.
    function stringToElement(string) {
        if (Is.CSSSelector(string)) {
            return new Element(document.querySelector(string));
        } else if (Is.HTML(string)) {
            let elem;
            if (BROWSER) {
                elem = document.createElement("div");
                elem.innerHTML = string;
            } else {
                elem = HTMLParser.parse("<div></div>");
                elem.set_content(string);
            }
            return new Element(elem);
        }
    }

    // Main extract function
    function extract({ struct, root, options }) {
        //Object for result
        let result = {};
        //Default values
        struct = struct || {};
        options = Is.object(options) ? options : {};
        options.json = options.json || false;

        if (!root) {
            throw new JExtractError("Root element is not specified.");
        }

        if (!Is.object(struct)) {
            if (Is.JSON(struct)) {
                struct = JSON.parse(struct);
            } else {
                throw new JExtractError("Incorrect JSON");
            }
        }
        if (Is.string(root)) {
            root = stringToElement(root);
        }
        if (Is.jQuery(root)) {
            root = root[0];
        }
        if (!Is.jExtractElement(root)) {
            root = new Element(root);
        }
        //Start our loop
        each(struct, function (e, i) {
            //Recursion :)
            if (Is.object(e)) {
                result[i] = jExtract(e, root);
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
                elements = find(root, e);
            } else {
                elements = find(root, e[0]);
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
                        } else if (jQuery && data[0] in jQuery(item.get())) {
                            method = jQuery(item.get())[data[0]];
                            context = jQuery(item.get());
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
                                    `Undefined Text method: ${filter[0]}`
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
            if (!options.keepArray && subresult.length < 2) {
                subresult = subresult[0];
            }
            //Add subresult to result object
            result[i] = subresult;
        });
        //Return structure filled in with data
        return options.json ? JSON.stringify(result) : result;
    }
    //jExtract itself
    function jExtract(struct) {
        let chainData = { struct, options: {}, root: {} },
            chain = {
                using(options) {
                    chainData.options = options;
                    return chain;
                },
                from(root) {
                    chainData.root = root;
                    return extract(chainData);
                },
                fromDocument() {
                    if (!BROWSER) {
                        throw new JExtractError(
                            "Cannot extract from document when not in browser."
                        );
                    }
                    return this.from(document);
                },
            };
        return chain;
    }
    jExtract.extendText = function (extension) {
        each(extension, (value, key) => {
            Text.prototype[key] = function () {
                return value.call(this, this);
            };
        });
    };
    jExtract.extendElement = function (extension) {
        each(extension, (value, key) => {
            Element.prototype[key] = function () {
                return value.call(this, this);
            };
        });
    };
    if (BROWSER) {
        window.jExtract = jExtract;

        if (jQuery) {
            window.jQuery.fn.jExtract = function (struct) {
                return jExtract(struct, jQuery(this));
            };
        }
    } else {
        module.exports = jExtract;
    }
})();
