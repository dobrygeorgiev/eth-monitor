import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { NEXO_CONTRACT, WETH_CONTRACT } from '../utils/contracts';
import { TOKENS } from '../utils/tokens';
import Modal from './Modal';
import '../styles/BalanceDisplay.css';

const BalanceDisplay = ({ provider, signer, account, network, ethBalance }) => {
  const [wethBalance, setWethBalance] = useState('0');
  const [nexoBalance, setNexoBalance] = useState('0');
  const [wethPrice, setWethPrice] = useState(null);
  const [showWrapModal, setShowWrapModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [ethAmount, setEthAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [isWrapping, setIsWrapping] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);


  const fetchBalances = useCallback (async () => {
    try {
      // Get WETH Balance
      const wethAddress = WETH_CONTRACT[network.chainId];
      if (wethAddress) {
        const wethContract = new ethers.Contract(
          wethAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const wethBal = await wethContract.balanceOf(account);
        setWethBalance(ethers.formatUnits(wethBal, TOKENS.WETH.decimals));
      }

      // Get NEXO Balance
      const nexoAddress = NEXO_CONTRACT[network.chainId];
      if (nexoAddress) {
        const nexoContract = new ethers.Contract(
          nexoAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const nexoBal = await nexoContract.balanceOf(account);
        setNexoBalance(ethers.formatUnits(nexoBal, TOKENS.NEXO.decimals));
      }

      // Fetch WETH price
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=weth&vs_currencies=usd');
      const data = await response.json();
      setWethPrice(data.weth.usd);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [provider, account, network]);


  useEffect(() => {
    if (!provider || !account || !network) return;

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [provider, account, network, fetchBalances]);

  const wrapEth = async () => {
    if (!signer || !ethAmount || isWrapping) return;
    setIsWrapping(true);
    try {
      const wethAddress = WETH_CONTRACT[network.chainId];
      const tx = await signer.sendTransaction({
        to: wethAddress,
        data: '0xd0e30db0', // deposit()
        value: ethers.parseEther(ethAmount)
      });
      await tx.wait();
      setShowWrapModal(false);
      setEthAmount('');
      alert('Wrapped ETH successfully');
      fetchBalances();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsWrapping(false);
    }
  };

  const handleSwap = async () => {
    if (!signer || !swapAmount || isSwapping || !network) return;
    setIsSwapping(true);
    try {


        const wethAddress = WETH_CONTRACT[network.chainId];
        const wethContract = new ethers.Contract(
          wethAddress,
          ["function approve(address,uint256) returns (bool)"],
          signer
        );
    

        const amountWei = ethers.parseUnits(swapAmount, 18).toString();


        const approveTx = await wethContract.approve(
          "0x1111111254EEB25477B68fb85Ed929f73A960582", // 1inch router
          amountWei
        );
        await approveTx.wait();

      const serializeBigInt = (obj) => {
        return JSON.parse(JSON.stringify(obj, (_, v) => 
          typeof v === 'bigint' ? v.toString() : v
        ));
      };

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId: serializeBigInt(network.chainId),
          src: WETH_CONTRACT[network.chainId],
          dst: NEXO_CONTRACT[network.chainId],
          amount: serializeBigInt(amountWei),
          fromAddress: account
        })
      });

      const responseText = await response.text();
      const swapData = serializeBigInt(JSON.parse(responseText));


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '');
      }

    const tx = await signer.sendTransaction({
        to: swapData.to,
        data: swapData.data,
        value: swapData.value ? Number(swapData.value) : 0n
      });


      setShowSwapModal(false);
      setSwapAmount('');
      alert(`Swap submitted! TX Hash: ${tx.hash}`);
    } catch (error) {
      alert(`Swap failed: ${error.message}`);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="balance-display">
      <div className="balance-card">
        <h1 className="main-balance">{parseFloat(ethBalance).toFixed(4)} ETH</h1>
        {wethPrice && <p className="secondary-balance">≈ ${(parseFloat(ethBalance) * wethPrice).toFixed(2)} (1 WETH ≈ {wethPrice})</p>}
        
        <div className="action-buttons">
          <button 
            className="action-button wrap-button"
            onClick={() => setShowWrapModal(true)}
          >
            Wrap ETH
          </button>
          
          <button 
            className={`action-button swap-button ${String(network?.chainId) !== '1' ? 'disabled' : ''}`}
            onClick={() =>String(network?.chainId) === '1' && setShowSwapModal(true)}
            disabled={String(network?.chainId) !== '1'}
            data-tooltip={String(network?.chainId) !== '1' ? "Swapping NEXO only available on Ethereum Mainnet" : null}
          >
            Swap to NEXO
          </button>
        </div>
      </div>

      <div className="tokens-section">
        <h2 className="section-title">Your Tokens</h2>
        <div className="tokens-grid">
          <div className="token-card">
            <span className="token-name">ETH</span>
            <span className="token-amount">{parseFloat(ethBalance).toFixed(4)}</span>
          </div>
          <div className="token-card">
            <span className="token-name">WETH</span>
            <span className="token-amount">{parseFloat(wethBalance).toFixed(4)}</span>
          </div>
          <div className="token-card">
            <span className="token-name">NEXO</span>
            <span className="token-amount">{parseFloat(nexoBalance).toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Wrap ETH Modal */}
      <Modal isOpen={showWrapModal} onClose={() => setShowWrapModal(false)}>
        <h2>Wrap ETH to WETH</h2>
        <div className="input-group">
          <input
            type="number"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="ETH amount"
            min="0"
            step="0.001"
          />
          <button onClick={wrapEth} disabled={isWrapping}>
            {isWrapping ? 'Wrapping...' : 'Wrap'}
          </button>
        </div>
      </Modal>

      {/* Swap to NEXO Modal */}
      <Modal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)}>
        <h2>Swap WETH to NEXO</h2>
        <div className="input-group">
          <input
            type="number"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
            placeholder="WETH amount"
            min="0"
            step="0.001"
          />
          <button onClick={handleSwap} disabled={isSwapping}>
            {isSwapping ? 'Swapping...' : 'Swap'}
          </button>
        </div>
        {String(network?.chainId) !== '1' && (
          <p className="warning-message">Swapping only available on Ethereum Mainnet</p>
        )}
      </Modal>
    </div>
  );
};

export default BalanceDisplay;