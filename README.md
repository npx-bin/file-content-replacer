# file-content-replacer

### A file content replacer utility. Replaces contents within files, recursively within a directory.

<br/>

**Installation:**

```
npm i file-content-replacer
```

**Usage:**

```
var fcr = require("file-content-replacer");
```

```
async function myFunc() {
    var result = await fcr(directoryPath, fileMatcher, replace, replaceWith, options).catch((err) => {
        console.log(err);
    });
    result && console.log(result);
}
myFunc();

/**
* 
* @param {*} directoryPath [type: string] - Path of the directory.
* @param {*} fileMatcher [type: function] - Predicate function for matching files.
* @param {*} replace [type: string|RegExp] - The substring to be replaced.
* @param {*} replaceWith [type: string|function] - The replacement which will replace the substring
* @param {?} options [type: Object] - Configuration object. This argument is OPTIONAL.
*
* return: Promise
*/
```

For the usage of `replace` and `replaceWith` parameters, the behavior is the same as String.prototype.replace:  
(https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)

RegExp:  
(https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

---

## A complex example:  
The below example describes a scenario wherein we want to update all the ".css" files in the current directory(recursive) and replace the text "/ASSETS/" with "assets/".
```
async function myFunc() {
    var result = await fcr(".", function (filepath) { return filepath.endsWith(".css"); }, /\/ASSETS\//gi, function (match, offset, string) {
        return match.toLowerCase().substr(1);
    }).catch((err) => {
        console.log(err);
    });
    result && console.log(result);
}
myFunc();
```
- You can provide a `directoryPath` (i.e. first argument)
- You can control the files to be matched via a `fileMatcher` (i.e. second argument) predicate _**function**_.  
Note: If you want to lookup file(s) only at a specific directory, then use the `filepath` argument and return true with the appropriate comparison.  
The predicate function gives you the flexibility to determine which exact file(s) should be matched.
- Provide a _**string or RegExp**_ as the `replace` (i.e. third argument) as in this case i.e. `/\/ASSETS\//gi` --> match global, case-insensitive occurences of the substring "/ASSETS/"
- Provide a _**string or function**_ as the `replaceWith` (i.e. fourth argument)
- Additionally you can also provide a fifth argument `options` of type _**Object**_.  
The valid properties in the options object are:  
`timeoutMillis` - specify the timeout in milliseconds  
e.g.: fcr(directoryPath, fileMatcher, replace, replaceWith, `{timeoutMillis: 5000}`);  
This would mean that if the replacement operation exceeds 5 seconds, then it will timeout.  
The default value for `timeoutMillis` is 20000 i.e. 20 seconds and will be used if the `options` argument is missing or `options.timeoutMillis` is not specified.

---

## A simple example:  
The below example describes a scenario wherein we want to update all the ".css" files in the current directory(recursive) and replace the text "/assets/" with "assets/".
```
async function myFunc() {
    var result = await fcr(".", function (filepath) { return filepath.endsWith(".css"); }, "/assets/", "assets/").catch((err) => {
        console.log(err);
    });
    result && console.log(result);
}
myFunc();
```
 - In the above simple example, we will replace the substring "/assets/" with "assets/" in all the ".css" files in the current directory(recursive).  
 **Note**: Since we provided the third argument as a `string` and not a `RegExp`, it would only replace the first match in each file.  
 The purpose of this example is just to demonstrate the flexibility offered by the library.

---

## License: MIT ( https://mit-license.kcak11.com )
