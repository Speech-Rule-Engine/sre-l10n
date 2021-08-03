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
 * @fileoverview Machinery for forward translations of rule sets.
 *
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import {Comment, getComments} from './comment';
import {Action, Component} from './rules';
import * as util from './util';

let grammar: {[attr: string]: boolean} = {
  singular: true,
  plural: true,
  dual: true,
  case: true,
  gender: true
};

let attributes: {[attr: string]: boolean} = {
  context: true,
  pause: true,
  separator: true,
  join: true
};


let yamlPrefix = '# For details on the format see https:///speechruleengine.org/yaml.md';

export class ActionSet {

  /**
   * The comments for this domain.
   */
  public comments: {[name: string]: Comment};

  /**
   * Original JSON rules.
   */
  public json: util.JsonRules;

  /**
   * The actions for each rule.
   */
  public actions: {[name: string]: Action} = {};

  /**
   * The parameter mappings.
   */
  public parameters: {[name: string]: {[key: string]: Component}} = {};

  /**
   * The simplified actions.
   */
  public simple: {[name: string]: Component[]} = {};

  /**
   * The simplified actions as reduced strings.
   */
  public simplified: {[name: string]: string[]} = {};

  /**
   * The order of the rules in the original set. This is to be able to reproduce
   * the rule sets in an expected order.
   */
  public order: string[] = [];

  constructor(public locale: string, public domain: string) {
    this.comments = getComments(domain);
    this.json = util.loadRules(locale, domain, 'actions');
    for (let rule of this.json.rules) {
      this.order.push(rule[1]);
      this.makeAction(rule);
    }
  }

  public outputFiles() {
    util.saveL10n(this.locale, this.domain, this.actions, 'full');
    util.saveL10n(this.locale, this.domain, this.simplified, 'simple');
    util.saveL10n(this.locale, this.domain, this.parameters, 'map');
    util.saveYaml(this.locale, this.domain, this.toYaml());
  }

  public toYaml(): string {
    let output = [yamlPrefix];
    for (let [name, components] of Object.entries(this.simplified)) {
      let out = [this.comments[name].toYaml()];
      out.push(`${name}:`);
      for (let comp of components) {
        out.push(`  - ${comp}`);
      }
      output.push(out.join('\n'));
    }
    return output.join('\n\n') + '\n';
  }

  private makeAction([kind, name, action]: util.JsonRule) {
    if (kind !== 'Action') {
      throw new Error('Illegal rule type: ' + kind);
    }
    let act = Action.fromString(action);
    this.actions[name] = act;
    let [simple, map] = this.makeSimple(act);
    this.parameters[name] = map;
    let comment = this.comments[name];
    if (!comment) {
      comment = new Comment(name, Object.keys(map));
      this.comments[name] = comment;
    }
    if (!comment.locales.includes(this.locale)) {
      comment.locales.push(this.locale);
    }
    this.simple[name] = simple;
    this.simplified[name] = simple.map(
      x => x.toString().replace(/^\[[a-z]\] /, ''));
  }

  private makeSimple(
      action: Action): [Component[], {[key: string]: Component}] {
    let simple = [];
    let map: {[key: string]: Component} = {};
    let count = 1;
    let position = 0;
    for (let comp of action.components) {
      if (comp.localizable()) {
        // simple.push(this.cleanComp(comp.clone()));
        simple.push(this.cleanComp(comp.clone()));
      } else if (comp.type === 'PERSONALITY') {
        if (position !== 0) {
          console.warn('WARNING: Non-leading personality annotation!');
        } else {
          continue;
        }
      } else {
        let newComp = comp.clone();
        let param = `%${count++}`;
        newComp.content = param;
        map[param] = comp;
        simple.push(this.cleanComp(newComp));
      }
      position++;
    }
    return [simple, map];
  }

  private cleanComp(component: Component): Component {
    // separator case
    if (component.attributes) {
      if (component?.attributes['separator'] &&
        component.attributes['sepFunc']) {
        delete component.attributes['separator'];
      }
      for (let key of Object.keys(component.attributes)) {
        console.log(key);
        if (!attributes[key]) {
          delete component.attributes[key];
        }
      }
    }
    if (component.grammar) {
      for (let key of Object.keys(component.grammar)) {
        if (!grammar[key]) {
          delete component.grammar[key];
        }
      }
    }
    return component;
  }

}
