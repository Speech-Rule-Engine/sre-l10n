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
 * @fileoverview Utillities for file handing, etc.
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
let yjs = require('yamljs');


let SreDir = (process.env['SRE_JSON_PATH']) ?
  path.join(process.env['SRE_JSON_PATH'], '../..', 'mathmaps') :
  'speech-rule-engine/mathmaps';

let SreL10n = path.join(__dirname, '..', '..');
let SreL10nComments = path.join(SreL10n, 'comments');
let SreL10nLocales = path.join(SreL10n, 'rules');

export type JsonRule = [string, string, string];

export interface JsonRules {
  locale: string;
  domain: string;
  kind: string;
  modality: string;
  [propName: string]: any;
  rules: JsonRule[];
}

export type LocaleRules = {[key: string]: JsonRules};

/**
 * Loads and parses a JSON file.
 *
 * @param file The filename.
 * @return The parsed JSON object.
 */
function loadJson(file: string): JsonRules {
  try {
    return (
      JSON.parse(fs.readFileSync(file).toString()) as JsonRules);
  } catch (e) {
    throw new Error('Bad filename or content ' + file);
  }
}


export const sreDomains = ['clearspeak', 'mathspeak', 'prefix', 'summary'];

export const sreLocales: {[iso: string]: string} = {
  'de': 'german',
  'en': 'english',
  'es': 'spanish',
  'fr': 'french',
  'hi': 'hindi',
  'it': 'italian'
};

/**
 * Loads rule actions for a particular locale and domain.
 *
 * @param iso The iso of the locale.
 * @param domain The domain.
 * @param kind The kind of file to load.
 */
export function loadRules(iso: string, domain: string, kind: string = '') {
  let current = sreLocales[iso] || 'base';
  let name = kind ? '_' + kind : '';
  return loadJson(`${SreL10nLocales}/${iso}/${domain}_${current}${name}.json`);
}


/**
 * Loads rule actions for a particular locale and domain.
 *
 * @param iso The iso of the locale.
 * @param domain The domain.
 * @param kind The kind of file to load.
 */
export function loadMathmaps(iso: string, domain: string, kind: string = '') {
  let current = sreLocales[iso] || 'base';
  let name = kind ? '_' + kind : '';
  return loadJson(`${SreDir}/${iso}/rules/${domain}_${current}${name}.json`);
}


/**
 * Saves Rules Json to a file.
 * @param {string} file The filename.
 * @param {any} json The JSON structure.
 * @param {string = ''} dir An optional directory prefix.
 */
export function saveJson(file: string, json: any, dir: string = '') {
  try {
    fs.writeFileSync(path.join(dir, file), JSON.stringify(json, null, 2));
  } catch (e) {
    throw new Error('Bad filename or content' + file);
  }
}


/**
 * Saves Rules Json to a mathmaps.
 * @param {string} file The filename.
 * @param {any} json The JSON structure.
 * @param {string = ''} dir An optional directory prefix.
 */
export function saveMathmaps(
  iso: string, domain: string, json: any, kind: string = '') {
  let current = sreLocales[iso] || 'base';
  let name = kind ? '_' + kind : '';
  saveJson(`${SreDir}/${iso}/rules/${domain}_${current}${name}.json`, json);
}


/**
 * Loads all locale actions for a particular domain.
 * @param {string} domain
 */
export function getRuleSet(domain: string, kind: string = '') {
  let result: LocaleRules = {};
  for (let iso of Object.keys(sreLocales)) {
    try {
      result[iso] = loadMathmaps(iso, domain, kind);
    } catch (_e) {}
  }
  return result;
}


/**
 * Saves Rules Json to the locale directory.
 * @param iso The locale iso.
 * @param domain The domain of the rule set.
 * @param json The JSON for the rules.
 * @param kind The kind of file to save.
 */
export function saveL10n(
  iso: string, domain: string, json: any, kind: string = '') {
  let current = sreLocales[iso] || 'base';
  let name = kind ? '_' + kind : '';
  fs.mkdirSync(`${SreL10nLocales}/${iso}`, {recursive: true});
  saveJson(`${SreL10nLocales}/${iso}/${domain}_${current}${name}.json`, json);
}


/**
 * Saves Yaml to the l10n directory.
 * @param {string} file The filename.
 * @param {any} json The JSON structure.
 * @param {string = ''} dir An optional directory prefix.
 */
export function saveYaml(iso: string, domain: string, yaml: string) {
  let current = sreLocales[iso] || 'base';
  fs.mkdirSync(`${SreL10nLocales}/${iso}`, {recursive: true});
  try {
    fs.writeFileSync(`${SreL10nLocales}/${iso}/${domain}_${current}.yml`, yaml);
  } catch (e) {
    throw new Error('Bad filename for yaml');
  }
}


/**
 * Saves the comments to the l10n directory.
 * @param {string} domain The domain of the comments.
 * @param {any} json The JSON structure.
 */
export function saveComments(domain: string, json: any) {
  fs.mkdirSync(`${SreL10nLocales}`, {recursive: true});
  saveJson(`${SreL10nComments}/${domain}_comments.json`, json);
}


/**
 * Loads the comments from the l10n directory.
 * @param {string} domain The domain of the comments to load.
 * @return The Json structure for a comment set.
 */
export function loadComments(domain: string) {
  fs.mkdirSync(`${SreL10nLocales}`, {recursive: true});
  return loadJson(`${SreL10nComments}/${domain}_comments.json`);
}


export function loadYaml(iso: string, domain: string) {
  let current = sreLocales[iso] || 'base';
  let str = '';
  try {
    str = fs.readFileSync(`${SreL10nLocales}/${iso}/${domain}_${current}.yml`, 'utf8');
  } catch (e) {
    throw new Error('Bad filename for yaml');
  }
  let lines = str.split('\n');
  let result = [];
  for (let line of lines) {
    line = line.replace(/'/g, '\'\'');
    if (line.match(/^\s+- /)) {
      result.push(line.replace(/^(\s+- )/, '$1\'') + '\'');
    } else {
      result.push(line);
    }
  }
  return yjs.parse(result.join('\n'));
}

