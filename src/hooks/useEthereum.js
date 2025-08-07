import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS } from '../utils/networks';

const useEthereum = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState(null);
  const [ethBalance, setEthBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const network = await web3Provider.getNetwork();

        setNetwork({
            name: SUPPORTED_NETWORKS[Number(network.chainId)]?.name || `${network.name}`,
            chainId: network.chainId
          });

        if (!SUPPORTED_NETWORKS[Number(network.chainId)]) {
            const supportedNetworks = Object.values(SUPPORTED_NETWORKS).map(n => n.name).join(', ');
        
            alert(`Unsupported Network\n\nPlease switch to one of these in MetaMask:\n${supportedNetworks}`);
            
            setIsConnected(false);
            return;
          }

        const web3Signer = await web3Provider.getSigner();
        const account = await web3Signer.getAddress();
        const balance = await web3Provider.getBalance(account);
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(account);
        setEthBalance(ethers.formatEther(balance));
        setIsConnected(true);

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const disconnectWallet = async () => {
    try {
        setProvider(null);
        setSigner(null);
        setAccount('');
        setEthBalance('0');
        setIsConnected(false);
        
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
    
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{
            eth_accounts: {}
          }]
        });
        
        if (window.ethereum.isConnected()) {
          await window.ethereum.disconnect();
        }
      } catch (error) {
        console.error("Disconnect error:", error);
      }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };


  return {
    provider,
    signer,
    account,
    network,
    ethBalance,
    isConnected,
    connectWallet,
    disconnectWallet,
  };
};

export default useEthereum;