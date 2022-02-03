import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaTwitter } from '../target/types/solana_twitter';

describe('solana-twitter', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;

  it('Is initialized!', async () => {
    // Add your test here.
    await program.rpc.sendTweet('TOPIC HERE', 'CONTENT HERE', {
      accounts: {
          // Accounts here...
      },
      signers: [
          // Key pairs of signers here...
      ],
  });
    
  });
});
