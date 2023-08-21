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
 * @file Machinery for forward translating of rule sets.
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import { readComments, writeComments } from './comment.js';
import { ActionSet, ReturnSet } from './forward.js';
import * as util from './util.js';

export const verbose = false;
export const update = false;

/**
 *
 */
export function translateForwardAll(locales = Object.keys(util.sreLocales)) {
  readComments();
  for (const domain of util.sreDomains) {
    for (const loc of Object.keys(util.sreLocales)) {
      try {
        const acs = new ActionSet(loc, domain);
        if (locales.indexOf(loc) !== -1) {
          acs.outputFiles();
        }
      } catch (e) {
        if (verbose) {
          console.error(e);
        }
        console.error(
          `Something went wrong for domain ${domain} in locale ${loc}`
        );
      }
    }
    writeComments(domain);
  }
}

/**
 *
 */
export function translateBackwardAll(locales = Object.keys(util.sreLocales)) {
  for (const domain of util.sreDomains) {
    for (const loc of Object.keys(util.sreLocales)) {
      try {
        const acs = new ReturnSet(loc, domain);
        if (locales.indexOf(loc) !== -1) {
          acs.outputFiles();
        }
      } catch (e) {
        if (verbose) {
          console.error(e);
        }
        console.error(
          `Something went wrong for domain ${domain} in locale ${loc}`
        );
      }
    }
  }
}
