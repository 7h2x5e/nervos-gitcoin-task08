import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { formatUnits } from '@ethersproject/units'
import { CKETH } from '../lib/cketh';
import { Contract } from "@ethersproject/contracts"
import { AddressTranslator } from 'nervos-godwoken-integration';

export function Balance() {
  const { account, library, chainId } = useWeb3React()

  const [balance, setBalance] = useState<number | null | undefined>()
  const [eth_balance, setETHBalance] = useState<number | null | undefined>()

  const addressTranslator = new AddressTranslator();

  async function getETHBalance(account: string) {
    const polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(account);
    const contract = new Contract(CKETH.tokenAddress, CKETH.abi, library.getSigner());
    return await contract.balanceOf(polyjuiceAddress);
  }


  useEffect((): any => {
    if (!!account && !!library) {
      let stale = false

      const updateBalance = () =>{
        library
        .getBalance(account)
        .then((balance: any) => {
          if (!stale) {
            setBalance(balance)
          }
        })
        .catch(() => {
          if (!stale) {
            setBalance(null)
          }
        });

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
        setBalance(undefined)
        setETHBalance(undefined)
      }
    }
  }, [account, library, chainId]) // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <>
      {
        !!account ? <span>Your Balance: </span> : ''
      }
      {
        chainId != 4 ? '' :
          (
            <>
              <span>{balance === null ? 'Error' : balance ? `${formatUnits(balance, 'ether')} rETH` : ''}</span>
            </>
          )
      }
      {
        chainId != 71393 ? '' :
          (
            <>
              <span>{balance === null ? 'Error' : balance ? `${balance / 1e8} CKB` : ''}</span>
              <span>{eth_balance === null ? 'Error' : eth_balance ? `, ${formatUnits(eth_balance, "ether")} ckETH` : ''}</span>
            </>
          )
      }
    </>
  )
}