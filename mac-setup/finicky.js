// Use https://finicky-kickstart.now.sh to generate basic configuration
// Learn more about configuration options: https://github.com/johnste/finicky/wiki/Configuration
// how to find Bundle ID: https://www.hexnode.com/mobile-device-management/help/how-to-find-the-bundle-id-of-an-application-on-mac/
// osascript -e 'id of app "App Name"' 

module.exports = {
  defaultBrowser: ["Microsoft Edge", "Google Chrome"],
  handlers: [
    {
      // Open any link clicked in VsCode
      match: ({ opener }) => [
        "com.microsoft.VSCode", 
        "com.microsoft.VSCodeInsiders",
        "com.googlecode.iterm2", 
        "dev.warp.Warp-Stable",
        "com.bluebanana-software.inyourface",
        "com.apple.dt.Xcode",
      ].includes(opener.bundleId),
      browser: "Google Chrome"
    },
    {
      match: /^https?:\/\/localhost:/,
      browser: "Google Chrome"
    },
    {
      match: /dev\.local\.itsgoti\.me/,
      browser: "Google Chrome",
    },
    {
      match: /^file:\/\//,
      browser: "Google Chrome"
    }
  ]
}
