import { ethers } from "hardhat";
import { Announcements__factory } from "../typechain-types";
import announcementsArtifacts from "../contracts/evsd-announcements.json";

async function main() {
  const signers = await ethers.getSigners();
  const announcements = Announcements__factory.connect(
    announcementsArtifacts.address, 
    signers[0]
  );
  
  // Провера ко је тренутни власник
  const currentOwner = await announcements.owner();
  const yourAddress = await signers[0].getAddress();
  
  console.log("Тренутни власник уговора за обраћања:", currentOwner);
  console.log("Ваша адреса:", yourAddress);
  
  if (currentOwner.toLowerCase() === yourAddress.toLowerCase()) {
    console.log("Вашa адреса је већ власник уговора!");
  } else {
    console.log("Ваша адреса НИЈЕ власник уговора. Потребно је пренети власништво.");
    
    // Тражимо сигнера који је власник
    let ownerSigner = signers[0]; // претпостављамо да је први сигнер власник
    
    for (const signer of signers) {
      const address = await signer.getAddress();
      if (address.toLowerCase() === currentOwner.toLowerCase()) {
        ownerSigner = signer;
        console.log("Пронађен сигнер који је власник:", address);
        break;
      }
    }
    
    try {
      // Повезивање са уговором користећи власника
      const announcementsAsOwner = announcements.connect(ownerSigner);
      console.log("Преношење власништва на вашу адресу...");
      
      // Позивамо трансфер власништва
      const tx = await announcementsAsOwner.transferOwnership(yourAddress);
      await tx.wait();
      
      console.log("Власништво успешно пренесено!");
      console.log("Нови власник је:", await announcements.owner());
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