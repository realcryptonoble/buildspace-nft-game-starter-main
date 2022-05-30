import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import LoadingIndicator from '../LoadingIndicator';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';

const SelectCharacter = ({ setCharacterNFT }) => {
    const [characters, setCharacters] = useState([]);
    const [gameContract, setGameContract] = useState(null);
    const [mintingCharacter, setMintingCharacter] = useState(false);

    const mintCharacterNFTAction = async (characterId) => {
        try {
            if (gameContract) {
                setMintingCharacter(true);
                console.log("Minting character in progress...");

                const mintTxn = await gameContract.mintCharacterNFT(characterId);
                await mintTxn.wait();

                console.log("mintTxn:", mintTxn);
                setMintingCharacter(false);
            }
        } catch (error) {
            console.warn("MintCharacterAction Error:", error);
            setMintingCharacter(false);
        }
    };

    useEffect(() => {
        const { ethereum } = window;

        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const gameContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicGame.abi, signer);

            setGameContract(gameContract);
        } else {
            console.log('Ethereum object not found');
        }
    }, []);

    useEffect(() => {
        const getCharacters = async () => {
            try {
                console.log("Getting contract characters to mint");

                const charactersTxn = await gameContract.getAllDefaultCharacters();
                console.log('charactersTxn:', charactersTxn);

                const characters = charactersTxn.map((characterData) => transformCharacterData(characterData));

                setCharacters(characters);
            } catch (error) {
                console.log(error);
            }
        };

        const onCharacterMint = async (sender, tokenId, characterIndex) => {
            console.log(`CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}}`)

            if (gameContract) {
                const characterNFT = await gameContract.checkIfUserHasNFT();
                console.log("CharacterNFT: ", characterNFT);
                setCharacterNFT(transformCharacterData(characterNFT));
                alert(`Your NFT is all done -- see it here: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
            }
        };

        if (gameContract) {
            getCharacters();

            gameContract.on("CharacterNFTMinted", onCharacterMint);
        }

        return () => {
            if (gameContract) {
                gameContract.off("CharacterNFTMinted", onCharacterMint)
            }
        }
    }, [gameContract]);

    const renderCharacters = () =>
        characters.map((character, index) => (
            <div className='character-item' key={character.name}>
                <div className='name-container'>
                    <p>{character.name}</p>
                </div>
                <img src={character.imageURI} alt={character.name} />
                <button type="button"
                    className="character-mint-button"
                    onClick={() => mintCharacterNFTAction(index)}
                >
                    {`Mint ${character.name}`}
                </button>
            </div>
        ));

    return (
        <div className='select-character-container'>
            <h2>Mint Your Here. Choose wisely.</h2>
            {characters.length > 0 && (
                <div className='character-grid'>{renderCharacters()}</div>
            )}
            {mintingCharacter && (
                <div className="loading">
                    <div className="indicator">
                        <LoadingIndicator />
                        <p>Minting In Progress...</p>
                    </div>
                    <img
                        src="https://media3.giphy.com/media/3oEjI1erPMTMBFmNHi/giphy.gif?cid=ecf05e47pt9cpdp92rs7n3t38256tm03zxj303u8krp2c6sj&rid=giphy.gif&ct=g"
                        alt="Minting loading indicator"
                    />
                </div>
            )}
        </div>
    );
};

export default SelectCharacter;