# Decentralized Twitter built on Solana

### **Welcome 👋**
This project is based off of the amazing "[Build a Web3 app on Solana with React and Rust](https://lorisleiva.com/create-a-solana-dapp-from-scratch)" series of blog posts. I made sure to work through all of the Rust + Solana instructions myself while gladly taking most of the boilerplate front-end code from the blog series. I definitely know more Vue now than when I started this project!

I made a pretty simple front-end that integrates with the Solana blockchain (specifically devnet for now). You can view all the tweets that have been posted by different accounts, as well as browse and filter tweets by specific topics or users. Web3 authentication is made easy by the concept of wallets. You can connect to the site with either a Phantom or Solflare wallet, and after that you are able to post tweets of your own.

You can see the current version of the application [here](https://solana-decentralized-twitter.vercel.app/). Make sure your wallet is on **devnet**! No real SOL is being transferred.

Users of Twitter will be familiar with the UI, although you will happily see that I've implemented an "edit tweet" button unlike the real Twitter :)

### **Any spots of the code to highlight?**
Check out `tests/solana-twitter.ts` for the main test suite. This will give a good idea of the intended functionality of the application, as well as the types of interactions with the Solana program that are allowed.

### **What else could I add?**
This is absolutely an MVP, and I know there's a few things I could add to improve the experience. I plan to continue working on this project. Some improvements that immediately come to mind:
1. Improve the UX
2. Add "likes" or "retweet" functionality
