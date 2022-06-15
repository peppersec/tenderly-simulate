const dotenv = require("dotenv");
const axios = require("axios");
const ethers = require("ethers");

dotenv.config(); // load environment variables using dotenv

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = process.env;

const SIMULATE_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`;
const TENDERLY_FORK_API = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;
const TENDERLY_FORK_DELETE = `https://api.tenderly.co/api/v2/project/${TENDERLY_PROJECT}/forks`;

const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const DAI_ABI = require("./abis/ERC20.json");
const MUL_ADDRESS = "0xA5025FABA6E70B84F74e9b1113e5F7F4E7f4859f";
const MUL_ABI = require("./abis/Multisender.json");
const CLIENT_ADDRESS = "0x03Ebd0748Aa4D1457cF479cce56309641e0a98F5";

const opts = {
  headers: {
    "X-Access-Key": TENDERLY_ACCESS_KEY,
  },
};

const body = {
  network_id: "1",
  block_number: 14963626,
};

const recipients = [
  {
    recipient: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    balance: ethers.utils.parseEther("5"),
  },
  {
    recipient: "0x3D1afa7B718Fb893Db30A3abc0CFC608AaCfEBb0",
    balance: ethers.utils.parseEther("5"),
  },
];

async function main() {
  const resp = await axios.post(TENDERLY_FORK_API, body, opts);
  const forkId = resp.data.simulation_fork.id;
  console.log("forkId", forkId);
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;

  const provider = new ethers.providers.JsonRpcProvider(forkRPC);

  // You don't need to impersonate the address to use it!
  const signer = provider.getSigner(CLIENT_ADDRESS);

  const daiContract = new ethers.Contract(DAI_ADDRESS, DAI_ABI, signer);
  const mulContract = new ethers.Contract(MUL_ADDRESS, MUL_ABI, signer);

  await daiContract.approve(
    mulContract.address,
    ethers.utils.parseEther("1000000")
  );
  const tx = await mulContract.multisendToken(
    daiContract.address,
    recipients,
    ethers.utils.parseEther("10"),
    "0x0000000000000000000000000000000000000000"
  );

  const receipt = await tx.wait();
  console.log(
    `The multisend will require ${receipt.gasUsed} gas, which is around N ETH`
  );

  await axios.delete(`${TENDERLY_FORK_DELETE}/${forkId}`, opts);
}

main();
