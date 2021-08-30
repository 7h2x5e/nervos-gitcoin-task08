import { useEffect, useState } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { Button } from '../base/Button'
import { Colors } from '../../global/styles'
import styled from 'styled-components'
import { useEagerConnect, useInactiveListener } from '../../hooks'
import { Web3Provider } from '@ethersproject/providers'
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector'
import {
  injected,
} from '../connectors'

const connectorsByName: { [Key: string]: any } = {
  'Injected': injected
}

function getErrorMessage(error: Error | undefined ) {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network."
  } else if (
    error instanceof UserRejectedRequestErrorInjected 
  ) {
    return 'Please authorize this website to access your Ethereum account.'
  } else {
    console.error(error)
    return 'An unknown error occurred. Check the console for more details.'
  }
}

export const AccountButton = () => {
  const context = useWeb3React<Web3Provider>()
  const { connector, library, chainId, account, activate, deactivate, active, error } = context

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = useState<any>()
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector])

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector)

  return (
    <Account>
      { error ? <ErrorWrapper>{getErrorMessage(error)}</ErrorWrapper>:''}
      {account ? (
        <>
          <AccountLabel>{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</AccountLabel>
          <LoginButton onClick={() => deactivate()}>Disconnect</LoginButton>
        </>
      ) : (
        <LoginButton onClick={() => activate(connectorsByName['Injected'])}>Connect</LoginButton>
      )}
    </Account>
  )
}

const ErrorWrapper = styled.div`
  color: #ff3960;
  margin-right: 40px;
  margin-left: 40px;
  overflow: auto;
`

const Account = styled.div`
  display: flex;
  align-items: center;
`

const LoginButton = styled(Button)`
  background-color: ${Colors.Yellow[100]};
`

const AccountLabel = styled(Button)`
  height: 32px;
  margin-right: -40px;
  padding-right: 40px;
  padding-left: 8px;
  background-color: ${Colors.Yellow[100]};
  font-size: 12px;
`
