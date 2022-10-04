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
 * @file Maps for CrowdIn
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import {
  loadMaps,
  loadMapsYaml,
  saveUnicodeMaps,
  saveMaps,
  saveMapsYaml,
  sreLocales
} from './util';
import { locales } from '../../speech-rule-engine/js/l10n/l10n';

// Forward conversion
/**
 * @param iso
 */
export function convertSymbols(iso: string) {
  const maps = loadMaps(iso, 'symbols');
  for (const [file, map] of Object.entries(maps)) {
    const newMap = convertSymbolMap(map);
    saveMaps(iso, 'symbols', file, newMap);
  }
}

/**
 * @param json
 */
function convertSymbolMap(json: any[]) {
  const result: { [key: string]: string } = {};
  for (const entry of json) {
    if (!entry.key) continue;
    const key = String.fromCodePoint(parseInt(entry.key, 16));
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

/**
 * @param iso
 */
export function convertFunctions(iso: string) {
  const maps = loadMaps(iso, 'functions');
  for (const [file, map] of Object.entries(maps)) {
    const newMap = convertFunctionMap(map);
    saveMapsYaml(iso, 'functions', file, `${iso}:\n${newMap}`);
  }
}

/**
 * @param json
 */
function convertFunctionMap(json: any[]) {
  let result = '';
  for (const entry of json) {
    if (!entry.key) continue;
    const key = yamlKey(entry.key);
    const comment = `Abbreviations: ${entry.names.join(', ')}`;
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

/**
 * @param iso
 */
export function convertUnits(iso: string) {
  const maps = loadMaps(iso, 'units');
  for (const [file, map] of Object.entries(maps)) {
    const newMap = convertUnitMap(map, iso);
    saveMapsYaml(iso, 'units', file, `${iso}:\n${newMap}`);
  }
}

// Currently no dual.
/**
 * @param json
 * @param iso
 */
function convertUnitMap(json: any[], iso: string) {
  let result = '';
  let locale = locales[iso]();
  for (const entry of json) {
    if (!entry.key) continue;
    const key = yamlKey(entry.key);
    const comment = `${entry.names.join(', ')}`;
    result += `  ${key}: #${comment}\n`;
    result += `    one: ${entry.mappings.default.default}\n`;
    if (entry.mappings?.default?.plural) {
      result += `    other: ${entry.mappings.default.plural}\n`;
    } else {
      result += `    other: ${locale.FUNCTIONS.plural(entry.mappings.default.default)}\n`;
    }
  }
  return result;
}

/**
 * @param iso
 */
export function convertMessages(iso: string) {
  const maps = loadMaps(iso, 'messages');
  const messages = maps['messages.json']['messages'];
  console.log(messages);
  console.log(messages['navigate']);
  saveMapsYaml(
    iso,
    'messages',
    'navigation.yaml',
    `${iso}:\n${convertSimpleMap(messages['navigate'])}`
  );
  saveMapsYaml(
    iso,
    'messages',
    'roles.yaml',
    `${iso}:\n${convertSimpleMap(messages['role'])}`
  );
  saveMapsYaml(
    iso,
    'messages',
    'enclose.yaml',
    `${iso}:\n${convertSimpleMap(messages['enclose'])}`
  );
  saveMapsYaml(
    iso,
    'messages',
    'mathspeak.yaml',
    `${iso}:\n${convertSimpleMap(messages['MS'])}`
  );
}

/**
 *
 */
function convertSimpleMap(json: { [key: string]: string }) {
  const yaml = [];
  for (const [key, value] of Object.entries(json)) {
    yaml.push(`  ${key}: ${value}`);
  }
  return yaml.join('\n');
}

// Backward conversion
const CrowdInSrc = `${__dirname}/../../mathmaps`;

/**
 * @param iso
 */
export function retrieveSymbols(iso: string) {
  const srcs = loadMaps(iso, 'symbols', CrowdInSrc);
  const dsts = loadMaps(iso, 'symbols');
  for (const file of Object.keys(srcs)) {
    const src = srcs[file];
    const dst = dsts[file];
    for (const entry of dst) {
      if (!entry.key) continue;
      const symb = String.fromCodePoint(parseInt(entry.key, 16));
      const lookup = src[symb];
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

/**
 * @param iso
 */
export function retrieveFunctions(iso: string) {
  const srcs = loadMapsYaml(iso, 'functions');
  const dsts = loadMaps(iso, 'functions');
  for (const [yaml, src] of Object.entries(srcs)) {
    const file = yaml.replace(/\.yaml$/, '.json');
    const dst = dsts[file];
    for (const entry of dst) {
      if (!entry.key) continue;
      const key = yamlKey(entry.key);
      const lookup = src[key];
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

/**
 * @param iso
 */
export function retrieveUnits(iso: string) {
  const srcs = loadMapsYaml(iso, 'units');
  const dsts = loadMaps(iso, 'units');
  for (const [yaml, src] of Object.entries(srcs)) {
    const file = yaml.replace(/\.yaml$/, '.json');
    const dst = dsts[file];
    for (const entry of dst) {
      if (!entry.key) continue;
      const key = yamlKey(entry.key);
      const lookup = src[key];
      if (lookup) {
        // one is default
        if (entry.mappings.default.default !== lookup.one) {
          console.info(
            `New entry found for ${entry.key} singular: ${lookup.one}`
          );
          entry.mappings.default.default = lookup.one;
        }
        // other is plural
        if (
          !entry.mappings.default.plural ||
          entry.mappings.default.plural !== lookup.other
        ) {
          console.info(
            `New entry found for ${entry.key} plural: ${lookup.other}`
          );
          entry.mappings.default.plural = lookup.other;
        }
      }
      saveUnicodeMaps(iso, 'units', file, dst);
    }
  }
}

/**
 * Make a yaml compatible key by replacing spaces with underscores.
 * @param {string} key The key to rewrite.
 */
function yamlKey(key: string) {
  return key.replace(/ /g, '_');
}

/**
 * Reformats the mathmap files.
 * @param {string} iso 
 */
export function cleanMaps(iso: string) {
  cleanMaps_(iso, 'symbols');
  cleanMaps_(iso, 'functions');
  cleanMaps_(iso, 'units');
}

function cleanMaps_(iso: string, kind: string) {
  let maps = loadMaps(iso, kind);
  for (let [file, map] of Object.entries(maps)) {
    saveUnicodeMaps(iso, kind, file, map);
  }
}

/**
 * Key comparison for all locales.
 */
export function compareMaps(kind: string = 'symbols') {
  let files: {[key: string]: string[]} = {};
  let result: {[key: string]: string[]} = {};
  for (let iso of Object.keys(sreLocales)) {
    let maps = loadMaps(iso, kind);
    for (let file of Object.keys(maps)) {
      if (files[file]) {
        files[file].push(iso);
      } else {
        files[file] = [iso];
      }
      for (let obj of maps[file]) {
        let key = obj.key;
        if (!key) continue;
        if (result[key]) {
          result[key].push(iso);
        } else {
          result[key] = [iso];
        }
      }
    }
  }
  return [filterComparison(files), filterComparison(result)];
}

function filterComparison(list: {[key: string]: string[]}) {
  let expected = Object.keys(sreLocales).length;
  let result: {[key: string]: string[]} = {};
  for (let [key, value] of Object.entries(list)) {
    if (value.length !== expected) {
      result[key] = value;
    }
  }
  return result;
}
