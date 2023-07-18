#!/bin/bash
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

# PRECONDITIONS
# 1)
# make sure the file is executable
# chmod +x osx_bootstrap.sh
#
# 2)
# Your password may be necessary for some packages
#
# 3)
# https://docs.brew.sh/Installation#macos-requirements
# xcode-select --install
# (_xcode-select installation_ installs git already, however git will be installed via brew packages as well to install as much as possible the brew way
#  this way you benefit from frequent brew updates)
# 
# 4) don't let the “Operation not permitted” error bite you
# Please make sure you system settings allow the termianl full disk access
# https://osxdaily.com/2018/10/09/fix-operation-not-permitted-terminal-error-macos/

# `set -eu` causes an 'unbound variable' error in case SUDO_USER is not set
SUDO_USER=$(whoami)


# Install xcode
xcode-select --install
# sudo -u $SUDO_USER xcodebuild -license accept


# Install brew
if test ! $(which brew); then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

brew update
brew upgrade

brew install mas

# find the CLI Tools update
echo "find CLI tools update"
PROD=$(softwareupdate -l | grep "\*.*Command Line" | head -n 1 | awk -F"*" '{print $2}' | sed -e 's/^ *//' | tr -d '\n') || true
# install it
if [[ ! -z "$PROD" ]]; then
  softwareupdate -i "$PROD" --verbose
fi

brew bundle --no-quarantine --file=./Brewfile

# update zhrc
cat ./zprofile.sh >> ~/.zprofile

# config finicky
cp -fr ./finicky.js ~/.finicky.js

# config git
sh ./gitconfig.sh

exec "$SHELL"