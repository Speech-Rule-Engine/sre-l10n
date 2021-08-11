# Localisation of SRE

Localisation of SRE consists effectively of four separate steps:

  * Localisation of unicode characters, functions and units
  * Algorithm to generate word numbers
  * Translation of messages for navigation, 
  * Localisation of speech rule sets that recursively construct descriptions of
    mathematical expressions

Below is a an explanation of the actual speech rule sets that need localising as
well as a description of the Yaml format of SRE speech rules.


## Speech Rule Sets

SRE gnerally uses four rule sets for translation of mathematical expressions
into speech. Note, that there exist a couple of extra rule sets for English,
which are generally not localised.

### MathSpeak

This is a fairly simple rule set that aims at speaking mathematical expressions
in relatively straight forward fashion adding disambiguating language in order
to indicate two dimensional layout and nested terms or formulas. It offers three
reading styles: vebose, brief and superbrief.

As an example, consider the nested fraction 

``` latex
 \frac{a}{\frac{b}{c}}
```

is translated in verbose style to 

```
StartStartFraction a OverOver StartFraction b Over c EndFraction EndEndFraction
```

and in super brief style to 

```
NestFrac a NestOver Frac b Over c EndFrac NestEndFrac
```

Localisation of MathSpeak consists of the translation of a relatively small
number of speech rules together with the translation of a set of messages that
are used to construct disambiguating terms, e.g., `Start`, `Fraction`, `End`
etc.

### ClearSpeak

This is a more natural speaking style, which in addition offers a considerable
number of speech preferences that allow fine tuning of how expressions are
spoken. Clearspeak works a lot with pausing to achieve disambiguation. As a
consequence it has considerably more rules that need translation.

E.g., the above fraction would be spoken in standard Clearspeak as

```
the fraction with numerator a and denominator b over c
```

or in `Fraction` preference `FracOver` as

```
the fraction a over the fraction b over c
```

Note, that Clearspeak uses a notion of *simple terms* expressions to simplify
speech when possible. In the above example `b` and `c` are considered simple
terms, leading to a shortened transcription of the fraction, while `b over c` is
considered a complex term so the overall fraction is spoken in more detail.

Another example is juxtaposition where `xy` is simple versus other infix
operators like `x + y`, which is not simple.

### Prefix

Prefixes are used in order to indicate positions of terms. They are important to
provide context for a particular term when exploring an expression in more
detail. For example in the fraction `\frac{a}{b}` the term `a` would get the
prefix `Numerator` while `b` would get `Denominator`.  Prefix rules are very
simple, generally only consisting of single terms that need translating.


### Summary

Summary rules allow for summarising terms by their primary component. For
example an addition of the form `a + b + c` would be summarised as `sum with
three summands` regardless of the complexity of `a`, `b`, or `c`. While there
are considerably more summary rules than prefix rules, they are still relatively
simple to translate.


## Yaml format

Speech rule sets are given in a Yaml format, where each speech rule is presented
as follows:

``` yaml
# Comment consisting of the rule description
# Example: An optional example
# LaTeX Example: An optional latex code example
# Parameter description for paramteters 
# %1: 
# ...
# %n:
rulename:
    - %i (optional annotation)
    - $j: "message" (optional annotation)
    ...
```

Here `%i` and `$j` are parameter indicators, which are explained in more detail
below. For now it is important to note that parameters of type `$` need to be
translated, while those of type `%` do not.

As an example consider the following speech rule for absolute value:

``` yaml
# The fraction rule in auto mode.
# %1: The numerator
# %2: The denominator
fraction:
  - $1: "the" (grammar:article)
  - $2: "fraction with numerator"
  - %1 (pause:short)
  - $3: "and denominator"
  - %2 (pause:short)
```

The rule has two parameters representing the numerator and denominator. It
consists of five lines: three string messages `$1, $2, $3` and the two
parameters `%1, %2`. These are assembled in sequence, once terms plugged into
the parameters `%1, %2` are evaluated. For example the expression `\frac{a+b}{c}`
is pronounced as 

``` yaml
the fraction with numerator a plus b and denominator c
```

after the expression `a+b` is evaluates to `a plus b`.

Note, that lines can be deleted or rearranged. For the sake of the example
assume we want to speak denominator before numerator and omit the article. This
could be achieved by changing the rule as follows:


``` yaml
# The fraction rule in auto mode.
# %1: The numerator
# %2: The denominator
fraction:
  - $2: "fraction with denominator"
  - %2 (pause:short)
  - $3: "and numerator"
  - %1 (pause:short)
```

This would now lead to the speech output of 

``` yaml
the fraction with numerator a plus b and denominator c
```

