## Parameter indicators

We use two types of parameter indicators `%n` and `$n`, both at the start of
component lines.

`%n`: These refer to parameters that are recursively translated and are
explained in the comments. Please do not change the parameter.

`$n`: These are reference parameters for textual elements that need to be
localised. Please leave the `$n` mark as is in the front of the line. You can
nevertheless rearrange, or delete the line. Likewise you can add new lines with
textual content given in double quotes. There is _no need_ to give a newly
added line a reference parameter.

## Pauses

Pauses are accumulative and the given value is the minimal pause that will be
used. That is, even if a pause is defined as small, it can be longer in case the
preceding expression requires this. In case it is defined as medium or long than
the pause will be at least medium or long no matter how small the preceding
expression is. 


## Grammar

Adding grammar categories


`join` | e.g., `join:""` joins two expression directly
