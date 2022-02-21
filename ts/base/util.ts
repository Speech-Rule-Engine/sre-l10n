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
 * @file Utilities for file handing, etc.
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
const yjs = require('yamljs');

const SreDir = process.env['SRE_JSON_PATH']
  ? path.join(process.env['SRE_JSON_PATH'], '../..', 'mathmaps')
  : 'speech-rule-engine/mathmaps';

const SreL10n = path.join(__dirname, '..', '..');
const SreL10nComments = path.join(SreL10n, 'comments');
const SreL10nLocales = path.join(SreL10n, 'rules');
const SreL10nYaml = path.join(SreL10n, 'yaml');

export type JsonRule = [string, string, string];

export interface JsonRules {
  locale: string;
  domain: string;
  kind: string;
  modality: string;
  [propName: string]: any;
  rules: JsonRule[];
}

export type LocaleRules = { [key: string]: JsonRules };

export const sreDomains = ['clearspeak', 'mathspeak', 'prefix', 'summary'];

export const sreLocales: { [iso: string]: string } = {
  ca: 'catalan',
  da: 'danish',
  de: 'german',
  en: 'english',
  es: 'spanish',
  fr: 'french',
  hi: 'hindi',
  it: 'italian',
  nb: 'bokmal',
  nn: 'nynorsk'
};

// Maps abstract locale name to directory name
// export const abstrLocales: {[abstr: string]: string} = {
//   'base': 'base',
//   'romance': 'base'
// }

/**
 * @param iso
 * @param domain
 * @param kind
 */
function constructFilename(
  iso: string,
  domain: string,
  kind: string
): [string, string] {
  let locale = sreLocales[iso];
  if (!locale) {
    locale = iso === 'base' ? 'base' : 'base_romance';
    iso = 'base';
  }
  const name = kind ? '_' + kind : '';
  return [iso, `${domain}_${locale}${name}`];
}

/**
 * Loads and parses a JSON file.
 *
 * @param file The filename.
 * @returns The parsed JSON object.
 */
function loadJson(file: string): JsonRules {
  try {
    return JSON.parse(fs.readFileSync(file).toString()) as JsonRules;
  } catch (e) {
    throw new Error('Bad filename or content ' + file);
  }
}

/**
 * Loads rule actions for a particular locale and domain.
 *
 * @param iso The iso of the locale.
 * @param domain The domain.
 * @param kind The kind of file to load.
 */
export function loadRules(iso: string, domain: string, kind = '') {
  const [dir, file] = constructFilename(iso, domain, kind);
  return loadJson(`${SreL10nLocales}/${dir}/${file}.json`);
}

/**
 * Loads rule actions for a particular locale and domain.
 *
 * @param iso The iso of the locale.
 * @param domain The domain.
 * @param kind The kind of file to load.
 */
export function loadMathmaps(iso: string, domain: string, kind = '') {
  const [dir, file] = constructFilename(iso, domain, kind);
  return loadJson(`${SreDir}/${dir}/rules/${file}.json`);
}

/**
 * Saves Rules Json to a file.
 *
 * @param {string} file The filename.
 * @param {any} json The JSON structure.
 * @param {string = ''} dir An optional directory prefix.
 */
export function saveJson(file: string, json: any, dir = '') {
  try {
    fs.writeFileSync(
      path.join(dir, file),
      JSON.stringify(json, null, 2) + '\n'
    );
  } catch (e) {
    throw new Error('Bad filename or content' + file);
  }
}

/**
 * Saves Rules Json to a mathmaps.
 *
 * @param {string} file The filename.
 * @param iso
 * @param domain
 * @param {any} json The JSON structure.
 * @param {string = ''} dir An optional directory prefix.
 * @param kind
 */
export function saveMathmaps(
  iso: string,
  domain: string,
  json: any,
  kind = ''
) {
  const [dir, file] = constructFilename(iso, domain, kind);
  saveJson(`${SreDir}/${dir}/rules/${file}.json`, json);
}

/**
 * Saves Rules Json to a mathmaps.
 *
 * @param iso
 * @param kind
 * @param {string} file The filename.
 * @param {any} json The JSON structure.
 * @param {string = ''} dir An optional directory prefix.
 */
export function saveUnicodeMaps(
  iso: string,
  kind: string,
  file: string,
  json: any
) {
  saveJson(`${SreDir}/${iso}/${kind}/${file}`, json);
}

/**
 * Loads all locale actions for a particular domain.
 *
 * @param {string} domain
 * @param kind
 */
export function getRuleSet(domain: string, kind = '') {
  const result: LocaleRules = {};
  for (const iso of Object.keys(sreLocales)) {
    try {
      result[iso] = loadMathmaps(iso, domain, kind);
    } catch (_e) {}
  }
  return result;
}

/**
 * Saves Rules Json to the locale directory.
 *
 * @param iso The locale iso.
 * @param domain The domain of the rule set.
 * @param json The JSON for the rules.
 * @param kind The kind of file to save.
 */
export function saveL10n(
  iso: string,
  domain: string,
  json: any,
  kind = ''
) {
  const [dir, file] = constructFilename(iso, domain, kind);
  fs.mkdirSync(`${SreL10nLocales}/${dir}`, { recursive: true });
  saveJson(`${SreL10nLocales}/${dir}/${file}.json`, json);
}

