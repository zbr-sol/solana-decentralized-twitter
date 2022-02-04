import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaTwitter } from '../target/types/solana_twitter';
import * as assert from "assert";

describe('solana-twitter', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;

  it('can send a new tweet', async () => {
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet('NBA', 'How about these all star selections??', {
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
    assert.equal(tweetAccount.topic, 'NBA');
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
    await program.rpc.sendTweet('', 'Hello World from a different user', {
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
    assert.equal(tweetAccount.topic, '');
    assert.equal(tweetAccount.content, 'Hello World from a different user');
    assert.ok(tweetAccount.timestamp);
  });

  it('cannot give a topic with more than 50 characters', async () => {
    try {
      const tweet = anchor.web3.Keypair.generate();
      const longTopic = 'NBA'.repeat(17); // 3 char * 17 = 51
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
});
