import { terser } from "rollup-plugin-terser";
export default {
    input: "./jextract.js",
    output: {
        file: "./jextract.min.js",
        format: "iife",
    },
    plugins: [
        terser({
            mangle: true,
            output: {
                preamble: `/**
    jExtract: a function for extracting data from DOM.
    Version: 1.1.0
    Author: Mikhail Kormanowsky (@kormanowsky)
    Date: 17.07.2020
*/`,
            },
        }),
    ],
};
