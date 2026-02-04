const hre = require("hardhat");

async function main() {
    console.log("Deploying FileStorage contract...");

    const FileStorage = await hre.ethers.getContractFactory("FileStorage");
    const fileStorage = await FileStorage.deploy();

    await fileStorage.waitForDeployment();

    const address = await fileStorage.getAddress();
    console.log(`FileStorage deployed to: ${address}`);
    console.log(`\nUpdate your client/.env with:\nVITE_CONTRACT_ADDRESS=${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
