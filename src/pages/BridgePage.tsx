import React from 'react'
import styled from 'styled-components'
import { AccountButton } from '../components/account/AccountButton'
import { Container, MainContent, Section, SectionRow } from '../components/base/base'
import { Title } from '../typography/Title'
import { TextBold } from '../typography/Text'
import { BorderRad, Colors } from '../global/styles'
import { ContentBlock } from '../components/base/base'
import { CKETH } from '../components/lib/cketh';
import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { Contract } from "@ethersproject/contracts"
import { formatUnits } from '@ethersproject/units'
import Web3 from 'web3';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import { CONFIG } from '../config';
import gura from '../assets/images/gura.gif'

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

export function BridgePage() {
  const { account, library, chainId } = useWeb3React()
  const [eth_balance, setETHBalance] = useState<number | null | undefined>()
  const [depositAddress, setDepositAddress] = useState<string | undefined>()
  const [web3, setWeb3] = useState<Web3 | null>(null);
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

  const getETHBalance = async (account: string) => {
    const polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(account);
    const contract = new Contract(CKETH.tokenAddress, CKETH.abi, library.getSigner());
    return await contract.balanceOf(polyjuiceAddress);
  }

  useEffect((): any => {
    if (!!account && !!library) {
      let stale = false

      const updateBalance = () => {
        getETHBalance(account)
          .then((balance: any) => {
            if (!stale) {
              setETHBalance(balance)
            }
          })
          .catch(() => {
            if (!stale) {
              setETHBalance(null)
            }
          });
      }
      updateBalance();

      const callback = (blockNumber: number) => {
        updateBalance()
      }
      library.on('block', callback)

      return () => {
        stale = true
        library.removeListener('block', callback)
        setETHBalance(undefined)
      }
    }
  }, [account, library, chainId])

  useEffect((): any => {
    if (!!account && !!library) {
      (async () => {
        const depositAddress = await addressTranslator.getLayer2DepositAddress(web3, account);
        setDepositAddress(depositAddress.addressString);
      })();
    }
  }, [account, library, chainId])

  return (
    <MainContent>
      <Container>
        <Section>
          <SectionRow>
            <Title>Bridge</Title>
            <AccountButton />
          </SectionRow>
          <TableGrid>
            <SmallContentBlock>
              <TitleRow>
                <CellTitle>Your Layer 2 Deposit Address</CellTitle>
              </TitleRow>
              <textarea 
              style={{ 'minHeight': '160px' }} 
              defaultValue={depositAddress ?? ''}/>
              <div style={{'textAlign':'center'}}>
                <a
                  target="_blank"
                  href="https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos?xchain-asset=0x0000000000000000000000000000000000000000"
                > ★ Deposit rETH ★
                </a>
              </div>

            </SmallContentBlock>
            <SmallContentBlock>
              <TitleRow>
                <CellTitle>Your ckETH balance</CellTitle>
                {eth_balance === null ? 'Error' : eth_balance ? `${formatUnits(eth_balance, "ether")} ckETH` : ''}
              </TitleRow>
              <div style={{'textAlign':'center'}}>
                <img src={gura} alt="loading..." />
                Source: https://seafoamfucker.tumblr.com/
              </div>
            </SmallContentBlock>
          </TableGrid>
        </Section>
      </Container>
    </MainContent>
  )
}

const Label = styled.label`
  font-weight: 700;
`

const LabelRow = styled.div`
  justify-content: center;
  margin: 32px 0 24px 0;
`

const CellTitle = styled(TextBold)`
  font-size: 18px;
`

const TableGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`

const SmallContentBlock = styled(ContentBlock)`
  padding: 0;
`

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: ${Colors.Gray['300']} 1px solid;
  padding: 16px;
`