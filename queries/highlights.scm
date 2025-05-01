[
 "using"
 "return"
 "struct"
 (attribute_keyword)
 (type_qualifier)
] @keyword

[
 "namespace"
] @keyword.type

"#include" @keyword.import

[
  ";"
  ","
  "::"
] @punctuation.delimiter

(type_specifier) @type

[
(system_lib_string)
(string_literal)
] @string

(function_declarator
  (qualified_identifier
    (identifier) @function))

(call_expression
  function: (identifier) @function)

(comment) @comment

(number_literal) @number
