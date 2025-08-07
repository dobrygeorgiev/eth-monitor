import React from 'react';
import { SUPPORTED_NETWORKS } from '../utils/networks';
import '../styles/ConnectionPanel.css';
import metamaskLogo from '../assets/metamask-logo.png';

const ConnectionPanel = ({ isConnected, connectWallet, disconnectWallet, account, network }) => {
  const isSupported = network && SUPPORTED_NETWORKS[network.chainId];

  return (
    <div className={`connection-panel ${isConnected ? 'connected' : ''}`}>
      {!isConnected ? (
        <div className="connection-content-disconnected">
          <div className="network-status">
            <div className="status-indicator disconnected"></div>
            <span className="network-name">
              {network?.name || "Not Connected"}
            </span>
          </div>
          
          <button 
            onClick={connectWallet} 
            className="connect-button glow-on-hover"
          >
        
            Connect Wallet
            <span className="button-icon">
                  <img src={metamaskLogo} className='metamask-logo' alt="Logo" />
            </span>
          </button>
        </div>
      ) : (
        <div className="connection-content-connected">
          <div className="wallet-info">
            <div className="network-status">
              <div className={`status-indicator ${isSupported ? 'connected' : 'warning'}`}></div>
              <span className="network-name">
                {network?.name}
                {!isSupported && <span className="tooltip">Unsupported Network</span>}
              </span>
            </div>
            
            <div className="wallet-address">
              <div className="identicon"></div>
              <span>{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</span>
            </div>
            <button 
            onClick={disconnectWallet} 
            className="disconnect-button glow-on-hover"
          >
            Disconnect
          </button>
          </div>


        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;