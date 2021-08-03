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
 * @fileoverview Machinery for forward translating of rule sets.
 *
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import {readComments, writeComments} from './comment';
import {ActionSet} from './forward';
import * as util from './util';


export function translateForwardAll() {
  readComments();
  for (let domain of util.sreDomains) {
    for (let loc of Object.keys(util.sreLocales)) {
      try {
        let acs = new ActionSet(loc, domain);
        acs.outputFiles();
      } catch (_e) {}
    }
    writeComments(domain);
  }
}
