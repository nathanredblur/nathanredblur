# brew
eval "$(/opt/homebrew/bin/brew shellenv)"

# Add Visual Studio Code (code)
PATH=$PATH:/Applications/Visual\ Studio\ Code.app/Contents/Resources/app/bin

# sourcetree
alias stree="/Applications/SourceTree.app/Contents/Resources/stree"

# Python
eval "$(pyenv init --path)"

# Python virtualenv
eval "$(pyenv virtualenv-init -)"

# Ruby
eval "$(rbenv init - zsh)"

# Node
eval "$(nodenv init -)"