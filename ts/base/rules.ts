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
 * @fileoverview Modification of SRE data structures for splitting.
 *
 * @author volker.sorge@gmail.com (Volker Sorge)
 */

import {Action, ActionType, Component, Precondition, SpeechRule} from '../../speech-rule-engine/js/rule_engine/speech_rule';

declare module '../../speech-rule-engine/js/rule_engine/speech_rule' {
  interface SpeechRule {
    toString(): string;
    localizable(): boolean;
    hasType(type: string): boolean;
  }
  
  interface Action {
    components: Component[];
    toString(): string;
    localizable(): boolean;
    hasType(type: string): boolean;
  }

  interface Component {
    toString(): string;
    grammarToString(): string;
    getGrammar(): string[];
    attributesToString(): string;
    getAttributes(): string[];
    localizable(): boolean;
    hasType(type: string): boolean;
    clone(): Component;
  }

  interface Precondition {
    toString(): string;
    hasDisjunctive(): boolean;
  }

}

Action.prototype.localizable = function() {
  return this.components.some((x: SpeechRule) => x.localizable());
};

Action.prototype.hasType = function(type: string) {
  return this.components.some((x: SpeechRule) => x.hasType(type));
};

Precondition.prototype.hasDisjunctive = function() {
  return this.constraints.some((x: string) => x.match(/ or /));
};

Component.prototype.localizable = function(){
  return this.hasType(ActionType.TEXT) &&
    this.content.match(/^".*"$/);
};

Component.prototype.hasType = function(type: string){
  return this.type === type;
};

Component.prototype.clone = function() {
  return Component.fromString(this.toString());
};

export {Action, Component};
