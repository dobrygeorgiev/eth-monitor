import React from 'react';
import './styles/App.css';
import useEthereum from './hooks/useEthereum';
import ConnectionPanel from './components/ConnectionPanel';
import BalanceDisplay from './components/BalanceDisplay';
import { SUPPORTED_NETWORKS} from './utils/networks';
import nexoLogo from './assets/nexo-logo.svg';

function App() {
  const {
    provider,
    signer,
    account,
    network,
    ethBalance,
    isConnected,
    connectWallet,
    disconnectWallet,
  } = useEthereum();

  return (
    <div className="app">
    <div className='header-container'>
      <h1>Ethereum Monitor</h1>
      <img src={nexoLogo} className='nexo-logo' alt="Logo" />
    </div>
      <ConnectionPanel
        isConnected={isConnected}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        account={account}
        network={network}
      />
      
      {isConnected ? (
        <>
          <BalanceDisplay
            provider={provider}
            signer={signer}
            account={account}
            network={network}
            ethBalance={ethBalance}
          />
        </>
      ) : (
      <div className="disconnected-message">
        <p>Please connect your MetaMask wallet to an Ethereum network</p>
        <div className="supported-networks">
          <p>Supported networks:</p>
          <ul>
            {Object.entries(SUPPORTED_NETWORKS).map(([id, net]) => (
              <li key={id}>{net.name} (Chain ID: {id})</li>
            ))}
          </ul>
        </div>
      </div>
      )}
    </div>
  );
}

export default App;