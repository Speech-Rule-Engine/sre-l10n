# Localisation of Speech Rule Engine

These are the localisation facitlities for the [speech rule
engine](https://speechruleengine.org).  It contains code and files for
localising speech rule files. These are now available in a Yaml format and can
be more easily localised than in their previous JSON format.

For explanations of the format and what needs to be done to localise them into
your language, [see here for details](yaml.md).


## Usage

### Full translation of Speech Rules

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

### Translating MathMaps

Translation of mathmaps is done with the functions in `maps.ts`.

```
let maps = require('./js/base/maps');
```

Forward translation is done with the `convert` methods.

``` javascript
maps.convertSymbols(iso);
maps.convertFunctions(iso);
maps.convertUnits(iso);
```

Backward translation is done with the `retrieve` methods.

``` javascript
maps.retrieveSymbols(iso);
maps.retrieveFunctions(iso);
maps.retrieveUnits(iso);
```


## Localisation Workflow

