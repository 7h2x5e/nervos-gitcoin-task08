import Web3 from 'web3';
import * as SimpleStorageJSON from '../../../../build/contracts/MultiSender.json';
import { MultiSender } from '../../../types/MultiSender';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class MultiSenderWrapper {
    web3: Web3;

    contract: MultiSender;

    constructor(web3: Web3, address: string) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(SimpleStorageJSON.abi as any) as any;
        this.contract.options.address = address;
    }

    async multisend(value: string, receivers: string[], fromAddress: string) {
        const tx = await this.contract.methods.multisend(receivers).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress,
            value: value
        });

        return tx;
    }
}
