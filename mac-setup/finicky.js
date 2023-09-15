// Use https://finicky-kickstart.now.sh to generate basic configuration
// Learn more about configuration options: https://github.com/johnste/finicky/wiki/Configuration


module.exports = {
  defaultBrowser: "Microsoft Edge Dev",   
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
    },
  ]
}
