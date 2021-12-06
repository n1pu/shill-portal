const main = async () => {
    const [owner, randomPerson] = await hre.ethers.getSigners();
    const shillContractFactory = await hre.ethers.getContractFactory('ShillPortal');
    const shillContract = await shillContractFactory.deploy({
      value: hre.ethers.utils.parseEther("1")
    });
    await shillContract.deployed();
    console.log("Contract deployed to:", shillContract.address);

    await shillContract.connect(randomPerson).shill("🚀", "Prochain top 10", "$EGLD to the mooooooooooooooooon!");
    await shillContract.connect(randomPerson).shill("🚀", "Prochain top 10", "$EGLD to the mooooooooooooooooon!");

  };
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();