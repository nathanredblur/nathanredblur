// Use https://finicky-kickstart.now.sh to generate basic configuration
// Learn more about configuration options: https://github.com/johnste/finicky/wiki/Configuration


module.exports = {
  defaultBrowser: "Microsoft Edge",   
  handlers: [
    {
      // Open any link clicked in VsCode
      match: ({ opener }) => ["com.microsoft.VSCode", "com.googlecode.iterm2", "com.bluebanana-software.inyourface"].includes(opener.bundleId),
      browser: "Google Chrome"
    },
    {
      match: /^https?:\/\/localhost:/,
      browser: "Google Chrome"
    },
    {
      match: /^file:\/\//,
      browser: "Google Chrome"
    },
  ]
}