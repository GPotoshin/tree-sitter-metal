# Tree Sitter Metal

This parser was created to address the need for syntax highlighting. The best
approach to writing a Tree-sitter grammar for Metal might be to extend the C++
grammar, but as this was my first grammar, I didn’t attempt that. The core
structure is heavily inspired by the official C and C++ grammars, with some
deviations. There’s still much to do, but I felt it was already in a somewhat
usable state, so I’ve saved and shared it on GitHub.

## Neovim integration

```lua
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.metal = {
  install_info = {
    url = "https://github.com/GPotoshin/tree-sitter-metal",
    files = {"src/parser.c"},
    branch = "main",
    generate_requires_npm = false,
    requires_generate_from_grammar = false,
  },
}

vim.filetype.add({
  extension = {
    metal = "metal",
  },
})
```

and you need to install highlighting by runnig the following commands from the
root of project 
```
mkdir -p <path_to_nvim-treesitter>/nvim-treesitter/queries/metal
cp -pr queries/highlights.scm <path_to_nvim-treesitter>/nvim-treesitter/queries/metal/
```

if you use Packer, you should have `<path_to_nvim-treesitter>=~/.local/share/nvim/site/pack/packer/start/`
