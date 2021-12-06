import React, { useEffect, useState } from "react";
import Picker from 'emoji-picker-react';
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/ShillPortal.json";
import loiseau from "./utils/loiseau2.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';

const App = () => {
  const [chosenEmoji, setChosenEmoji] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const onEmojiClick = (event, emojiObject) => {
    setChosenEmoji(emojiObject.emoji);
    setShowPicker(false);
  };

  const refreshUI = async () => {
    getTotalShills();
    getAllShills();
    getAllowedShills();
  }

  const [currentAccount, setCurrentAccount] = useState("");
  const [username, setUsername] = useState("");
  const [allShills, setAllShills] = useState([]);
  const [allowedShills, setAllowedShills] = useState([]);
  const [shillCount, setShillCount] = useState(0);
  const avatarURL = `https://avatars.dicebear.com/api/micah/${currentAccount}.svg`;

  const contractAddress = "0xf86B96D8a17F9e571a4903469482b67E22582c91";
  const contractABI = abi.abi;

  const baseFunction = () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const shillPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      return shillPortalContract;
    }
  }
  
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length !== 0) {
        setCurrentAccount(accounts[0]);
        getUsername(accounts[0]);
        refreshUI();
      } else connectWallet();
    }
  }


  const connectWallet = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("Get MetaMask!");
      return;
    }
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    setCurrentAccount(accounts[0]);
    refreshUI();
  }

  const shill = async () => {
    const shillPortalContract = await baseFunction();
    const cost = await shillPortalContract.shillCost();
    const shillTxn = await shillPortalContract.shill(chosenEmoji,
    document.querySelector(".shillTitle").value, document.querySelector(".shillMessage").value, {value: cost, gasLimit: 300000});
    await shillTxn.wait();

    getTotalShills();
    document.querySelector(".shillTitle").value = "";
    document.querySelector(".shillMessage").value = "";
    setChosenEmoji(null);
  }

  const view = async (id) => {
    const shillPortalContract = baseFunction();
    const cost = await shillPortalContract.viewCost();
    const viewTxn = await shillPortalContract.viewShill(id.toNumber(), {value: cost});
    await viewTxn.wait();
  }

  const getAllShills = async () => {
    const shillPortalContract = baseFunction();
    const shills = await shillPortalContract.getAllShills();
    let shillsCleaned = [];
    for (let shill of shills) {
      let date = new Date(shill.timestamp * 1000);
      let rating = await shillPortalContract.getRating(shill.shiller);
      let username = await shillPortalContract.usernames(shill.shiller);

      if (username === "") username = shill.shiller;
      else username = `@${username} (${shill.shiller})`;
      if (rating.toNumber() !== -1) username += ` ${rating}%`;

      shillsCleaned.unshift({
        id: shill.id,
        timestamp: `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`,
        shiller: username,
        emoji: shill.emoji,
        title: shill.title,
        voters: shill.voters
      });
    }
    setAllShills(shillsCleaned);
  }

  const getAllowedShills = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const shillPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      const shills = await shillPortalContract.getAllowedShills();

      let shillsCleaned = [];
      shills.forEach(shill => {
        let date = new Date(shill.timestamp * 1000);
        let dateCleaned = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
        shillsCleaned.unshift({
          id: shill.id,
          timestamp: dateCleaned,
          shiller: shill.shiller,
          emoji: shill.emoji,
          title: shill.title,
          message: shill.body
        });
      });

      setAllowedShills(shillsCleaned);
    }
  }

  const getTotalShills = async () => {
    const shillPortalContract = baseFunction();
    let count = await shillPortalContract.totalShills();
    setShillCount(count.toNumber());
  }

  const getUsername = async (address) => {
    const shillPortalContract = baseFunction();
    let name = await shillPortalContract.usernames(address);
    setUsername(name); 
  }

  const changeUsername = async () => {
    const shillPortalContract = baseFunction();
    const cost = await shillPortalContract.usernameCost();
    let setTxn = await shillPortalContract.changeUsername(document.querySelector(".usernameInput").value, {value: cost});
    await setTxn.wait();
    // refreshUI();
  }

  const upvote = async (event) => {
    const shillPortalContract = baseFunction();
    let id = event.target.value;
    let voters = allShills[id].voters;
    let hasVoted = voters.some(voter => {
      return voter.toLowerCase() === currentAccount.toLowerCase();
    });
    if (hasVoted === false) {
      let voteTxn = await shillPortalContract.upvote(id);
      await voteTxn.wait();
    }
    refreshUI();
  }

  const downvote = async (event) => {
    const shillPortalContract = baseFunction();
    let id = event.target.value;
    let voters = allShills[id].voters;
    let hasVoted = voters.some(voter => {
      return voter.toLowerCase() === currentAccount.toLowerCase();
    });
    if (hasVoted === false) {
      let voteTxn = await shillPortalContract.downvote(id);
      await voteTxn.wait();
    }
    refreshUI();
  } 

  useEffect(() => {
    checkIfWalletIsConnected();
    const shillPortalContract = baseFunction();

    const onNewShill = (id, timestamp, from, emoji, title) => {
      let date = new Date(timestamp * 1000);
      setAllShills(prevState => [
        {
          id: id,
          timestamp: `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`,
          shiller: from,
          emoji: emoji,
          title: title,
          voters: []
        },
        ...prevState        
      ]);
    }

    const onNewAllowance = (id, timestamp, from, emoji, title, body) => {
      let date = new Date(timestamp * 1000);
      setAllowedShills(prevState => [
        {
          id: id,
          timestamp: `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`,
          shiller: from,
          emoji: emoji,
          title: title,
          message: body,
          voters: []
        },
        ...prevState
      ]);
    }

    shillPortalContract.on('newShill', onNewShill);
    shillPortalContract.on('newAllowance', onNewAllowance);

    return () => {
      if (shillPortalContract) {
        shillPortalContract.off('newShill', onNewShill);
        shillPortalContract.off('newAllowance', onNewAllowance);
      }
    };
  }, []);
  
  return (
    <div className="mainContainer">
      {currentAccount && <div className="user">
        <img src={avatarURL} alt="avatar" className="userAvatar"/>
        <span>{username}</span>

        <div className="userAddress">
          {currentAccount.substring(0, 5)}...{currentAccount.substring(38, 42)}
        </div>
      </div>}

      {!currentAccount && <button className="connectWallet" onClick={connectWallet}>Connect wallet</button>}
      
      <div className="dataContainer">
        <div className="landing">
          <div className="header">
            <span className="spanEmoji" role="img" aria-label="rocket">🚀</span> Shill Portal
          </div>

          <div className="description">
            Looking for some extra $$$?
            <br></br>
            Shill Portal is THE place where greedy investors can meet talented shillers. We, as a community, have one aim: the moooon!
          </div>

          <a href="#allShills" className="shillCounter"> 
            {shillCount} shilled projects 🚀
          </a>

          <img src={loiseau} />
        </div>

        <div className="shillForm">
          <h1>Shill a project</h1>
          <div className="shillInput">
            <input type="text" placeholder="Say something catchy!" className="shillTitle" maxLength="20">
            </input>
            {!showPicker && <button className="chooseEmoji" onClick={() => setShowPicker(val => !val)}> {chosenEmoji ? chosenEmoji : "☺"}</button>}
          </div>
          {!showPicker && <textarea rows={3} maxLength="50" placeholder="Detail your shill..." className="shillMessage"></textarea>}

          {showPicker && <Picker onEmojiClick={onEmojiClick} disableSkinTonePicker="true" pickerStyle={{}}/>}
          
          <button className="shillButton" disabled={!chosenEmoji} onClick={shill}>
            {chosenEmoji ? "Publish" : "Please select an emoji first"}
          </button>
        </div>

        <h1>Your shills</h1>

        {allowedShills.map(
          (shill, index) => {
            return (
              <div className="shill" key={index}>
                <div className="shiller">{shill.shiller}</div>
                <div className="timestamp">{shill.timestamp.toString()}</div>
                <div className="emoji">{shill.emoji}</div>
                <div className="title">{shill.title}</div>
                <div className="message">{shill.message}</div>
                <div className="votes">
                  <button className="vote" value={shill.id} onClick={upvote}>
                    <FontAwesomeIcon icon={faAngleUp} size="lg" />
                  </button>
                  <button className="vote" value={shill.id} onClick={downvote}>
                    <FontAwesomeIcon icon={faAngleDown} size="lg"/>
                  </button>
                </div>
              </div>
            )
          }
        )}

        <div id="allShills">
          <h1>Recent shills</h1>

          {allShills.map(
            (shill, index) => {
              return (
                <div className="shill" key={index}>
                  <div className="shiller">{shill.shiller}</div>
                  <div className="shillInfo">
                    <div className="emojiAndEmoji">{shill.emoji} {shill.title}</div>
                    <div className="timestamp">{shill.timestamp.toString()}</div>
                  </div>
                  <button onClick={() => view(shill.id)}>Access</button>
                </div>
              )
            }
          )}
        </div>


        <div className="username">
          <h1>Change username</h1>
          <input type="text" placeholder="Your new username" className="usernameInput"/>
          <br />
          <button className="usernameButton" onClick={changeUsername}>
            Change
          </button>
        </div>

      </div>
    </div>
  );
}

export default App