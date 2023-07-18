# config
defaults write -g InitialKeyRepeat -int 10 # normal minimum is 15 (225 ms)
defaults write -g KeyRepeat -int 1 # normal minimum is 2 (30 ms)
defaults write com.apple.dock autohide -bool YES # autohide dock

defaults write com.apple.finder AppleShowAllFiles YES # show hidden files
defaults write com.apple.finder ShowPathbar -bool true # show path bar
defaults write com.apple.finder ShowStatusBar -bool true # show status bar
defaults write com.apple.finder _FXShowPosixPathInTitle -bool true # show full path in finder title
defaults write com.apple.finder FXDefaultSearchScope -string "SCcf" # search current folder by default
defaults write com.apple.finder FXPreferredViewStyle -string "Nlsv" # list view by default
defaults write com.apple.finder QLEnableTextSelection -bool true # text selection in quick look

defaults write com.apple.screencapture location ~/Downloads # save screenshots to downloads
defaults write com.apple.screencapture type -string "png" # save screenshots as png
defaults write com.apple.screencapture disable-shadow -bool true # disable shadow in screenshots

defaults write com.apple.menuextra.battery ShowPercent -string "YES" # show battery percentage
defaults write com.apple.menuextra.clock DateFormat -string "EEE d MMM  HH:mm" # show date and time in menu bar

