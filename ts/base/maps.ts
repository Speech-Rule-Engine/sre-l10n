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

import {loadMaps, saveMaps, saveMapsYaml} from './util';

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
    let comment = `Abbreviations: ${entry.names.join(', ')}`
    if (entry.mappings?.default?.default) {
      result += `  key: ${entry.mappings.default.default} #${comment}\n`;
    } else if (entry.mappings?.clearspeak?.default) {
      result += `  key: ${entry.mappings.clearspeak.default} #${comment}\n`;
    } else if (entry.mappings?.mathspeak?.default) {
      result += `  key: ${entry.mappings.mathspeak.default} #${comment}\n`;
    }
  }
  return result;
}


export function convertUnits(iso: string) {
  let maps = loadMaps(iso, 'units');
  for (let [file, map] of Object.entries(maps)) {
    let newMap = convertUnitMap(map);
    saveMapsYaml(iso, 'units', file, `${iso}:\n${newMap}`);
  }
}


// Currently no dual.
function convertUnitMap(json: any[], iso: string = 'en') {
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
