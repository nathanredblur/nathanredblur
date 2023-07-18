# Configure git
git config --global user.name "nathanredblur"
git config --global user.email ""

# Configure git credential helper
git config --global credential.helper osxkeychain

# Configure git aliases and auto rebase
git config --global alias.up 'pull --rebase --autostash'
git config --global pull.rebase true
git config --global rebase.autoStash true

# Configure git editor
git config --global core.editor "code --wait"

# Configure git diff tool
git config --global diff.tool code
git config --global difftool.code.cmd "code --wait --diff $LOCAL $REMOTE"

# Configure git merge tool
git config --global merge.tool code
git config --global mergetool.code.cmd "code --wait $MERGED"