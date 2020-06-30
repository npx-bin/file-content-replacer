# file-content-replacer

### A file content replacer utility. Replaces contents within files, recursively within a directory.

**Installation:**

```
npm i file-content-replacer
```

**Usage:**

```
const replacer = require("file-content-replacer");
```

```
async function myFunc(){
 var result = replacer(<directoryPath>, <fileExtension>, <stringToReplace>, <replaceWith>);
 console.log(result);
}

/*
Arguments:
 "directoryPath": The path of directory.
 "fileExtension": The extension of files to lookup e.g.: ".css" or ".js"
 "stringToReplace": The string to be replaced.
 "replaceWith": The string that will be used for the replacement.

Returns:
 Promise
*/
```



### License: MIT ( https://mit-license.kcak11.com )