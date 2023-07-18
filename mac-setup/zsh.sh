# https://www.zapzsh.org/

# https://www.chezmoi.io/
# https://www.reddit.com/r/zsh/comments/vryjud/comment/if1p3im/?utm_source=reddit&utm_medium=web2x&context=3
# https://github.com/Crandel/home

# Install oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"


# ho my posh
brew install jandedobbeleer/oh-my-posh/oh-my-posh

# Install zsh plugins
# https://github.com/zplug/zplug
brew install zplug

#add this to your ~/.zshrc
# https://github.com/paulirish/git-open
zplug "paulirish/git-open", as:plugin
# https://github.com/MichaelAquilina/zsh-you-should-use
zplug "MichaelAquilina/zsh-you-should-use", as:plugin

# https://github.com/marlonrichert/zsh-autocomplete
# https://github.com/Aloxaf/fzf-tab

# https://github.com/zsh-users/zsh-autosuggestions
zplug "zsh-users/zsh-autosuggestions", as:plugin
zplug "zsh-users/zsh-syntax-highlighting", defer:2
zplug "romkatv/powerlevel10k", as:theme, depth:1