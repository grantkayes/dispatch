'use strict';

const readline = require('readline');
const fs = require('fs');

/*
 * Numbers throw off the regex, so just replace with wildcard
 */
const hasNumber = (myString) => {
  return /\d/.test(myString);
}

/* 
 * A single endpoint process/job, returns promise that resolves
 * when an endpoint match is found. Either matches the exact path,
 * matches with regex or returns 404
 */
const dispatch = (endpoints, line) => {
  const NOT_FOUND_CODE = "404";

  return new Promise(resolve => {
    let regexString = "^";

    if (line === "/") {
      regexString = "^/$";
    } else {
      let pathVars = line.split("/").slice(1);
      for (let i = 0; i < pathVars.length; i++) {
          regexString = regexString + `/(${pathVars[i]}|X)`;
      }
      regexString = regexString + "$";
    }

    const regexPath = new RegExp(regexString);

    Object.keys(endpoints).forEach(key => {
      if (key === line) {
        resolve(endpoints[key]);
      } else if (regexPath.test(key)) {
        resolve(endpoints[key]);
      }
    });
    
    resolve(NOT_FOUND_CODE);
  });
}

/* Async processing of requests, read input file*/
const processEndpoints = (endpoints, filename) => {
  const reader = readline.createInterface({
    input: fs.createReadStream(filename)
  });

  reader.on('line', async (line) => {
    let result = await dispatch(endpoints, line);
    console.log(result);
  });
}

/* Read config from file and pass that data on*/
const readConfig = (filename, callback) => {
  let config = {};
  const reader = readline.createInterface({
    input: fs.createReadStream(filename)
  });

  reader.on('line', (line) => {
    let linepath = line.split(/[ ,]+/)[0];
    let action = line.split(/[ ,]+/)[1];
    config[linepath] = action;
  }).on('close', () => {
    callback(config);
  });
}

/* Run program */
const main = () => {
  const configFilePath = process.argv[2];
  const endpointsFilePath = process.argv[3];
  readConfig(configFilePath, (config) => {
    processEndpoints(config, endpointsFilePath);
  });
}

main();