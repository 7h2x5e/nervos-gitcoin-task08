import React from 'react'
import ReactDOM from 'react-dom';
import { Redirect, Route, Switch } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { Page } from './components/base/base'
import { GlobalStyle } from './global/GlobalStyle'
import { TopBar } from './components/TopBar'
import { SendEtherPage } from './pages/SendEtherPage'
import { BridgePage } from './pages/BridgePage'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

function getLibrary(provider: any): Web3Provider {
    const library = new Web3Provider(provider)
    library.pollingInterval = 6000
    return library
}

ReactDOM.render(
    <React.StrictMode>
        <Web3ReactProvider getLibrary={getLibrary}>
            <GlobalStyle />
            <Page>
                <BrowserRouter>
                    <TopBar />
                    <Switch>
                        <Route exact path="/send" component={SendEtherPage} />
                        <Route exact path="/bridge" component={BridgePage} />
                        <Redirect exact from="/" to="/bridge" />
                    </Switch>
                </BrowserRouter>
            </Page>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover={false}
            />
        </Web3ReactProvider>
    </React.StrictMode>,
    document.getElementById('root')
);