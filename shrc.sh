#!/bin/sh
# shellcheck disable=SC2155

# Colourful manpages
export LESS_TERMCAP_mb=$'\E[01;31m'
export LESS_TERMCAP_md=$'\E[01;31m'
export LESS_TERMCAP_me=$'\E[0m'
export LESS_TERMCAP_se=$'\E[0m'
export LESS_TERMCAP_so=$'\E[01;44;33m'
export LESS_TERMCAP_ue=$'\E[0m'
export LESS_TERMCAP_us=$'\E[01;32m'

# Set to avoid `env` output from changing console colour
export LESS_TERMEND=$'\E[0m'

# Print field by number
field() {
  ruby -ane "puts \$F[$1]"
}

# Setup paths
remove_from_path() {
  [ -d "$1" ] || return
  # Doesn't work for first item in the PATH but I don't care.
  export PATH=${PATH//:$1/}
}

add_to_path_start() {
  [ -d "$1" ] || return
  remove_from_path "$1"
  export PATH="$1:$PATH"
}

add_to_path_end() {
  [ -d "$1" ] || return
  remove_from_path "$1"
  export PATH="$PATH:$1"
}

force_add_to_path_start() {
  remove_from_path "$1"
  export PATH="$1:$PATH"
}

quiet_which() {
  which "$1" &>/dev/null
}

add_to_path_start "/usr/local/bin"
add_to_path_start "/usr/local/sbin"
add_to_path_start "$HOME/Homebrew/bin"
add_to_path_start "$HOME/Homebrew/sbin"

# Aliases
alias mkdir="mkdir -vp"
alias rm="rm -iv"
alias mv="mv -iv"
alias cp="cp -irv"
alias less="less --ignore-case --raw-control-chars"
alias rsync="rsync --partial --progress --human-readable --compress"
alias gist="gist --open --copy"
alias sha256="shasum -a 256"
alias ack="ag"

# Platform-specific stuff
if quiet_which brew
then
  export BINTRAY_USER="$(git config bintray.username)"
  export HOMEBREW_PREFIX="$(brew --prefix)"
  export HOMEBREW_REPOSITORY="$(brew --repo)"
  export HOMEBREW_DEVELOPER=1
  export HOMEBREW_ENV_FILTERING=1

  export HOMEBREW_CASK_OPTS="--appdir=/Applications"
  if [ "$USER" = "brewadmin" ]
  then
    export HOMEBREW_CASK_OPTS="$HOMEBREW_CASK_OPTS --binarydir=$HOMEBREW_PREFIX/bin"
  fi

  alias hbc='cd $HOMEBREW_REPOSITORY/Library/Taps/homebrew/homebrew-core'
  alias hbv='cd $HOMEBREW_REPOSITORY/Library/Taps/homebrew/homebrew-versions'

  # Output whether the dependencies for a Homebrew package are bottled.
  brew_bottled_deps() {
    for DEP in "$@"; do
      echo "$DEP deps:"
      brew deps "$DEP" | xargs brew info | grep stable
      [ "$#" -ne 1 ] && echo
    done
  }

  # Output the most popular unbottled Homebrew packages
  brew_popular_unbottled() {
    brew deps --all |
      awk '{ gsub(":? ", "\n") } 1' |
      sort |
      uniq -c |
      sort |
      tail -n 500 |
      awk '{print $2}' |
      xargs brew info |
      grep stable |
      grep -v bottled
  }
fi

if [ "$MACOS" ]
then
  export GREP_OPTIONS="--color=auto"
  export CLICOLOR=1
  export VAGRANT_DEFAULT_PROVIDER="vmware_fusion"
  if quiet_which diff-highlight
  then
    # shellcheck disable=SC2016
    export GIT_PAGER='diff-highlight | less -+$LESS -RX'
  else
    # shellcheck disable=SC2016
    export GIT_PAGER='less -+$LESS -RX'
  fi

  add_to_path_end /Applications/Xcode.app/Contents/Developer/usr/bin
  add_to_path_end /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin
  add_to_path_end "$HOMEBREW_PREFIX/opt/git/share/git-core/contrib/diff-highlight"
  add_to_path_end "`yarn global bin`"
  
  alias ls="ls -F"
  alias ql="qlmanage -p 1>/dev/null"
  alias locate="mdfind -name"
  alias cpwd="pwd | tr -d '\n' | pbcopy"
  alias finder-hide="setfile -a V"

  # Old default Curl is broken for Git on Leopard.
  [ "$OSTYPE" = "darwin9.0" ] && export GIT_SSL_NO_VERIFY=1
elif [ "$LINUX" ]
then
  quiet_which keychain && eval "$(keychain -q --eval --agents ssh id_rsa)"

  alias su="/bin/su -"
  alias ls="ls -F --color=auto"
  alias open="xdg-open"
elif [ "$WINDOWS" ]
then
  quiet_which plink && alias ssh='plink -l $(git config shell.username)'

  alias ls="ls -F --color=auto"

  open() {
    # shellcheck disable=SC2145
    cmd /C"$@"
  }
fi

# Set up editor
if [ -n "${SSH_CONNECTION}" ]
then
  export GIT_EDITOR="$EDITOR -w"
elif quiet_which code
then
  export EDITOR="code"
  export GIT_EDITOR="$EDITOR -w"
elif quiet_which vim
then
  export EDITOR="vim"
elif quiet_which vi
then
  export EDITOR="vi"
fi

# Run dircolors if it exists
quiet_which dircolors && eval "$(dircolors -b)"

# More colours with grc
# shellcheck disable=SC1090
[ -f "$HOMEBREW_PREFIX/etc/grc.bashrc" ] && source "$HOMEBREW_PREFIX/etc/grc.bashrc"

# Save directory changes
cd() {
  builtin cd "$@" || return
  [ "$TERMINALAPP" ] && which set_terminal_app_pwd &>/dev/null \
    && set_terminal_app_pwd
  pwd > "$HOME/.lastpwd"
  ls
}

# Pretty-print JSON files
json() {
  [ -n "$1" ] || return
  jsonlint "$1" | jq .
}

# Pretty-print Homebrew install receipts
receipt() {
  [ -n "$1" ] || return
  json "$HOMEBREW_PREFIX/opt/$1/INSTALL_RECEIPT.json"
}

# Look in ./bin but do it last to avoid weird `which` results.
force_add_to_path_start "bin"
