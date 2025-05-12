import { ethers } from "hardhat";
import { Announcements__factory } from "../typechain-types";
import announcementsArtifacts from "../contracts/evsd-announcements.json";

async function main() {
  const signers = await ethers.getSigners();
  const announcements = Announcements__factory.connect(
    announcementsArtifacts.address, 
    signers[0]
  );
  
  // Адреса корисничког MetaMask новчаника
  const userMetaMaskAddress = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"; 
  
  // Провера ко је тренутни власник
  const currentOwner = await announcements.owner();
  console.log("Тренутни власник уговора за обраћања:", currentOwner);
  
  if (currentOwner.toLowerCase() === userMetaMaskAddress.toLowerCase()) {
    console.log("MetaMask адреса је већ власник уговора!");
  } else {
    try {
      // Преносимо власништво на MetaMask адресу
      console.log(`Преношење власништва на адресу: ${userMetaMaskAddress}...`);
      const tx = await announcements.transferOwnership(userMetaMaskAddress);
      await tx.wait();
      
      // Проверавамо ко је нови власник
      const newOwner = await announcements.owner();
      console.log("Власништво успешно пренесено!");
      console.log("Нови власник је:", newOwner);
      
      if (newOwner.toLowerCase() === userMetaMaskAddress.toLowerCase()) {
        console.log("УСПЕШНО: MetaMask адреса је сада власник.");
      } else {
        console.log("ГРЕШКА: Пренос власништва није успео.");
      }
    } catch (error) {
      console.error("Грешка при преношењу власништва:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 