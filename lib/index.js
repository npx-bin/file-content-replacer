var fs = require("fs");
var recursive = require("recursive-readdir");

var FileContentReplacer = {
  doReplace: function (filePath, replace, replaceWith, processData) {
    fs.readFile(filePath, function (err, data) {
      var fileContents, updatedData;
      if (err) {
        processData.processedFiles.push(filePath);
        processData.errorFiles.push(FileContentReplacer.getErrorDescriptor(filePath, err));
        return;
      }

      fileContents = data.toString();
      updatedData = fileContents.replace(replace, replaceWith);
      if (fileContents === updatedData) {
        processData.processedFiles.push(filePath);
        return;
      }
      fs.writeFile(filePath, updatedData, function (err) {
        if (err) {
          processData.errorFiles.push(FileContentReplacer.getErrorDescriptor(filePath, err));
        }
        processData.processedFiles.push(filePath);
        processData.successFiles.push(filePath);
      });
    });
  },
  getErrorDescriptor: function (filePath, err) {
    var ed = {};
    ed["filePath"] = filePath;
    ed["error"] = (err && err.toString) ? err.toString() : err;
    return ed;
  },
  /**
   * 
   * @param {*} directoryPath [type: string] - Path of the directory.
   * @param {*} fileMatcher [type: function] - Predicate function for matching files.
   * @param {*} replace [type: string|RegExp] - The substring to be replaced.
   * @param {*} replaceWith [type: string|function] - The replacement which will replace the substring
   * @param {*} options [type: Object] - Configuration object.
   */
  fileContentReplacer: function (directoryPath, fileMatcher, replace, replaceWith, options) {
    var args = arguments;
    function type_func(val) { return typeof val === "function"; }
    function type_str(val) { return typeof val === "string"; }
    function type_str_regexp(val) { return (typeof val === "string" || val instanceof RegExp); }
    function type_str_func(val) { return (typeof val === "string" || typeof val === "function"); }
    function type_obj(val) { return typeof val === "object" }
    return new Promise(function (resolve, reject) {
      var argTypeMap = [
        { name: "directoryPath", type: type_str, msg: "string" },
        { name: "fileMatcher", type: type_func, msg: "function" },
        { name: "replace", type: type_str_regexp, msg: "string or RegExp" },
        { name: "replaceWith", type: type_str_func, msg: "string or function" },
        { name: "options", type: type_obj, msg: "Object" }
      ];
      if (args.length < 4) {
        reject("[FCR] Insufficient Arguments - Required \"directoryPath, fileMatcher, replace, replaceWith\"");
        return;
      }
      for (var i = 0; i < 4; i++) {
        if (!args[i]) {
          reject("[FCR] Invalid Argument - Cannot be null / undefined / empty");
          return;
        }
        if (!argTypeMap[i]["type"](args[i])) {
          reject("[FCR] Type Mismatch - Expected \"" + argTypeMap[i]["msg"] + "\" type of argument for {" + argTypeMap[i]["name"] + "}, got \"" + (typeof args[i]) + "\"");
          return;
        }
      }
      if (args[4] && !argTypeMap[4]["type"](args[4])) {
        reject("[FCR] Type Mismatch - Expected \"" + argTypeMap[4]["msg"] + "\" type of argument for {" + argTypeMap[4]["name"] + "}, got \"" + (typeof args[4]) + "\"");
        return;
      }

      recursive(directoryPath, function (err, files) {
        if (err || !files || !files.length) {
          reject("[FCR] Unable to scan the directory: " + directoryPath);
          return;
        }
        var processData = {
          processedFiles: [],
          errorFiles: [],
          successFiles: []
        };
        var filesCount = 0;
        files.forEach(function (file) {
          if (fileMatcher(file)) {
            FileContentReplacer.doReplace(file, replace, replaceWith, processData);
            filesCount++;
          }
        });
        if (filesCount === 0) {
          resolve("[FCR] No files found matching the fileMatcher criteria.");
          return;
        }
        var start = new Date().getTime();
        var timeout = ((options && options.timeoutMillis) ? Number(options.timeoutMillis) || 20000 : 20000);
        var interval = Math.min(timeout, 100);
        function _chk() {
          if ((new Date().getTime() - start) > timeout) {
            reject("[FCR] Operation Timedout: Time exceeded the allowed threshold.");
            return;
          }
          if (processData.processedFiles.length === filesCount) {
            var resolveData = {};
            var resolveMessage = "[FCR] Replacement DONE in " + processData.successFiles.length + " files.";
            if (processData.errorFiles.length) {
              resolveMessage += "\n\n[FCR] Replacement FAILED for the following " + processData.errorFiles.length + " files:";
              for (var f = 0; f < processData.errorFiles.length; f++) {
                resolveMessage += "\n" + processData.errorFiles[f]["filePath"] + ": " + processData.errorFiles[f]["error"];
              }
            }
            resolveData.message = resolveMessage;
            resolveData.data = {
              matchingFilesCount: filesCount,
              filesSuccessfulCount: processData.successFiles.length,
              filesSuccess: processData.successFiles,
              filesFailedCount: processData.errorFiles.length,
              filesFailed: processData.errorFiles
            };
            resolve(resolveData);
            return;
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
};

module.exports = FileContentReplacer.fileContentReplacer;
