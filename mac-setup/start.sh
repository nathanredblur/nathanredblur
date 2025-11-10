#!/bin/bash

# https://stackoverflow.com/questions/54392510/how-to-assign-a-key-remapping-to-specific-device-using-hidutil
# hidutil list
# https://stackoverflow.com/questions/6442364/running-script-upon-login-in-mac-os-x/13372744#13372744
# https://discussions.apple.com/thread/253494010?sortBy=rank
# code ~/Library/LaunchAgents/com.local.KeyRemapping.plist
# launchctl load ~/Library/LaunchAgents/com.local.KeyRemapping.plist
# https://apple.stackexchange.com/questions/467341/hidutil-stopped-working-on-macos-14-2-update/470622#470622

/usr/bin/hidutil property --matching '{"ProductID":0xc343}' --set '{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0x7000000e2,"HIDKeyboardModifierMappingDst":0x7000000e3},{"HIDKeyboardModifierMappingSrc":0x7000000e3,"HIDKeyboardModifierMappingDst":0x7000000e2},{"HIDKeyboardModifierMappingSrc":0x7000000e4,"HIDKeyboardModifierMappingDst":0x7000000e7}]}'
/usr/bin/hidutil property --matching '{"ProductID":0xc545}' --set '{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0x7000000e2,"HIDKeyboardModifierMappingDst":0x7000000e3},{"HIDKeyboardModifierMappingSrc":0x7000000e3,"HIDKeyboardModifierMappingDst":0x7000000e2},{"HIDKeyboardModifierMappingSrc":0x7000000e4,"HIDKeyboardModifierMappingDst":0x7000000e7}]}'