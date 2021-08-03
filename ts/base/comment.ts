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

import {loadComments, saveComments, sreDomains} from './util';

export class Comment {

  /**
   * Comments for each parameter.
   */
  public parameters: {[para: string]: string} = {};

  /**
   * The locales a rule belongs to.
   */
  public locales: string[] = [];

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
   * @param rule The name of the rule the comment is for.
   */
  constructor(public rule: string, parameters: string[] = []) {
    parameters.forEach(p => this.parameters[p] = '');
  }

  /**
   * @return The Yaml format for this comment.
   */
  public toYaml(): string {
    let out = [`# ${this.description}`];
    if (this.example) {
      out.push(`# Example: $${this.latex}$`);
    }
    if (this.latex) {
      out.push(`# LaTeX Example: $${this.latex}$`);
    }
    for (let [param, str] of Object.entries(this.parameters)) {
      out.push(`# ${param}: ${str}`);
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
  saveComments(domain, comments);
}


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
