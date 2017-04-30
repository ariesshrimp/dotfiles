#!/bin/sh

###############################################################################
# NVM
###############################################################################

echo "Checking for an existing Node Version Manager..."

if test ! $(nvm --version)
then
  echo "Installing Node Version Manager..."
  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash

  echo "Installing Node and npm..."  
  nvm install node
  nvm use node
  nvm alias default node
fi

###############################################################################
# My favorite global packages
###############################################################################

packages=(
  eslint
  prettier-eslint
  babel-eslint
  babel-cli
  commitizen
  cz-conventional-changelog
  create-react-app
  now
  live-server
  nr
  flow-bin
  concurrently
)

if test $(which yarn)
then
  echo "I found yarn installed so I'm using that for global packages..."  
  yarn global add "${packages[@]}"
else
  echo "I'm using your default npm path for global packages..."  
  npm i -g "${packages[@]}"
fi