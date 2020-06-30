const fs = require("fs");
const path = require("path");
const recursive = require("recursive-readdir");

function doReplace(filePath, stringToReplace, replaceWith, processData) {
  fs.readFile(filePath, (err, data) => {
    let fileContents, updatedData;
    if (err) {
      processData.reject(err);
    }

    fileContents = data.toString();
    if (fileContents.indexOf(stringToReplace) === -1) {
      processData.processedFiles.push(filePath);
      return;
    }
    updatedData = fileContents.replace(new RegExp(stringToReplace, "g"), replaceWith);
    fs.writeFile(filePath, updatedData, (err) => {
      if (err) {
        processData.reject(err);
      }
      processData.processedFiles.push(filePath);
    });
  });
}

function contentReplacer(directoryPath, fileExtension, stringToReplace, replaceWith) {
  if (arguments.length < 4) {
    throw new Error("Insufficient Arguments - Required \"directoryPath, fileExtension, stringToReplace, replaceWith\"");
  }
  for (let i = 0; i < 4; i++) {
    if (typeof arguments[i] !== "string") {
      throw new Error("Type Mismatch - Expected \"string\" argument, got \"" + (typeof arguments[i]) + "\"");
    }
  }
  return new Promise(function (resolve, reject) {
    recursive(directoryPath, function (err, files) {
      if (err) {
        reject(err);
      }
      let processData = {
        processedFiles: [],
        resolve: resolve,
        reject: reject
      };
      let filesCount = 0;
      files.forEach(function (file) {
        if (path.extname(file) === ".css") {
          doReplace(file, stringToReplace, replaceWith, processData);
          filesCount++;
        }
      });
      let chkCount = 0;
      function _chk() {
        if (chkCount > 100) {
          reject("Maximum attempts to replace file contents exceeded than allowed threshold.");
          return;
        }
        chkCount++;
        if (processData.processedFiles.length === filesCount) {
          resolve("Path fixed in all the \"" + fileExtension + "\" files. Replaced \"" + stringToReplace + "\" with \"" + replaceWith + "\"");
        } else {
          setTimeout(function () {
            _chk();
          }, 100);
        }
      }
      _chk();
    });
  });
}

module.exports = contentReplacer;
