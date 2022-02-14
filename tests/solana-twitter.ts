import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaTwitter } from '../target/types/solana_twitter';
import * as assert from "assert";
import * as bs58 from "bs58";

describe('solana-twitter', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;
  const sendTweetWrapper = async (author, topic, content) => {
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet(topic, content, {
        accounts: {
            tweet: tweet.publicKey,
            author: author,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
    });

    return tweet
}

  it('can send a new tweet', async () => {
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet('nba', 'How about these all star selections??', {
        accounts: {
            tweet: tweet.publicKey,
            author: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
    });

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
  	assert.equal(tweetAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
    assert.equal(tweetAccount.topic, 'nba');
    assert.equal(tweetAccount.content, 'How about these all star selections??');
    assert.ok(tweetAccount.timestamp);
  });

  it('can send a new tweet without a topic', async () => {
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet('', 'gm', {
        accounts: {
            tweet: tweet.publicKey,
            author: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
    });

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
  	assert.equal(tweetAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
    assert.equal(tweetAccount.topic, '');
    assert.equal(tweetAccount.content, 'gm');
    assert.ok(tweetAccount.timestamp);
  });

  it('can send a new tweet from a different author', async () => {
    const newUser = anchor.web3.Keypair.generate();
    // We need to airdrop newUser some SOL sso that their Tweet account
    // can be rent-exempt
    const signature = await program.provider.connection.requestAirdrop(newUser.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);

    // Call the "SendTweet" instruction on behalf of this other user.
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet('test', 'Hello World from a different user', {
        accounts: {
            tweet: tweet.publicKey,
            author: newUser.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [newUser, tweet],
    });

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), newUser.publicKey.toBase58());
    assert.equal(tweetAccount.topic, 'test');
    assert.equal(tweetAccount.content, 'Hello World from a different user');
    assert.ok(tweetAccount.timestamp);
  });

  it('cannot give a topic with more than 50 characters', async () => {
    try {
      const tweet = anchor.web3.Keypair.generate();
      const longTopic = 'nba'.repeat(17); // 3 char * 17 = 51
      await program.rpc.sendTweet(longTopic, 'How about these all star selections??', {
          accounts: {
              tweet: tweet.publicKey,
              author: program.provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [tweet],
      });
    } catch (err) {
      assert.equal(err.msg, 'The provided topic should be 50 characters long maximum.');
      return;
    }

    assert.fail('The instruction should have failed with a 51-character topic.');
   
  });

  it('cannot provide a content with more than 280 characters', async () => {
    try {
        const tweet = anchor.web3.Keypair.generate();
        const contentWith281Chars = 'x'.repeat(281);
        await program.rpc.sendTweet('whatever', contentWith281Chars, {
            accounts: {
                tweet: tweet.publicKey,
                author: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [tweet],
        });
    } catch (error) {
        assert.equal(error.msg, 'The provided content should be 280 characters long maximum.');
        return;
    }

    assert.fail('The instruction should have failed with a 281-character content.');
  });

  // NOTE - BE AWARE
  // this test is pretty brittle in my opinion.
  // we're relying on the fact that the 5 tests above this one result in 3 total Tweets being created.
  // if any of those above tests change, we will have to change the assertion value in this test. yuck.
  // But for now, this is an OK-if-gross way to verify we can fetch ALL tweet accounts ever created.
  it('can fetch all tweets', async () => {
    const grossTweetCountFromAboveTests = 3;
    const tweetAccounts = await program.account.tweet.all();
    assert.equal(tweetAccounts.length, grossTweetCountFromAboveTests);
  });

  // Same note as above. We're relying on the fact that so far, our wallet has created
  // 2 of the 3 total tweet acounts. So, the tweetAccounts variable below should only have 2 accounts.
  it('can filter tweets by author', async () => {
    const authorPublicKey = program.provider.wallet.publicKey
    const tweetAccounts = await program.account.tweet.all([
        {
            memcmp: {
                offset: 8, // First 8 bytes are the Discriminator and then the author's public key comes afterwards.
                bytes: authorPublicKey.toBase58(),
            }
        }
    ]);

    assert.equal(tweetAccounts.length, 2);
    assert.ok(tweetAccounts.every(tweetAccount => {
      return tweetAccount.account.author.toBase58() === authorPublicKey.toBase58()
    }))
  });

  it('can filter tweets by topics', async () => {
    const tweetAccounts = await program.account.tweet.all([
        {
            memcmp: {
                offset: 8 + // Discriminator.
                    32 + // Author public key.
                    8 + // Timestamp.
                    4, // Topic string prefix.
                bytes: bs58.encode(Buffer.from('nba')),
            }
        }
    ]);

    assert.equal(tweetAccounts.length, 1);
    assert.ok(tweetAccounts.every(tweetAccount => {
        return tweetAccount.account.topic === 'nba'
    }))
  });

  it('can update an existing tweet', async() => {
    const author = program.provider.wallet.publicKey;
    const tweet = await sendTweetWrapper(author, 'nfl', 'Rams just won the Super Bowl!');
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // sanity check we are grabbing the right data to start
    assert.equal(tweetAccount.topic, 'nfl');
    assert.equal(tweetAccount.content, 'Rams just won the Super Bowl!');

    // Call updateTweet()
    await program.rpc.updateTweet('nba', 'Time for the NBA to take center stage!', {
      accounts: {
        tweet: tweet.publicKey,
        author: program.provider.wallet.publicKey,
      },
    });

    // Verify that the data for the existing tweet has been updated
    const updatedTweetAccount = await program.account.tweet.fetch(tweet.publicKey);
    assert.equal(updatedTweetAccount.topic, 'nba');
    assert.equal(updatedTweetAccount.content, 'Time for the NBA to take center stage!');

  });
});
