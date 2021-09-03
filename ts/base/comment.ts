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
 * @fileoverview Data structures for comments.
 *
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import {referenceSets} from './forward';
import {Component} from './rules';
import {loadComments, saveComments, sreDomains} from './util';

export class Comment {

  /**
   * Comments for each parameter.
   */
  public parameters: {[para: string]: string} = {};

  /**
   * The locales a rule belongs to together with the number of parameters for
   * that locale.
   */
  public locales: {[loc: string]: number} = {};

  /**
   * The overall rule description
   */
  public description: string = '';

  /**
   * A latex example.
   */
  public latex: string = '';

  /**
   * A latex example.
   */
  public example: string = '';

  /**
   * The reference locale.
   */
  public reference: string = '';

  /**
   * The ordering of the parameters.
   */
  public order: {[loc: string]: {[param: string]: string}} = {};

  /**
   * Maximum number of parameters for locales. If this is smaller than the
   * number of parameters, they will be pruned on saving.
   */
  private maximum: number = 0;

  /**
   * Checks if two components match. That is it removes successively attributes
   * and grammar.
   *
   * @param {Component} comp1 First component.
   * @param {Component} comp2 Second component.
   */
  private static matchComponents(comp1: Component, comp2: Component) {
    // Decreasing strength, in case of testing or if something goes wrong.
    let c1 = comp1.clone();
    let c2 = comp2.clone();
    if (c1.toString() === c2.toString()) {
      return true;
    }
    c1.attributes = {};
    c2.attributes = {};
    if (c1.toString() === c2.toString()) {
      return true;
    }
    c1.grammar = {};
    c2.grammar = {};
    if (c1.toString() === c2.toString()) {
      return true;
    }
    return false;
  }

  /**
   * Cleans a parameter map by removing everything that is not of the for %1-n.
   * @param map The map to clean.
   */
  private static cleanParameters(map: string[]) {
    return map.filter(Comment.isParameter);
  }

  /**
   * Checks if the parameter needs to be processed, i.e., %i with i!=0.
   *
   * @param str The string to check.
   */
  private static isParameter(str: string) {
    return str.match(/^%[0-9]+$/) && str !== '%0';
  }

  /**
   * @param rule The name of the rule the comment is for.
   */
  constructor(public rule: string, parameters: string[] = []) {
    Comment.cleanParameters(parameters).forEach(p => this.parameters[p] = '');
  }

  /**
   * @return The Yaml format for this comment.
   */
  public toYaml(locale: string): string {
    let out = [`# ${this.description}`];
    if (this.example) {
      out.push(`# Example: ${this.example}`);
    }
    if (this.latex) {
      out.push(`# LaTeX Example: $${this.latex}$`);
    }
    // Picking the correct parameter comments.
    let order = this.order[locale] || this.order[this.reference];
    if (!order) {
      order = {};
      this.order[locale] = order;
      let count = 0;
      while (count < this.locales[locale]) {
        const param = `%${++count}`;
        order[param] = param;
      }
    }
    for (let [dom, cod] of Object.entries(order)) {
      out.push(`# ${dom}: ${this.parameters[cod]}`);
    }
    return out.join('\n');
  }

  public fromJson(json: any) {
    this.locales = json.locales;
    this.parameters = json.parameters;
    this.rule = json.rule;
    this.description = json.description || '';
    this.latex = json.latex || '';
    this.example = json.example || '';
    this.order = json.order || {};
    this.reference = (json.reference !== undefined) ? json.reference :
      (Object.keys(this.locales).includes('en') ?
        'en' : Object.keys(this.locales)[0]);
    this.maximum = Object.values(this.locales).
      reduce((x, y) => Math.max(x, y), 0);
    if (this.maximum !== json.maximum) {
      console.warn(`Incorrect max value in comment ${this.rule}`);
    }
  }

  public update(locale: string, keys: string[]) {
    keys = Comment.cleanParameters(keys);
    let length = keys.length;
    this.locales[locale] = length;
    if (length <= this.maximum) {
      return;
    }
    keys.slice(this.maximum).forEach(x => this.parameters[x] = '');
    this.maximum = length;
  }


  /**
   * Removes all parameters that exceed the maximum of needed parameters.
   */
  public prune() {
    let length = Object.keys(this.parameters).length;
    if (this.maximum > length) {
      console.error(`Not enough parameters in ${this.rule}!`);
      return;
    }
    if (this.maximum === length) {
      return;
    }
    for (let i = this.maximum + 1; i <= length; i++) {
      delete this.parameters[`%${i}`];
    }
  }


  public getOrder() {
    let ref = referenceSets[this.reference].parameters[this.rule];
    for (let [loc, max] of Object.entries(this.locales)) {
      let ordering: {[key: string]: string} = {};
      this.order[loc] = ordering;
      let orig = referenceSets[loc].parameters[this.rule];
      if (!orig) {
        delete this.locales[loc];
        delete this.order[loc];
        continue;
      }
      let used = [];
      for (let [okey, ocomp] of Object.entries(orig)) {
        if (!Comment.isParameter(okey)) continue;
        for (let [rkey, rcomp] of Object.entries(ref)) {
          if (!Comment.isParameter(rkey)) continue;
          if (Comment.matchComponents(ocomp, rcomp)) {
            ordering[okey] = rkey;
            used.push(rkey);
            break;
          }
        }
      }
      if (Object.keys(ordering).length === max) continue;
      console.info(`Extra parameters in comments of rule ${this.rule} for locale ${loc}`);
      for (let okey of Object.keys(orig)) {
        if (!Comment.isParameter(okey)) continue;
        if (ordering[okey]) continue;
        for (let rkey of Object.keys(this.parameters)) {
          if (used.includes(rkey)) continue;
          ordering[okey] = rkey;
          used.push(rkey);
        }
      }
    }
  }

}

declare type CommentSet = {[name: string]: Comment};
let commentSet: {[domain: string]: CommentSet} = {};


/**
 * Retrieves a comment set for the given domain.
 * @param domain The domain.
 */
export function getComments(domain: string) {
  let comments = commentSet[domain];
  if (comments) {
    return comments;
  }
  let newSet = {};
  commentSet[domain] = newSet;
  return newSet;
}


/**
 * Saves comments for a particular domain to a file.
 * @param file The filename.
 * @param domain The domain to save.
 */
export function writeComments(domain: string) {
  let comments = getComments(domain);
  for (let comment of Object.values(comments)) {
    comment.getOrder();
    comment.prune();
  }
  saveComments(domain, comments);
}


/**
 * Populates the global comment set structure.
 */
export function readComments() {
  for (let domain of sreDomains) {
    let json = loadComments(domain);
    let cset: CommentSet = {};
    for (let [rule, jcom] of Object.entries(json)) {
      let comment = new Comment(rule);
      comment.fromJson(jcom);
      cset[rule] = comment;
    }
    commentSet[domain] = cset;
  }
}
