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

### Message Localisations

This is currently still done with the `SplitJson` module from the
`sre-resources` repository using the spreadsheets split into single `csv` files.




## Adding a new Locale

### Symbol Maps

Use the convert methods to do the initial conversion of the (potentially empty)
mathmaps. Merge into `crowdin` branch and push to crowdin.


#### Possible cleanup needed:

`greek-rest`, `digits_rest`

### Rules

* Add new locale to variable in `util.ts`.
* Prepare empty rule and actions files for new locale with `emptyRules` from `rule_util.ts`.
* Generate basic rules files with forward translation.
* Replace the corresponding yaml files with the translated ones or create them new.
* Translate backwards, this will result in the correct rule files in SRE.
* Translate forwards once more to update comment files, json files, etc. in the `l10n` repository.

## Things to Pay Attention to

* When making changes in the rule files in SRE, run
  `trans.translateForwardAll();` twice to also update the comments files
  correctly.
* When making changes in the comment yaml file, update comments file and rerun translation:
  ```javascript
  let comment = require('./js/base/comment');
  comment.updateComments();
  trans.translateForwardAll();
  ```
