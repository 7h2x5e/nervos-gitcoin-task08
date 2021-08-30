import React, { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { Button } from '../base/Button'
import { ethers } from 'ethers'
import { BigNumber } from 'ethers'
import { ContentBlock } from '../base/base'
import { TextBold } from '../../typography/Text'
import { Colors, BorderRad, Transitions } from '../../global/styles'
import styled from 'styled-components'
import { Balance } from './Balance'
// import { CKETH } from './cketh';
import { toast } from 'react-toastify';

import Web3 from 'web3';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import { MultiSenderWrapper } from '../lib/contracts/MultiSenderWrapper';
import { CONFIG } from '../../config';

async function createWeb3() {
  // Modern dapp browsers...
  if ((window as any).ethereum) {
    const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
    const providerConfig = {
      rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
      ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
      web3Url: godwokenRpcUrl
    };

    const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
    const web3 = new Web3(provider || Web3.givenProvider);

    try {
      // Request account access if needed
      await (window as any).ethereum.enable();
    } catch (error) {
      // User denied account access...
    }

    return web3;
  }

  console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  return null;
}

const InputComponent = () => {
  const { account } = useWeb3React()
  const [text, setText] = useState('');
  const [disabled, setDisabled] = useState(true)
  const [helper_text, setHelperText] = useState('');
  const [receiver, setReceiver] = useState<string[]>([]);
  const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<MultiSenderWrapper | undefined>();

  const addressTranslator = new AddressTranslator();

  useEffect(() => {
    if (web3) {
      return;
    }

    (async () => {
      const _web3 = await createWeb3();
      setWeb3(_web3);
    })();
  }, []);

  useEffect(() => {
    if (!!web3) {
      const CONTRACT_ADDR = '0x6e20280512D096592CbECeB6928D487bCE1926BE';
      const _contract = new MultiSenderWrapper(web3, CONTRACT_ADDR);
      setContract(_contract);

      toast(
        'Successfully loaded existing smart-contract.',
        { type: 'success' }
      );

      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [web3]);

  const getL2Balance = async () => {
    if (!account || !web3) return;
    const _l2Balance = BigInt(await web3.eth.getBalance(account));
    console.log("L2: ", _l2Balance);
  }

  const sendingTransaction = async () => {
    if (!contract || !account || !web3) return;
    getL2Balance();

    setDisabled(true)
    const sendingTx = new Promise(async (resolve, reject) => {
      try {
        const ret = await contract.multisend(amount.mul(1e8).toString(), receiver, account);
        resolve(ret);
      } catch (e) {
        reject(e);
      }
    });
    try {
      let response = await toast.promise(
        sendingTx,
        {
          pending: 'Transaction is pending',
          success: 'Transaction confirmed',
          error: 'Transaction rejected '
        }
      );
      console.log(response)
    } catch (e) {
      console.log(e)
    } finally {
      setDisabled(false)
    }

    getL2Balance();
  }

  const handleChange = (e: React.FormEvent) => {
    const _text = (e.target as HTMLTextAreaElement).value;
    setText(_text);

    const lines = _text.match(/[^\n]+/g);
    if (lines !== null && lines.length >= 2) {
      try {
        let amount: BigNumber, receiver: string[] = [];
        amount = BigNumber.from(lines.splice(0, 1)[0]);
        for (let line of lines) {
          if (line) {
            let polyjuiceAddress = ethers.utils.getAddress(line.trim());
            polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(polyjuiceAddress);
            receiver.push(polyjuiceAddress);
          }
        }
        setAmount(amount);
        setReceiver(receiver);
        return setHelperText(`${amount.div(receiver.length).toString()} CKB / Address`);
      } catch (e) {
        console.log(e)
      }
    }
    return setHelperText(`- CKB / Address`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <InputRow>
        <Textarea
          placeholder={
            '100\n' +
            '0x6486143EC7255b3C0351dFbab76efb1Fb05F5c8e\n' +
            '0x4eA18a61c1F1b644439680c035DB7eF50De234f9\n'
          }
          id={`EthInput`}
          value={text}
          onChange={handleChange}
          disabled={disabled}
        />
      </InputRow>
      <LabelRow>
        <Label style={{ margin: 'auto' }}>
          {
            helper_text
          }
        </Label>
      </LabelRow>
      <LabelRow>
        <SmallButton style={{ margin: 'auto' }} disabled={disabled} onClick={sendingTransaction}>
          Send
        </SmallButton>
      </LabelRow>
    </div>
  )
}


function ChainId() {
  const { chainId } = useWeb3React()

  return (
    <>
      <span>{chainId === null ? 'Error' : chainId ? `Chain Id: ${chainId ?? ''}` : ''}</span>
    </>
  )
}

function BlockNumber() {
  const { chainId, library } = useWeb3React()
  const [blockNumber, setBlockNumber] = useState<number | undefined | null>()

  React.useEffect((): any => {
    if (!!library) {
      let stale = false

      library
        .getBlockNumber()
        .then((blockNumber: number) => {
          if (!stale) {
            setBlockNumber(blockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            setBlockNumber(null)
          }
        })

      const updateBlockNumber = (blockNumber: number) => {
        setBlockNumber(blockNumber)
      }
      library.on('block', updateBlockNumber)

      return () => {
        stale = true
        library.removeListener('block', updateBlockNumber)
        setBlockNumber(undefined)
      }
    }
  }, [library, chainId]) // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <>
      <span>{blockNumber === null ? 'Error' : blockNumber ? `Block Number: ${blockNumber ?? ''}` : ''}</span>
    </>
  )
}

export const SendEthForm = () => {
  return (
    <ContentBlock style={{ padding: 0 }}>
      <TitleRow>
        <CellTitle>Input recivers</CellTitle>
        <BalanceWrapper>
          <ChainId />
        </BalanceWrapper>
        <BalanceWrapper>
          <BlockNumber />
        </BalanceWrapper>
        <BalanceWrapper>
          <Balance />
        </BalanceWrapper>
      </TitleRow>
      <InputComponent />
    </ContentBlock>
  )
}

const CellTitle = styled(TextBold)`
  font-size: 18px;
`

const LabelRow = styled.div`
  display: flex;
  margin: 32px 0 24px 0;
`

const Label = styled.label`
  font-weight: 700;
  cursor: pointer;
  transition: ${Transitions.all};

  &:hover,
  &:focus-within {
    color: ${Colors.Yellow[500]};
  }
`

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: ${Colors.Gray['300']} 1px solid;
  padding: 16px;
`

const BalanceWrapper = styled.div`
  color: ${Colors.Gray['600']};
  font-size: 14px;
`

const Textarea = styled.textarea`
  height: 100%;
  width: 600px;
  padding: 0 0 0 0px;
  border: 0;
//   border-radius: ${BorderRad.m};
  -moz-appearance: textfield;
  outline: none;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-background-clip: text;
  }
`

const InputRow = styled.div`
  height: 100px;
  display: flex;
  margin: 0 auto;
  color: ${Colors.Gray['600']};
  align-items: center;
  border: ${Colors.Gray['300']} 1px solid;
//   border-radius: ${BorderRad.m};
  overflow: hidden;
  transition: ${Transitions.all};

  &:hover,
  &:focus-within {
    border-color: ${Colors.Black[900]};
  }
`

const FormTicker = styled.div`
  padding: 0 8px;
`

const SmallButton = styled(Button)`
  display: flex;
  justify-content: center;
  min-width: 95px;
  height: 100%;
  padding: 8px 24px;

  &:disabled {
    color: ${Colors.Gray['600']};
    cursor: unset;
  }

  &:disabled:hover,
  &:disabled:focus {
    background-color: unset;
    color: unset;
  }
`