/**
 * Saves Yaml to the l10n directory.
 *
 * @param {string} file The filename.
 * @param {any} json The JSON structure.
 * @param {string = ''} dir An optional directory prefix.
 * @param iso
 * @param domain
 * @param yaml
 */
export function saveYaml(iso: string, domain: string, yaml: string) {
  const [dir, file] = constructFilename(iso, domain, '');
  fs.mkdirSync(`${SreL10nYaml}/${dir}`, { recursive: true });
  try {
    fs.writeFileSync(`${SreL10nYaml}/${dir}/${file}.yml`, yaml);
  } catch (e) {
    throw new Error('Bad filename for yaml');
  }
}

/**
 * Saves the comments to the l10n directory.
 *
 * @param {string} domain The domain of the comments.
 * @param {any} json The JSON structure.
 */
export function saveComments(domain: string, json: any) {
  fs.mkdirSync(`${SreL10nLocales}`, { recursive: true });
  saveJson(`${SreL10nComments}/${domain}_comments.json`, json);
}

/**
 * Saves the comments to the l10n directory as a yaml file.
 *
 * @param {string} domain The domain of the comments.
 * @param {string} yml The Yaml output.
 */
export function saveCommentsYaml(domain: string, yml: string) {
  fs.mkdirSync(`${SreL10nLocales}`, { recursive: true });
  fs.writeFileSync(`${SreL10nComments}/${domain}_comments.yml`, yml);
}

/**
 * Loads the comments from the l10n directory.
 *
 * @param {string} domain The domain of the comments to load.
 * @returns The Json structure for a comment set.
 */
export function loadComments(domain: string) {
  fs.mkdirSync(`${SreL10nLocales}`, { recursive: true });
  return loadJson(`${SreL10nComments}/${domain}_comments.json`);
}

/**
 * Loads a yaml file for a locale and domain.
 *
 * @param iso The iso code of the locale.
 * @param domain The domain to load.
 */
export function loadYaml(iso: string, domain: string) {
  const [dir, file] = constructFilename(iso, domain, '');
  let str = '';
  try {
    str = fs.readFileSync(`${SreL10nYaml}/${dir}/${file}.yml`, 'utf8');
  } catch (e) {
    throw new Error('Bad filename for yaml');
  }
  const lines = str.split('\n');
  const result = [];
  for (let line of lines) {
    line = line.replace(/'/g, "''");
    if (line.match(/^\s+- /)) {
      result.push(line.replace(/^(\s+- )/, "$1'") + "'");
    } else {
      result.push(line);
    }
  }
  return yjs.parse(result.join('\n'));
}

/**
 * Loads a yaml file for a locale and domain.
 *
 * @param iso The iso code of the locale.
 * @param domain The domain to load.
 */
export function loadCommentsYaml(domain: string) {
  let str = '';
  try {
    str = fs.readFileSync(`${SreL10nComments}/${domain}_comments.yml`, 'utf8');
  } catch (e) {
    throw new Error('Bad filename for yaml');
  }
  return yjs.parse(str);
}

// Below is for Unicode mappings etc.
/**
 * @param iso
 * @param kind
 * @param dir
 */
export function loadMaps(iso: string, kind: string, dir: string = SreDir) {
  const files = fs.readdirSync(`${dir}/${iso}/${kind}/`);
  const maps: { [file: string]: any } = {};
  for (const file of files) {
    if (!file.match(/\.json$/)) {
      continue;
    }
    maps[file] = loadJson(`${dir}/${iso}/${kind}/` + file);
  }
  return maps;
}

/**
 * @param iso
 * @param kind
 * @param file
 * @param json
 */
export function saveMaps(iso: string, kind: string, file: string, json: any) {
  fs.mkdirSync(`${SreL10n}/mathmaps/${iso}/${kind}`, { recursive: true });
  saveJson(`${SreL10n}/mathmaps/${iso}/${kind}/${file}`, json);
}

/**
 * @param iso
 * @param kind
 * @param file
 * @param yaml
 */
export function saveMapsYaml(
  iso: string,
  kind: string,
  file: string,
  yaml: string
) {
  fs.mkdirSync(`${SreL10n}/mathmaps/${iso}/${kind}`, { recursive: true });
  const yml = file.replace(/\.json$/, '.yaml');
  fs.writeFileSync(`${SreL10n}/mathmaps/${iso}/${kind}/${yml}`, yaml);
}

/**
 * Loads a yaml file for a locale and domain.
 *
 * @param iso The iso code of the locale.
 * @param domain The domain to load.
 * @param kind
 */
export function loadMapsYaml(iso: string, kind: string) {
  const files = fs
    .readdirSync(`${SreL10n}/mathmaps/${iso}/${kind}/`)
    .filter((x) => x.match(/\.yaml$/));
  const result: { [key: string]: any } = {};
  for (const file of files) {
    let str = '';
    try {
      str = fs.readFileSync(
        `${SreL10n}/mathmaps/${iso}/${kind}/${file}`,
        'utf8'
      );
    } catch (e) {
      throw new Error('Bad filename for yaml');
    }
    result[file] = yjs.parse(str)[iso];
  }
  return result;
}
