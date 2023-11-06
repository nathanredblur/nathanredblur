# https://www.zapzsh.org/
zsh <(curl -s https://raw.githubusercontent.com/zap-zsh/zap/master/install.zsh) --branch release-v1

# add this to your ~/.zshrc
echo '
plug "zsh-users/zsh-history-substring-search"
plug "romkatv/powerlevel10k"
plug "chivalryq/git-alias"
plug "MichaelAquilina/zsh-you-should-use"

# bindkey for history substring search
bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down
' >> ~/.zshrc
