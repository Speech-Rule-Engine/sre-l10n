// Copyright 2020 Volker Sorge
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @file Simplistic YAML writer and parser tailor made for rule sets.
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import * as fs from 'fs';
// import {Action} from './rules.js';
const yjs = require('yamljs');

/**
 * @param file
 */
export function toYaml(
  file: string,
  actions: { [name: string]: string[] },
  comments: { [name: string]: { [key: string]: string } }
) {
  const output = [];
  for (const [name, components] of Object.entries(actions)) {
    const out = [];
    const comment = comments[name];
    for (const [param, str] of Object.entries(comment)) {
      out.push(`# ${param}: ${str}`);
    }
    out.push(`${name}:`);
    for (const comp of components) {
      out.push(`  - ${comp}`);
    }
    output.push(out.join('\n'));
  }
  fs.writeFileSync(file, output.join('\n\n') + '\n');
}

/**
 * @param file
 */
export function fromYaml(file: string) {
  const str = fs.readFileSync(file, 'utf8');
  const lines = str.split('\n');
  const result = [];
  for (const line of lines) {
    if (line.match(/^\s+- /)) {
      result.push(line.replace(/^(\s+- )/, "$1'") + "'");
    } else {
      result.push(line);
    }
  }
  return yjs.parse(result.join('\n'));
}
