# find device ID
# Apple icon > About This Mac > System Report > USB

# 0xc343: Logitech G915
hidutil property --matching '{"ProductID":0xc343}' --set '{"UserKeyMapping":[
{"HIDKeyboardModifierMappingSrc":0x7000000e2,"HIDKeyboardModifierMappingDst":0x7000000e3},
{"HIDKeyboardModifierMappingSrc":0x7000000e3,"HIDKeyboardModifierMappingDst":0x7000000e2},
{"HIDKeyboardModifierMappingSrc":0x7000000e4,"HIDKeyboardModifierMappingDst":0x7000000e7}
]}'

# 0xc545: Logitech G502
hidutil property --matching '{"ProductID":0xc545}' --set '{"UserKeyMapping":[
{"HIDKeyboardModifierMappingSrc":0x7000000e2,"HIDKeyboardModifierMappingDst":0x7000000e3},
{"HIDKeyboardModifierMappingSrc":0x7000000e3,"HIDKeyboardModifierMappingDst":0x7000000e2},
{"HIDKeyboardModifierMappingSrc":0x7000000e4,"HIDKeyboardModifierMappingDst":0x7000000e7}
]}'

# revert changes
# hidutil property --set '{"UserKeyMapping":[]}'
