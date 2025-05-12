import { ethers } from "hardhat";
import { EvsdGovernor__factory, Announcements__factory } from "../typechain-types";
import governorArtifacts from "../contracts/evsd-governor.json";
import announcementsArtifacts from "../contracts/evsd-announcements.json";

// Funkcija za proveru trenutnog vlasnika ugovora
async function checkCurrentOwners() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Повезани налог:", await deployer.getAddress());
  
  const governor = EvsdGovernor__factory.connect(governorArtifacts.address, deployer);
  const announcements = Announcements__factory.connect(announcementsArtifacts.address, deployer);
  
  console.log("\n Тренутни власници уговора:");
  console.log("----------------------------------------------");
  console.log(`EvsdGovernor: ${await governor.owner()}`);
  console.log(`Announcements: ${await announcements.owner()}`);
  console.log("----------------------------------------------");
  console.log("Напомена: EvsdToken не подржава функцију власништва.");
}

// Funkcija za transferovanje vlasništva nad određenim ugovorom
async function transferOwnership(contractName: string, newOwnerAddress: string) {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🔄 Пренос власништва над уговором ${contractName} на адресу: ${newOwnerAddress}`);
  
  try {
    switch (contractName.toLowerCase()) {
      case "governor":
        const governor = EvsdGovernor__factory.connect(governorArtifacts.address, deployer);
        const currentGovernorOwner = await governor.owner();
        
        if (currentGovernorOwner.toLowerCase() !== deployer.address.toLowerCase()) {
          console.error("❌ Тренутни налог није власник уговора EvsdGovernor!");
          return;
        }
        
        console.log("Пренос власништва у току...");
        const txGovernor = await governor.transferOwnership(newOwnerAddress);
        await txGovernor.wait();
        console.log(" Власништво над EvsdGovernor успешно пренесено!");
        break;
        
      case "announcements":
        const announcements = Announcements__factory.connect(announcementsArtifacts.address, deployer);
        const currentAnnouncementsOwner = await announcements.owner();
        
        if (currentAnnouncementsOwner.toLowerCase() !== deployer.address.toLowerCase()) {
          console.error(" Тренутни налог није власник уговора Announcements!");
          return;
        }
        
        console.log("Пренос власништва у току...");
        const txAnnouncements = await announcements.transferOwnership(newOwnerAddress);
        await txAnnouncements.wait();
        console.log(" Власништво над Announcements успешно пренесено!");
        break;
        
      case "all":
        // Преносимо власништво на свим уговорима који подржавају функцију власништва
        console.log("Пренос власништва над свим уговорима који подржавају функцију власништва...");
        
        // Проверавамо да ли је тренутни корисник власник свих уговора
        const govOwner = await EvsdGovernor__factory.connect(governorArtifacts.address, deployer).owner();
        const annOwner = await Announcements__factory.connect(announcementsArtifacts.address, deployer).owner();
        
        if (govOwner.toLowerCase() !== deployer.address.toLowerCase() ||
            annOwner.toLowerCase() !== deployer.address.toLowerCase()) {
          console.error(" Тренутни налог није власник свих уговора!");
          return;
        }
        
        // Преносимо власништво на свим уговорима
        const txGov = await EvsdGovernor__factory.connect(governorArtifacts.address, deployer).transferOwnership(newOwnerAddress);
        await txGov.wait();
        console.log(" Власништво над EvsdGovernor успешно пренесено!");
        
        const txAnn = await Announcements__factory.connect(announcementsArtifacts.address, deployer).transferOwnership(newOwnerAddress);
        await txAnn.wait();
        console.log("Власништво над Announcements успешно пренесено!");
        break;
        
      case "token":
        console.error("EvsdToken не подржава функцију власништва и не може се пренети!");
        break;
        
      default:
        console.error(`Непознат уговор: ${contractName}`);
        console.log("Подржани уговори: governor, announcements, all");
    }
  } catch (error) {
    console.error(`Грешка при преносу власништва:`, error);
  }
}

async function main() {
  // Команда се чита из аргумената командне линије
  const args = process.argv.slice(2);
  const command = args[0] || "check";
  
  if (command === "check") {
    await checkCurrentOwners();
    return;
  }
  
  if (command === "transfer") {
    const contractName = args[1];
    const newOwnerAddress = args[2];
    
    if (!contractName || !newOwnerAddress) {
      console.error(" Мора се навести име уговора и нова адреса власника!");
      console.log("Пример: npx hardhat run scripts/transfer-ownership.ts transfer governor 0x123...");
      console.log("Подржане опције за уговор: governor, announcements, all");
      return;
    }
    
    await transferOwnership(contractName, newOwnerAddress);
    return;
  }
  
  console.error(`Непозната команда: ${command}`);
  console.log("Подржане команде: check, transfer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 