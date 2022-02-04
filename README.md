# Localisation of Speech Rule Engine

These are the localisation facitlities for the [speech rule
engine](https://speechruleengine.org).  It contains code and files for
localising speech rule files. These are now available in a Yaml format and can
be more easily localised than in their previous JSON format.

For explanations of the format and what needs to be done to localise them into
your language, [see here for details](yaml.md).


## Usage

### Full translation

Forward translation of all locales:

``` javascript
let trans = require('./js/base/translate');
trans.translateForwardAll();
```

Backward translation of all locales:

``` javascript
let trans = require('./js/base/translate');
trans.translateBackwardAll();
```

## Localisation Workflow


