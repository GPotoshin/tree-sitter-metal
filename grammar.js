/**
 * @file apple's metal shading language tree sitter parser
 * @author George Potoshin <george.potoshin@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// SectionGeneral
// SectionStructSpecifier
// SectionTypes


const PREC = {
  PAREN_DECLARATOR: -10,
  ASSIGNMENT: -2,
  CONDITIONAL: -1,
  DEFAULT: 0,
  LOGICAL_OR: 1,
  LOGICAL_AND: 2,
  INCLUSIVE_OR: 3,
  EXCLUSIVE_OR: 4,
  BITWISE_AND: 5,
  EQUAL: 6,
  RELATIONAL: 7,
  OFFSETOF: 8,
  SHIFT: 9,
  ADD: 10,
  MULTIPLY: 11,
  CAST: 12,
  SIZEOF: 13,
  UNARY: 14,
  CALL: 15,
  FIELD: 16,
  SUBSCRIPT: 17,
};

module.exports = grammar({
  name: "metal",

  extras: $ => [
    /\s|\\\r?\n/,
    $.comment,
  ],

  rules: {
    translation_unit: $ => repeat($._top_level_item),

    _top_level_item: $ => choice(
      $.preproc_include,
      $.using_declaration,
      $.function_definition,
      $._empty_declaration,
    ),

    // SectionGeneral:
    string_literal: $ => seq(
      choice('L"', 'u"', 'U"', 'u8"', '"'),
      repeat(choice(
        alias(token.immediate(prec(1, /[^\\"\n]+/)), $.string_content),
        $.escape_sequence,
      )),
      '"',
    ),

    identifier: $ =>
      /(\p{XID_Start}|\$|_|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})(\p{XID_Continue}|\$|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})*/,

    comment: _ => token(choice(
      seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),

    preproc_include: $ => seq(
      '#include',
      field('path', choice(
        $.string_literal,
        $.system_lib_string,
      )),
      '\n'
    ),

    system_lib_string: $ => seq(
      '<',
      /[^>\n]*/,
      '>'
    ),

    using_declaration: $ => seq(
      'using',
      'namespace',
      $.identifier,
      ';'
    ),

    _empty_declaration: $ => seq(
      $.type_specifier,
      ';',
    ),

    type_specifier: $ => choice(
      $.struct_specifier,
    ),

    // SectionStructSpecifier
    struct_specifier: $ => prec.right(seq(
      'struct',
      choice(
        seq(
          field('name', $.identifier),
          field('body', optional($.field_declaration_list)),
        ),
        field('body', $.field_declaration_list),
      ),
    )),

    field_declaration_list: $ => seq(
      '{',
      repeat($._field_declaration_list_item),
      '}',
    ),

    _field_declaration_list_item: $ => choice(
      $.field_declaration,
    ),

    field_declaration: $ => seq(
      optional($._declaration_modifier),
      $.type_specifier,
      $.identifier,
      optional($.attribute),
      ';',
    ),
    // SectionTypes
    _declaration_modifier: $ => choice(
      $.type_qualifier,
    ),

    type_qualifier: _ => choice(
      "device",
      "constant",
      "thread",
      "threadgroup",
      "fragment",
      "vertex",
    ),

    type_specifier: $ => choice(
      $.primitive_type,
      $.identifier,
    ),

    primitive_type: $ => choice(
      $._std_type,
      $._std_vect,
      'int8_t',
      'unsigned char',
      'uint8_t',
      'int16_t',
      'unsigned short',
      'uint16_t',
      'int32_t',
      'unsigned int',
      'uint32_t',
      'int64_t',
      'unsigned long',
      'uint64_t',
      'size_t',
      'ptrdiff_t',
      'void'
    ),

    _std_type: $ => choice(
      'bool',
      'char',
      'uchar',
      'short',
      'ushort',
      'int',
      'uint',
      'long',
      'half',
      'bfloat',
      'float'
    ),

    _std_vect: $ => seq(
      $._std_type,
      choice(
        '2',
        '3',
        '4',
      )
    ),

    attribute: $ => seq(
      "[[",
      $.attribute_keyword,
      "]]",
    ),

    attribute_keyword: $ => choice(
      "invariant",
      "max_total_threads_per_threadgroup",
      "payload",
      "vertex",
      "fragment",
      "kernel",
      "stage_in", 
      "visible",
      "stitchable",
      "vertex_id",
      "position",
      seq(
        "buffer",
        "(",
        choice(
          "AAPLVertexInputIndexVertices",
          "AAPLVertexInputIndexUniforms",
        ),
        ")",
      ),
    ),

    function_definition: $ => seq(
      optional($.type_qualifier),
      field('type', $.type_specifier),
      field('declarator', $.function_declarator),
      field('body', $.compound_statement)
    ),

    variable_declaration: $ => seq(
      field('type', $.type_specifier),
      commaSep1(field('declarator', choice(
        $._declaration_declarator,
        $.init_declarator,
      ))),
      ';',
    ),

    _declarator: $ => choice(
      $.pointer_declarator,
      $.reference_declarator,
      $.function_declarator,
      $.using_declaration,
      $.variable_declaration,
      $.identifier,
    ),

    pointer_declarator: $ => prec.dynamic(1, prec.right(seq(
      '*',
      repeat($.type_qualifier),
      field('declarator', $._declarator),
    ))),

    reference_declarator: $ => prec.dynamic(1, prec.right(seq(
      '&',
      repeat($.type_qualifier),
      field('declarator', $._declarator),
    ))),

    function_declarator: $ => seq(
      field('declarator', $.qualified_identifier),
      field('parameters', $.parameter_list)
    ),

    qualified_identifier: $ => seq(
      field('scope',
        repeat(
          seq(
            $._namespace_identifier,
            '::'
          )
        )
      ),
      field('name', $.identifier)
    ),

    _namespace_identifier: $ => alias($.identifier, $.namespace_identifier),


    parameter_list: $ => seq(
      '(',
      commaSep($.parameter_declaration),
      ')'
    ),

    parameter_declaration: $ => seq(
      optional($.type_qualifier),
      field('type', $.type_specifier),
      field('declarator', $._declarator),
      optional($.attribute),
    ),

    compound_statement: $ => seq(
      '{',
      repeat($._block_item),
      '}'
    ),

    _block_item: $ => choice(
      $.return_statement,
      $.call_statement,
      $.empty_statement,
      $.assignement_expression,
      $.variable_declaration,
    ),

    _declaration_declarator: $ => choice(
      $.attributed_declarator,
      $.pointer_declarator,
    ),

    init_declarator: $ => seq(
      field('declarator', $._declarator),
      '=',
      field('value', choice($._expression)),
    ),

    attributed_declarator: $ => prec.right(seq(
      $._declarator,
      repeat1($.attribute_declaration),
    )),

    attribute_declaration: $ => seq(
      '[[',
      commaSep1($.attribute),
      ']]',
    ),

    assignement_expression: $ => seq(
      $.identifier,
      field('operator', choice(
        '=',
        '*=',
        '/=',
        '%=',
        '+=',
        '-=',
        '<<=',
        '>>=',
        '&=',
        '^=',
        '|=',
      )),
      $._expression
    ),

    empty_statement: $ => ';',

    return_statement: $ => seq(
      'return',
      optional($._expression),
      ';'
    ),

    call_statement: $ => seq(
      $.call_expression,
      ';'
    ),
  
    _expression: $ => choice(
      $.call_expression,
      $.binary_expression,
      $.number_literal,
      $.identifier
    ),

    binary_expression: $ => {
      const table = [
        ['+', PREC.ADD],
        ['-', PREC.ADD],
        ['*', PREC.MULTIPLY],
        ['/', PREC.MULTIPLY],
        ['%', PREC.MULTIPLY],
        ['||', PREC.LOGICAL_OR],
        ['&&', PREC.LOGICAL_AND],
        ['|', PREC.INCLUSIVE_OR],
        ['^', PREC.EXCLUSIVE_OR],
        ['&', PREC.BITWISE_AND],
        ['==', PREC.EQUAL],
        ['!=', PREC.EQUAL],
        ['>', PREC.RELATIONAL],
        ['>=', PREC.RELATIONAL],
        ['<=', PREC.RELATIONAL],
        ['<', PREC.RELATIONAL],
        ['<<', PREC.SHIFT],
        ['>>', PREC.SHIFT],
      ];

      return choice(...table.map(([operator, precedence]) => {
        return prec.left(precedence, seq(
          field('left', $._expression),
          // @ts-ignore
          field('operator', operator),
          field('right', $._expression),
        ));
      }));
    },

    call_expression: $ => prec(PREC.CALL, seq(
      field('function', $.identifier),
      field('arguments', $.argument_list)
    )),

    // maybe add compound statement
    argument_list: $ => seq('(', commaSep($._expression), ')'),


    escape_sequence: _ => token(prec(1, seq(
      '\\',
      choice(
        /[^xuU]/,
        /\d{2,3}/,
        /x[0-9a-fA-F]{1,4}/,
        /u[0-9a-fA-F]{4}/,
        /U[0-9a-fA-F]{8}/,
      ),
    ))),

    number_literal: _ => {
      const separator = '\'';
      const hex = /[0-9a-fA-F]/;
      const decimal = /[0-9]/;
      const hexDigits = seq(repeat1(hex), repeat(seq(separator, repeat1(hex))));
      const decimalDigits = seq(repeat1(decimal), repeat(seq(separator, repeat1(decimal))));
      return token(seq(
        optional(/[-\+]/),
        optional(choice(/0[xX]/, /0[bB]/)),
        choice(
          seq(
            choice(
              decimalDigits,
              seq(/0[bB]/, decimalDigits),
              seq(/0[xX]/, hexDigits),
            ),
            optional(seq('.', optional(hexDigits))),
          ),
          seq('.', decimalDigits),
        ),
        optional(seq(
          /[eEpP]/,
          optional(seq(
            optional(/[-\+]/),
            hexDigits,
          )),
        )),
        /[uUlLwWfFbBdD]*/,
      ));
    },


  }
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
