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

export let referenceSets: {[locale: string]: BaseSet} = {};

let grammar: {[attr: string]: boolean} = {
  singular: true,
  plural: true,
  dual: true,
  case: true,
  gender: true,
  article: true
};

let attributes: {[attr: string]: boolean} = {
  context: true,
  pause: true,
  separator: true,
  join: true
};


let yamlPrefix = '# For details on the format see https:///speechruleengine.org/yaml.md';

abstract class BaseSet {

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
    this.json = util.loadMathmaps(locale, domain, 'actions');
    for (let rule of this.json.rules) {
      this.order.push(rule[1]);
      this.makeAction(rule);
    }
    referenceSets[locale] = this;
  }

  private makeAction([kind, name, action]: util.JsonRule) {
    if (kind !== 'Action') {
      throw new Error('Illegal rule type: ' + kind);
    }
    let act = Action.fromString(action);
    this.actions[name] = act;
  }

}

export class ActionSet extends BaseSet {

  /**
   * The comments for this domain.
   */
  public comments: {[name: string]: Comment};

  /**
   * @override
   */
  constructor(public locale: string, public domain: string) {
    super(locale, domain);
    this.comments = getComments(domain);
    for (let rule of this.order) {
      this.makeParams(rule);
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
      let out = [this.comments[name].toYaml(this.locale)];
      out.push(`${name}:`);
      for (let comp of components) {
        out.push(`  - ${comp}`);
      }
      output.push(out.join('\n'));
    }
    return output.join('\n\n') + '\n';
  }

  private makeParams(name: string) {
    let act = this.actions[name];
    let [simple, map] = this.makeSimple(act);
    this.parameters[name] = map;
    this.makeComments(name);
    this.simple[name] = simple;
    this.simplified[name] = simple.map(
      x => x.toString().replace(/^\[[a-z]\] /, ''));
  }

  private makeComments(name: string) {
    let comment = this.comments[name];
    let keys = Object.keys(this.parameters[name]);
    if (!comment) {
      comment = new Comment(name, keys);
      this.comments[name] = comment;
      comment.reference = this.locale;
    }
    comment.update(this.locale, keys);
  }


  private makeSimple(
      action: Action): [Component[], {[key: string]: Component}] {
    let simple = [];
    let map: {[key: string]: Component} = {};
    let ncount = 1;
    let tcount = 1;
    let position = 0;
    for (let comp of action.components) {
      if (comp.type === 'PERSONALITY') {
        if (position !== 0) {
          console.warn('WARNING: Non-leading personality annotation!');
        } else {
          map['%0'] = comp.clone();
          continue;
        }
      } else {
        let newComp = comp.clone();
        let param = '';
        if (comp.localizable()) {
          param = `$${tcount++}`;
          newComp.content = `${param}: ${newComp.content}`;
        } else {
          param = `%${ncount++}`;
          newComp.content = param;
        }
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


export class ReturnSet extends BaseSet {

  constructor(locale: string, domain: string) {
    super(locale, domain);
    this.simplified = util.loadYaml(locale, domain);
    this.parameters = util.loadRules(locale, domain, 'map');
    this.updateActions();
  }

  /**
   * Updates the actions from the yaml input.
   */
  public updateActions() {
    let simpOrder = Object.keys(this.simplified);
    for (let rule of this.order) {
      let simple = this.simplified[rule];
      delete this.simplified[rule];
      if (!simple) {
        delete this.actions[rule];
        continue;
      }
      this.actions[rule] = this.updateAction(simple, this.parameters[rule]);
    }
    for (let [name, rule] of Object.entries(this.simplified)) {
      if (this.findPrecondition(name)) {
        // Check backwards for new rules preconditions.
        //
        // If found insert the new action.
        // Add new action name into order according to it's simpOrder position.
        //
        // Lookup in default actions (currently english, later add base once
        // everything is fully commented).
        let def = this.findDefaultAction(name);
        if (def) {
          this.actions[name] = this.updateAction(rule, def);
        } else {
          this.actions[name] = this.updateAction(rule, {});
          console.info('New actions needs to be cleaned: ' + name);
        }
        this.order.splice(simpOrder.indexOf(name), 0, name);
      } else {
        this.actions[name] = this.updateAction(rule, {});
        console.info('New rule that needs to be added manually: ' + name);
      }
    }
  }

  private defActions: util.JsonRules = null;

  private findDefaultAction(rule: string) {
    if (!this.defActions) {
      this.defActions = util.loadRules('en', this.domain, 'map');
    }
    return this.defActions[rule];
  }

  private preconds: {[rule: string]: boolean} = null;

  private findPrecondition(rule: string) {
    if (!this.preconds) {
      this.preconds = {};
      let inherits = this.locale;
      while (inherits) {
        let precs = util.loadMathmaps(inherits, this.domain);
        precs.rules.forEach(x => this.preconds[x[1]] = true);
        inherits = precs.inherits;
      }
    }
    return this.preconds[rule];
  }

  private updateAction(simple: any, map: any): Action {
    let comps = [];
    if (map['%0']) {
      comps.push(new Component(map['%0']));
    }
    for (let cstr of simple) {
      let comp = Component.fromString('[t] ' + cstr);
      let real = map[comp.content];
      if (!real) {
        // We have a textual component.
        let match = comp.content.match(/^\s*(\$\d+)\s*:{0,1}\s*/);
        if (!match) {
          // New textual component. Push as given.
          comps.push(comp);
          continue;
        }
        comp.content = comp.content.replace(match[0], '');
        real = map[match[1]];
        if (!real) {
          // New textual component with a new hash parameter (e.g., introduced
          // manually). Ignore parameter and push as is.
          comps.push(comp);
          continue;
        }
        // Replace old textual content with the new one.
        real.content = comp.content;
      }
      // Merge old and new attributes
      real.attributes = this.syncAttributes(
        comp.attributes, real.attributes, Object.keys(attributes));
      // Merge old and new grammar
      real.grammar = this.syncAttributes(
        comp.grammar, real.grammar, Object.keys(grammar));
      comps.push(new Component(real));
    }
    return new Action(comps);
  }

  // Sync the first into the second, wrt. keys
  private syncAttributes(src: {[key: string]: (string | boolean)},
                         dst: {[key: string]: (string | boolean)},
                         keys: string[]) {
    src = src || {};
    dst = dst || {};
    Object.assign(dst, src);
    for (let key of keys) {
      // separator case
      if (key === 'separator' && dst['sepFunc']) {
        continue;
      }
      if (src[key] === undefined) {
        delete dst[key];
      }
    }
    return dst;
  }

  /**
   * @override
   */
  public outputFiles() {
    let rules: util.JsonRule[] = [];
    for (let rule of this.order) {
      let action = this.actions[rule];
      rules.push(['Action', rule, action.toString()]);
    }
    this.json.rules = rules;
    util.saveMathmaps(this.locale, this.domain, this.json, 'actions');
  }

}
