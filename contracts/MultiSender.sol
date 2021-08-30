pragma solidity >=0.8.0;

contract MultiSender {
    address public owner;

    constructor() payable {
        owner = msg.sender;
    }

    event TransferCompleted(address sender, uint256 value);

    function multisend(address[] memory to) external payable {
        uint256 value = msg.value / to.length;
        for (uint256 i = 0; i < to.length; ++i) {
            payable(to[i]).transfer(value);
        }

        emit TransferCompleted(msg.sender, msg.value);
    }
}
