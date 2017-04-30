#!/bin/sh

###############################################################################
# NVM
###############################################################################

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
if test ! $(which nvm)
then
  nvm install node
  nvm use node
  nvm alias default node
fi

###############################################################################
# My favorite global packages
###############################################################################

if test $(which yarn)
then
  yarn global add eslint
  yarn global add prettier-eslint
  yarn global add babel-eslint
  yarn global add --dev eslint-config-meridian@git+ssh://git@github.com/joefraley/eslint-config-meridian.git

  yarn global add babel-cli

  yarn global add commitizen
  yarn global add cz-conventional-changelog

  yarn global add create-react-app
  yarn global add now
  yarn global add live-server
  yarn global add nr

  yarn global add flow-bin
  flow init
else
  npm i -g eslint
  npm i -g prettier-eslint
  npm i -g babel-eslint
  npm i -g --dev eslint-config-meridian@git+ssh://git@github.com/joefraley/eslint-config-meridian.git

  npm i -g babel-cli

  npm i -g commitizen
  npm i -g cz-conventional-changelog

  npm i -g create-react-app
  npm i -g now
  npm i -g live-server
  npm i -g nr

  npm i -g flow-bin
  flow init
fi