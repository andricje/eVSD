import { ethers } from "hardhat";
import { EvsdToken__factory } from "../typechain-types";
import tokenArtifacts from "../contracts/evsd-token.json";

const ONE_TOKEN = ethers.parseUnits("1", 18);

async function main() {
  // Узимамо први доступан налог (deployer)
  const [deployer] = await ethers.getSigners();
  
  // Специфична адреса на коју шаљемо токене
  const targetAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log("Пребацујем токене са налога:", await deployer.getAddress());
  console.log("На адресу:", targetAddress);
  
  // Повезујемо се са токен уговором
  const token = EvsdToken__factory.connect(tokenArtifacts.address, deployer);
  
  // Проверавамо колико токена има циљани корисник
  const initialBalance = await token.balanceOf(targetAddress);
  console.log(`Почетно стање циљане адресе: ${ethers.formatUnits(initialBalance, 18)} токена`);
  
  // Шаљемо токене 
  console.log(`Шаљем ${ethers.formatUnits(ONE_TOKEN, 18)} токена на адресу ${targetAddress}...`);
  const tx = await token.transfer(targetAddress, ONE_TOKEN);
  console.log(`Трансакција: ${tx.hash}`);
  await tx.wait();
  console.log("Трансакција потврђена");
  
  // Проверавамо ново стање
  const newBalance = await token.balanceOf(targetAddress);
  console.log(`Ново стање циљане адресе: ${ethers.formatUnits(newBalance, 18)} токена`);
  
  console.log("Токени успешно пребачени!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 