// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract ShillPortal {

    struct Shill {
        uint id;
        uint timestamp;
        address shiller;
        string emoji;
        string title;
        string body;
        address[] voters;
    }

    Shill[] public shills;

    event newShill(uint id, uint timestamp, address indexed from, string emoji, string title);
    event newAllowance(uint id, uint timestamp, address indexed from, string emoji, string title, string body);

    address public owner;
    uint public totalShills;
    
    uint public shillCost = 0 ether;
    uint public viewCost = 0 ether;
    uint public usernameCost = 0 ether;

    mapping (address => string) public usernames;
    mapping (address => uint[]) public allowedShills;
    mapping (address => uint) public upvotes;
    mapping (address => uint) public downvotes;
    mapping (address => uint) public lastShilledAt;

    // FUNCTIONS

    constructor() payable {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function shill(string memory _emoji, string memory _title, string memory _body) public payable {
        require(msg.value >= shillCost, "Please provide more funds.");
        require(lastShilledAt[msg.sender] + 1 minutes < block.timestamp, "Please wait 5 min before submitting another shill.");
        address[] memory voters;
        shills.push(Shill(totalShills, block.timestamp, msg.sender, _emoji, _title, _body, voters));
        emit newShill(totalShills, block.timestamp, msg.sender, _emoji, _title);  
        totalShills++;
        lastShilledAt[msg.sender] = block.timestamp;
    }

    function viewShill(uint _shillId) public payable {
        require(msg.value >= viewCost);
        allowedShills[msg.sender].push(_shillId);
        emit newAllowance(_shillId, block.timestamp, shills[_shillId].shiller, shills[_shillId].emoji, shills[_shillId].title, shills[_shillId].body);
    }

    function upvote(uint _shillId) public {
        upvotes[shills[_shillId].shiller]++;
        shills[_shillId].voters.push(msg.sender);
        uint rand = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, totalShills))) % 100;
        if (rand >= 50) {
            (bool success, ) = (msg.sender).call{value: address(this).balance / 10}("");
            require(success, "Failed to withdraw money from contract.");
        }
    }

    function downvote(uint _shillId) public {
        downvotes[shills[_shillId].shiller]++;
        shills[_shillId].voters.push(msg.sender);
        uint rand = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, totalShills))) % 100;
        if (rand >= 50) {
            (bool success, ) = (msg.sender).call{value: address(this).balance / 10}("");
            require(success, "Failed to withdraw money from contract.");
        }
    }

    function getRating(address _from) public view returns (int) {
        if ((upvotes[_from] == 0) && (downvotes[_from] == 0)) return -1;
        return int(upvotes[_from] * 100 / (upvotes[_from] + downvotes[_from]));
    }

    function getAllShills() public view returns(Shill[] memory) {
        return shills;
    }

    function getAllowedShills() public view returns(Shill[] memory) {
        uint size = allowedShills[msg.sender].length;
        Shill[] memory allowed = new Shill[](size);
        for (uint i = 0; i < size; i++) {
            allowed[i] = shills[allowedShills[msg.sender][i]];
        }
        return allowed;
    }

    // function getShillsFrom(address _from) public view returns(Shill[] memory) {
    //     Shill[] memory shillsFrom;
    //     for (uint i = 0; i < shills.length; i++) {
    //         if (shills[i].shiller == _from) {
    //             shillsFrom.push(shills[i]);
    //         }
    //     }
    //     return shillsFrom;
    // }

    function changeUsername(string memory _username) public payable {
        require(msg.value >= usernameCost);
        usernames[msg.sender] = _username;
    }

    function setShillCost(uint _shillCost) public onlyOwner {
        shillCost = _shillCost;
    }

    function setViewCost(uint _viewCost) public onlyOwner {
        viewCost = _viewCost;
    }

    function setUsernameCost(uint _usernameCost) public onlyOwner {
        usernameCost = _usernameCost;
    }

    function withdraw() public payable onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

}