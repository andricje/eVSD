import { AddressLike, parseUnits } from "ethers";
import hardhat from "hardhat";
import { config } from "../evsd.config";
import assert from "assert";
const addressesToSkip = [
  "0x84f52e7Ed5Efc7cb6C6Ee6b25230bEb37e97079B",
  "0x84f52e7Ed5Efc7cb6C6Ee6b25230bEb37e97079B",
  "0x30389b29739b69aD9ceaeb31c9875e6ed5F1473C",
  "0x30389b29739b69aD9ceaeb31c9875e6ed5F1473C",
  "0x0b7BF92fCfD2C9EbB4B3b0ec9819DC2A53D2e849",
  "0x0b7BF92fCfD2C9EbB4B3b0ec9819DC2A53D2e849",
  "0xd98DA6b5dedF7059D90Cf846c5F3153506e230b6",
  "0xd98DA6b5dedF7059D90Cf846c5F3153506e230b6",
  "0x97f4Cf7F7896Eba8cfd03D0Ce0F31D17fbe3AFAD",
  "0x97f4Cf7F7896Eba8cfd03D0Ce0F31D17fbe3AFAD",
  "0xF6f42f4a5Fa685773c0c2c720E963cF61387D611",
  "0xF6f42f4a5Fa685773c0c2c720E963cF61387D611",
  "0xd0eC0D56228f122B430F55bdfCad89144465567B",
  "0xd0eC0D56228f122B430F55bdfCad89144465567B",
  "0x6AD7B33C2a37b59e025E8aE35FFdb6e57915D051",
  "0x6AD7B33C2a37b59e025E8aE35FFdb6e57915D051",
  "0xD7f280335D6c05CDEDA6dCF673fc0F74B60F46D4",
  "0xD7f280335D6c05CDEDA6dCF673fc0F74B60F46D4",
  "0x1F7efF906B11E8704D1b5475a52C38F875003600",
  "0x1F7efF906B11E8704D1b5475a52C38F875003600",
  "0xe6Ef94d3080a7115b9d9b6a4745efB18f7357FFB",
  "0xe6Ef94d3080a7115b9d9b6a4745efB18f7357FFB",
  "0xEF103CB7eF43717Bc27A66783A3841C34c45058A",
  "0xEF103CB7eF43717Bc27A66783A3841C34c45058A",
  "0x33cCc89a77b4D180D758CE9A506F9BD9dD698AcE",
  "0x33cCc89a77b4D180D758CE9A506F9BD9dD698AcE",
  "0xB9aBb3eeA4978C7e6b947671957AFf6B86A26016",
  "0xB9aBb3eeA4978C7e6b947671957AFf6B86A26016",
  "0xcD846F312AB9a8EfEE0e974aBE37FeFF031010Ca",
  "0xcD846F312AB9a8EfEE0e974aBE37FeFF031010Ca",
  "0x25d748378ebC6350396bAee5109eDb0dD88311B7",
  "0x25d748378ebC6350396bAee5109eDb0dD88311B7",
  "0x3340876d76F53D527997F3d79dF216E75B908Cee",
  "0x3340876d76F53D527997F3d79dF216E75B908Cee",
  "0x91a6c4aE8A8D3Ca2fDAf965a7ea54090098011f8",
  "0x91a6c4aE8A8D3Ca2fDAf965a7ea54090098011f8",
  "0x8F76523054606e44753b88ee12699A1913c4817a",
  "0x8F76523054606e44753b88ee12699A1913c4817a",
  "0xe636E286FFdA2C22f85d3D277317ADd55183d6ed",
  "0xe636E286FFdA2C22f85d3D277317ADd55183d6ed",
  "0xE6Cc392539785E3dDA236410412b1C7aaBE9D4De",
  "0xE6Cc392539785E3dDA236410412b1C7aaBE9D4De",
  "0x08d8Cbd5CEBFE7cAA579e337450748486C06d105",
  "0x08d8Cbd5CEBFE7cAA579e337450748486C06d105",
  "0xDb0F18cb30377Cf4C6EF171701ccEC9F317c8490",
  "0xDb0F18cb30377Cf4C6EF171701ccEC9F317c8490",
];
export async function fund(initialVoters: AddressLike[], ammount: number) {
  const [deployer] = await hardhat.ethers.getSigners();
  for (const address of initialVoters) {
    if (addressesToSkip.indexOf(`${address}`) >= 0) {
      continue;
    }
    try {
      const oldBalance = await deployer.provider.getBalance(address);
      const tx = await deployer.sendTransaction({
        to: address,
        value: parseUnits(ammount.toString(), "ether"),
      });
      await tx.wait();
      const newBalance = await deployer.provider.getBalance(address);
      console.log(`Address ${address} old balance: ${oldBalance}`);
      console.log(`Address ${address} new balance: ${newBalance}`);
    } catch (ex) {
      console.log(`Failed sending to address: ${address}`);
    }
  }
}
async function main() {
  assert(
    config.proposalService.type === "blockchain",
    "Invalid proposal service type in config"
  );
  const initialVoterAddresses =
    config.proposalService.network.initialUserList.map((v) => v.address);
  await fund(initialVoterAddresses, 0.00008354);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
