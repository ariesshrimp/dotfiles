export ZSH=$HOME/.oh-my-zsh

# See https://github.com/robbyrussell/oh-my-zsh/wiki/Themes
ZSH_THEME="robbyrussell"

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
plugins=(git)

source $ZSH/oh-my-zsh.sh

###############################################################################
# User configuration
###############################################################################

# Set up editor
if [ -n "${SSH_CONNECTION}" ]
then
  export GIT_EDITOR="$EDITOR -w"
elif which code
then
  export EDITOR="code"
  export GIT_EDITOR="$EDITOR -w"
elif which vim
then
  export EDITOR="vim"
elif which vi
then
  export EDITOR="vi"
fi

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

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
