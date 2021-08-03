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
 * @fileoverview Simplistic YAML writer and parser tailor made for rule sets.
 *
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import * as fs from 'fs';
// import {Action} from './rules';
let yjs = require('yamljs');


export function toYaml(file: string, actions: {[name: string]: string[]},
                       comments: {[name: string]: {[key: string]: string}}) {
  let output = [];
  for (let [name, components] of Object.entries(actions)) {
    let out = [];
    let comment = comments[name];
    for (let [param, str] of Object.entries(comment)) {
      out.push(`# ${param}: ${str}`);
    }
    out.push(`${name}:`);
    for (let comp of components) {
      out.push(`  - ${comp}`);
    }
    output.push(out.join('\n'));
  }
  fs.writeFileSync(file, output.join('\n\n') + '\n');
}


export function fromYaml(file: string) {
  let str = fs.readFileSync(file, 'utf8');
  let lines = str.split('\n');
  let result = [];
  for (let line of lines) {
    if (line.match(/^\s+- /)) {
      result.push(line.replace(/^(\s+- )/, '$1\'') + '\'');
    } else {
      result.push(line);
    }
  }
  return yjs.parse(result.join('\n'));
}
