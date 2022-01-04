//
// Copyright 2020 Volker Sorge
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Maps for CrowdIn
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import {loadMaps, loadMapsYaml, saveUnicodeMaps, saveMaps, saveMapsYaml} from './util';

// Forward conversion
export function convertSymbols(iso: string) {
  let maps = loadMaps(iso, 'symbols');
  for (let [file, map] of Object.entries(maps)) {
    let newMap = convertSymbolMap(map);
    saveMaps(iso, 'symbols', file, newMap);
  }
}

function convertSymbolMap(json: any[]) {
  let result: {[key: string]: string} = {};
  for (let entry of json) {
    if (!entry.key) continue;
    let key = String.fromCodePoint(parseInt(entry.key, 16));
    if (entry.mappings?.default?.default) {
      result[key] = entry.mappings.default.default;
    } else if (entry.mappings?.clearspeak?.default) {
      result[key] = entry.mappings.clearspeak.default;
    } else if (entry.mappings?.mathspeak?.default) {
      result[key] = entry.mappings.mathspeak.default;
    }
  }
  return result;
}


export function convertFunctions(iso: string) {
  let maps = loadMaps(iso, 'functions');
  for (let [file, map] of Object.entries(maps)) {
    let newMap = convertFunctionMap(map);
    saveMapsYaml(iso, 'functions', file, `${iso}:\n${newMap}`);
  }
}


function convertFunctionMap(json: any[]) {
  let result = '';
  for (let entry of json) {
    if (!entry.key) continue;
    let key = entry.key;
    let comment = `Abbreviations: ${entry.names.join(', ')}`
    if (entry.mappings?.default?.default) {
      result += `  ${key}: ${entry.mappings.default.default} #${comment}\n`;
    } else if (entry.mappings?.clearspeak?.default) {
      result += `  ${key}: ${entry.mappings.clearspeak.default} #${comment}\n`;
    } else if (entry.mappings?.mathspeak?.default) {
      result += `  ${key}: ${entry.mappings.mathspeak.default} #${comment}\n`;
    }
  }
  return result;
}


export function convertUnits(iso: string) {
  let maps = loadMaps(iso, 'units');
  for (let [file, map] of Object.entries(maps)) {
    let newMap = convertUnitMap(map, iso);
    saveMapsYaml(iso, 'units', file, `${iso}:\n${newMap}`);
  }
}


// Currently no dual.
function convertUnitMap(json: any[], iso: string) {
  let result = '';
  for (let entry of json) {
    if (!entry.key) continue;
    let key = entry.key.replace(/ /g, '_');
    let comment = `${entry.names.join(', ')}`
    result += `  ${key}: #${comment}\n`;
    result += `    one: ${entry.mappings.default.default}\n`;
    if (entry.mappings?.default?.plural) {
      result += `    other: ${entry.mappings.default.plural}\n`;
    } else {
      result += `    other: ${entry.mappings.default.default}${iso === 'en' ? 's' : ''}\n`;
    }
  }
  return result;
}


export function convertMessages(iso: string) {
  let maps = loadMaps(iso, 'messages');
  let messages = maps['messages.json']['messages'];
  console.log(messages);
  console.log(messages['navigate']);
  saveMapsYaml(iso, 'messages', 'navigation.yaml',
               `${iso}:\n${convertSimpleMap(messages['navigate'])}`);
  saveMapsYaml(iso, 'messages', 'roles.yaml',
               `${iso}:\n${convertSimpleMap(messages['role'])}`);
  saveMapsYaml(iso, 'messages', 'enclose.yaml',
               `${iso}:\n${convertSimpleMap(messages['enclose'])}`);
  saveMapsYaml(iso, 'messages', 'mathspeak.yaml',
               `${iso}:\n${convertSimpleMap(messages['MS'])}`);
}


function convertSimpleMap(json: {[key: string]: string}) {
  let yaml = [];
  for (let [key, value] of Object.entries(json)) {
    yaml.push(`  ${key}: ${value}`);
  }
  return yaml.join('\n');
}


// Backward conversion
let CrowdInSrc = `${__dirname}/../../mathmaps`;

export function retrieveSymbols(iso: string) {
  let srcs = loadMaps(iso, 'symbols', CrowdInSrc);
  let dsts = loadMaps(iso, 'symbols');
  for (let file of Object.keys(srcs)) {
    let src = srcs[file];
    let dst = dsts[file];
    for (let entry of dst) {
      if (!entry.key) continue;
      let lookup = src[entry.key];
      if (lookup) {
        if (entry.mappings.default.default !== lookup) {
          console.info(`New entry found for ${entry.key}: ${lookup}`);
          entry.mappings.default.default = lookup;
        }
      }
      saveUnicodeMaps(iso, 'symbols', file, dst);
    }
  }
}

export function retrieveFunctions(iso: string) {
  let srcs = loadMapsYaml(iso, 'functions');
  let dsts = loadMaps(iso, 'functions');
  for (let [yaml, src] of Object.entries(srcs)) {
    let file = yaml.replace(/\.yaml$/, '.json');
    let dst = dsts[file];
    for (let entry of dst) {
      if (!entry.key) continue;
      let lookup = src[entry.key];
      if (lookup) {
        if (entry.mappings.default.default !== lookup) {
          console.info(`New entry found for ${entry.key}: ${lookup}`);
          entry.mappings.default.default = lookup;
        }
      }
      saveUnicodeMaps(iso, 'functions', file, dst);
    }
  }
}

export function retrieveUnits(iso: string) {
  let srcs = loadMapsYaml(iso, 'units');
  let dsts = loadMaps(iso, 'units');
  for (let [yaml, src] of Object.entries(srcs)) {
    let file = yaml.replace(/\.yaml$/, '.json');
    let dst = dsts[file];
    for (let entry of dst) {
      if (!entry.key) continue;
      let lookup = src[entry.key];
      if (lookup) {
        // one is default
        if (entry.mappings.default.default !== lookup.one) {
          console.info(`New entry found for ${entry.key} singular: ${lookup.one}`);
          entry.mappings.default.default = lookup.one;
        }
        // other is plural
        if (!entry.mappings.default.plural ||
          (entry.mappings.default.plural !== lookup.other)) {
          console.info(`New entry found for ${entry.key} plural: ${lookup.other}`);
          entry.mappings.default.plural = lookup.other;
        }
      }
      saveUnicodeMaps(iso, 'units', file, dst);
    }
  }
}
