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
 * @file Utility working on modified SRE rule structures.
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import { Action } from './rules.js';
import {
  getRuleSet,
  JsonRule,
  JsonRules,
  loadMathmaps,
  LocaleRules,
  saveJson,
  saveMathmaps,
  SreDir
} from './util.js';

/**
 * @param act1
 * @param act2
 */
export function compareActions(act1: string, act2: string) {
  const comp1 = Action.fromString(act1).components;
  const comp2 = Action.fromString(act2).components;
  if (comp1.length !== comp2.length) {
    return false;
  }
  for (let i = 0; i < comp1.length; i++) {
    if (comp1[i].toString() !== comp2[i].toString()) {
      return false;
    }
  }
  return true;
}

/**
 * Selects a named rule from one locale.
 *
 * @param {LocaleRules} rules The set of all rules.
 * @param {string} rule The rule name to select.
 */
export function selectRule(rules: JsonRules, rule: string) {
  return rules.rules.find((a: JsonRule) => a[1] === rule);
}

/**
 * Selects a named rule from all locales.
 *
 * @param {LocaleRules} rules The set of all rules.
 * @param locale
 * @param {string} rule The rule name to select.
 */
export function selectRules(locale: LocaleRules, rule: string) {
  const results: { [iso: string]: JsonRule } = {};
  for (const [iso, rules] of Object.entries(locale)) {
    const localeRule = selectRule(rules, rule);
    if (localeRule) {
      results[iso] = localeRule;
    } else {
      console.info(`Entry ${rule} does not exist in locale ${iso}`);
    }
  }
  return results;
}

const domainActions: { [domain: string]: LocaleRules } = {};
/**
 * @param domain
 */
export function allActions(domain: string) {
  if (domainActions[domain]) {
    return domainActions[domain];
  }
  domainActions[domain] = getRuleSet(domain, 'actions');
  return domainActions[domain];
}

/**
 * Print a comparison table for an action in all locales.
 *
 * @param {string} domain The domain.
 * @param {string} action The action.
 */
export function showActions(domain: string, action: string) {
  const actions = selectRules(allActions(domain), action);
  for (const [iso, action] of Object.entries(actions)) {
    console.log(`${iso}: ${action}`);
  }
}

/**
 * @param domain
 */
export function actionsComparison(domain: string) {
  const actions = allActions(domain);
  const first = Object.values(actions)[0];
  const result: string[] = [];
  for (const action of first.rules) {
    const name = action[1];
    let comp = true;
    for (const act of Object.values(actions)) {
      const comparing = selectRule(act, name);
      if (!comparing) {
        comp = false;
        break;
      }
      if (!compareActions(action[2], comparing[2])) {
        comp = false;
        break;
      }
    }
    if (comp) {
      result.push(name);
    }
  }
  return result;
}

/**
 * @param rules
 * @param names
 */
function removeRules(rules: JsonRule[], names: string[]) {
  const restRules = [];
  const baseRules = [];
  for (const rule of rules) {
    if (names.includes(rule[1])) {
      baseRules.push(rule);
    } else {
      restRules.push(rule);
    }
  }
  return [baseRules, restRules];
}

/**
 * @param domain
 * @param names
 */
export function moveRules(domain: string, names: string[]) {
  const actions = allActions(domain);
  let baseActions = null;
  for (const [iso, rule] of Object.entries(actions)) {
    const [base, rest] = removeRules(rule.rules, names);
    rule.rules = rest;
    saveMathmaps(iso, domain, rule, 'actions');
    baseActions = base;
  }
  const baseActionsSet = loadMathmaps('base', domain, 'actions');
  baseActionsSet.rules = baseActionsSet.rules.concat(baseActions);
  saveMathmaps('base', domain, baseActionsSet, 'actions');
}

/**
 * Adds an empty rule set to the original mathmaps for new locales.
 *
 * @param {string} iso The iso code.
 * @param {string} lang The language string.
 */
export function emptyRules(iso: string, lang: string) {
  const baseJson = [
    {
      'modality': 'summary'
    },
    {
      'modality': 'prefix'
    },
    {
      'modality': 'speech',
      'domain': 'mathspeak'
    },
    {
      'modality': 'speech',
      'domain': 'clearspeak'
    }
  ]
  for (let json of baseJson) {
    let newBase = Object.assign({
      'locale': iso
    }, json, {
      'inherits': 'base',
      'rules': []
    });
    saveJson(
      `${json.domain || json.modality}_${lang}.json`,
      newBase,
      `${SreDir}/${iso}/rules/`);
    let newActions = Object.assign({
      'locale': iso
    }, json, {
      'kind': 'actions',
      'rules': []
    });
    saveJson(
      `${json.domain || json.modality}_${lang}_actions.json`,
      newActions,
      `${SreDir}/${iso}/rules/`);
  }
}
