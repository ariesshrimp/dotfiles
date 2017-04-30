#!/bin/sh

# Ask for the administrator password upfront
sudo -v

###############################################################################
# Homebrew                                                                    #
###############################################################################

echo 'Installing Homebrew and getting all the MacOS packages...'

# Check for Homebrew and install it if missing
if test ! $(which brew)
then
  echo "Installing Homebrew..."
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
fi

brew update
brew upgrade --all

brew tap homebrew/bundle
brew bundle --global

brew cleanup

###############################################################################
# Keyboard                                                                    #
###############################################################################

echo 'Setting up your custom keyboard config...'

sh ../karabiner/setup.sh

###############################################################################
# Node Stuff                                                                  #
# https://github.com/hjuutilainen/dotfiles/blob/master/bin/osx-user-defaults.sh
###############################################################################

echo 'Setting up your Node packages...'

sh ../node/install.sh

###############################################################################
# Symlinks to link dotfiles into ~/                                           #
###############################################################################

echo 'Symlinking all your dotfiles...'

sh ./setup.sh

###############################################################################
# OSX defaults                                                                #
# https://github.com/hjuutilainen/dotfiles/blob/master/bin/osx-user-defaults.sh
###############################################################################

echo 'Updating your MacOS default settings...'

sh ../osx/set-defaults.sh