Note that some of the lines contain annotations. While they are desribed in more
detail below, for now it is sufficient to understand that pauses can be added in
any line (provided you think they are useful).

Grammar annotations are more subtle, in that they convey and propagate
meaning. E.g., the `article` annotation ensures that articles are not repeated
in English.  In other locales this annotation can be used to adapt the case of
the article.

### Localising a Speech Rule

Localisation generally consists of three parts: 

1. translating the string messages 
2. arranging or rearranging the order in which speech is assembled
3. localising or adapting annotations

As example for 1. consider the localisation of the clearspeak rule for fractions
into French:

``` yaml
fraction:
  - $1: "fraction avec numérateur"
  - %1 (pause:short)
  - $2: "et dénominateur"
  - %2 (pause:short)
```

As an example for 2. consider the rule for adding explicit font information:

``` yaml
# Explicit speaking of font
# Example: bold alpha
# %1: The font
# %2: The expression
font:
  - %1
  - %2 (pause:short)
```

Note that there is nothing to translate, however, localisation consists of
potentially altering the order of the parameters. For instance the French
version of the rule looks as follows:

``` yaml
# Explicit speaking of font
# Example: alpha en gras
# %1: The font
# %2: The expression
font:
  - %2
  - %1 (pause:short)
```

For the final category of adapting and localising annotations see the section on
annotations below.



### Parameter indicators

We use two types of parameter indicators `%n` and `$n`, both at the start of
component lines.

`%n`: These refer to parameters that are recursively translated and are
explained in the comments. Please do not change the parameter.

`$n`: These are reference parameters for textual elements that need to be
localised. Please leave the `$n` mark as is in the front of the line. You can
nevertheless rearrange, or delete the line. Likewise you can add new lines with
textual content given in double quotes. There is _no need_ to give a newly
added line a reference parameter.


### Annotations

#### Localisable Annotations

There exist three types of annotations that can contain localisable strings.

* `separator`: A string that is interspersed in a sequence of expressions (e.g., an operator)
* `context`: A string that describes the context of an expression (e.g., rows and columns in a matrix)
* `join`: A join instruction. E.g., `(join:"")` indicates that no space should
  be inserted between this string and the following string.

The first two annotations will only ever occur on `%` parameters, which
represent multiple elements that are translated as a list. The `join` annotation
can occur for any parameter.

##### Separator Example:

``` yaml
# Subtraction
# Example: a minus b minus c
# LaTeX Example: $a - b - c$
# %1: List of components of the subtraction
subtraction:
  - %1 (separator:"minus")
```

##### Context Example:

``` yaml
# Iterates over a matrix row.
# %1: The list of single cells in the row.
matrix-row:
  - %1 (context:"Column-,- ", pause:long)
```

Note that context elements can contain control characters (`-,- ` in the above
example) that are best left alone!


#### Pauses

Pauses can be added to both types of parameters in the form of `(pause:short)`
for instance.  Pauses generally can have numerical values in milliseconds or
relative pauses in terms of `short, medium, long`. Pauses are accumulative and
the given value is the minimal pause that will be used. That is, even if a pause
is defined as small, it can be longer in case the preceding expression requires
this. In case it is defined as medium or long than the pause will be at least
medium or long no matter how small the preceding expression is.


#### Grammar

Grammar annotations can also be added on both types of parameters. When added to
`$` string messages they generally lead to some kind of post-processing (e.g.,
putting an article into the right grammatical case). When used on a `%`
parameter, they propagate some information that can be used when translating the
expression the parameter represents.

The following is a list of commonly used grammar annotations:

| Annotation | Value                   | Meaning                                                                                                                   |
|------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------|
| singular   | None                    | The expression is in singular. Used, e.g., for units or vulgar fractions                                                  |
| plural     | None                    | The expression is in plural. Used, e.g., for units or vulgar fractions                                                    |
| dual       | None                    | The expression is in dual. Used, e.g., for units or vulgar fractions                                                      |
|            |                         |                                                                                                                           |
| case       | nominative, dative, ... | Grammatical case for the expressionn                                                                                      |
| gender     | m, f, n                 | Grammatical gender of the expression                                                                                      |
|            |                         |                                                                                                                           |
| article    | None                    | Marks an article. Used for post-processing by removing duplicates or putting the article into the correct gender or case. |
|            |                         |                                                                                                                           |

It can be necessary to remove grammatical annotations, for example when a case
is not longer valid. This can be achieved by adding an exclamation mark before
the annotation, or in other words, negating it. E.g., `(grammar:!singular)`
removes the grammatical annotation `singular`.

Note, adding grammar categories often requires some adjustment of preconditions for
rules. These have to be done explicitly in the rule sets, and can not be done
via the yaml files. For more information, best to contact the owner of this repository directly.
