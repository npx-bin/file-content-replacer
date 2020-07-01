const fs = require("fs");
const path = require("path");
const recursive = require("recursive-readdir");

function getErrorDescriptor(filePath, err) {
  let ed = {};
  ed["filePath"] = filePath;
  ed["err"] = err;
  return ed;
}

function doReplace(filePath, stringToReplace, replaceWith, options, processData) {
  fs.readFile(filePath, (err, data) => {
    let fileContents, updatedData;
    if (err) {
      processData.processedFiles.push(filePath);
      processData.errorFiles.push(getErrorDescriptor(filePath, err));
      return;
    }

    fileContents = data.toString();
    if (fileContents.indexOf(stringToReplace) === -1) {
      processData.processedFiles.push(filePath);
      return;
    }
    if (options && options.replaceOnce) {
      updatedData = fileContents.replace(stringToReplace, replaceWith);
    } else {
      updatedData = fileContents.replace(new RegExp(stringToReplace, "g"), replaceWith);
    }
    fs.writeFile(filePath, updatedData, (err) => {
      if (err) {
        processData.errorFiles.push(getErrorDescriptor(filePath, err));
      }
      processData.processedFiles.push(filePath);
    });
  });
}

function contentReplacer(directoryPath, fileMatcher, stringToReplace, replaceWith, options) {
  let args = arguments;
  return new Promise(function (resolve, reject) {
    let argTypeMap = [
      { name: "directoryPath", type: "string" },
      { name: "fileMatcher", type: "function" },
      { name: "stringToReplace", type: "string" },
      { name: "replaceWith", type: "string" },
      { name: "options", type: "object" }
    ];
    if (args.length < 4) {
      reject("Insufficient Arguments - Required \"directoryPath, fileMatcher, stringToReplace, replaceWith\"");
    }
    for (let i = 0; i < 4; i++) {
      if (!args[i]) {
        reject("Invalid Argument - Cannot be null / undefined / empty");
      }
      if (typeof args[i] !== argTypeMap[i]["type"]) {
        reject("Type Mismatch - Expected \"" + argTypeMap[i]["type"] + "\" type of argument for {" + argTypeMap[i]["name"] + "}, got \"" + (typeof args[i]) + "\"");
      }
    }
    if (args[4] && typeof args[4] !== argTypeMap[4]["type"]) {
      reject("Type Mismatch - Expected \"" + argTypeMap[4]["type"] + "\" type of argument for {" + argTypeMap[4]["name"] + "}, got \"" + (typeof args[4]) + "\"");
    }

    recursive(directoryPath, function (err, files) {
      if (err || !files || !files.length) {
        reject("Unable to scan the directory: " + directoryPath);
        return;
      }
      let processData = {
        processedFiles: [],
        errorFiles: [],
        resolve: resolve,
        reject: reject
      };
      let filesCount = 0;
      files.forEach(function (file) {
        if (fileMatcher(file)) {
          doReplace(file, stringToReplace, replaceWith, options, processData);
          filesCount++;
        }
      });
      let start = new Date().getTime();
      let timeout = ((options && options.timeoutMillis) ? Number(options.timeoutMillis) : 20000);
      let interval = Math.min(timeout, 100);
      function _chk() {
        if ((new Date().getTime() - start) > timeout) {
          reject("Operation Timedout: Time exceeded the allowed threshold.");
          return;
        }
        if (processData.processedFiles.length === filesCount) {
          let resolveResult = "Replacement DONE in " + (filesCount - processData.errorFiles.length) + " files. Replaced \"" + stringToReplace + "\" with \"" + replaceWith + "\".";
          if (processData.errorFiles.length) {
            resolveResult += "\n\nReplacement FAILED for the following " + processData.errorFiles.length + " files:";
            for (let f = 0; f < processData.errorFiles.length; f++) {
              resolveResult += "\n" + processData.errorFiles[f]["filePath"] + ": " + processData.errorFiles[f]["err"];
            }
          }
          resolve(resolveResult);
        } else {
          setTimeout(function () {
            _chk();
          }, interval);
        }
      }
      _chk();
    });
  });
}

module.exports = contentReplacer;
