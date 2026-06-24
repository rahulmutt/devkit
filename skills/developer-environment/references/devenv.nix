# FALLBACK ONLY — use this for tools mise cannot provide (system libs, niche
# packages, complex Nix derivations). Prefer mise.toml for languages/CLIs.
{ pkgs, ... }:

{
  # System packages mise can't supply:
  packages = [
    # pkgs.imagemagick
    # pkgs.libpq
  ];

  # Languages can be managed here too, but prefer mise unless you need Nix:
  # languages.python.enable = true;

  enterShell = ''
    echo "devenv shell ready"
  '';
}
