import { ethers } from "hardhat";
import { Announcements, Announcements__factory } from "../typechain-types";
import announcementsArtifacts from "../contracts/evsd-announcements.json";
import { formatDate } from "../lib/utils";

// Funkcija za listanje svih aktivnih obaveštenja
async function listActiveAnnouncements(announcements: Announcements) {
  console.log("\nАктивна обавештења:");
  console.log("---------------------------------------------");
  
  const activeAnnouncements = await announcements.getActiveAnnouncements();
  
  if (activeAnnouncements.length === 0) {
    console.log(" Нема активних обавештења.");
    return;
  }
  
  for (let i = 0; i < activeAnnouncements.length; i++) {
    const { content, announcer, timestamp, isActive } = activeAnnouncements[i];
    const date = new Date(Number(timestamp) * 1000);
    
    console.log(`[${i + 1}] Од: ${announcer}`);
    console.log(`    Датум: ${formatDate(date)}`);
    console.log(`    Садржај: ${content}`);
    console.log(`    Статус: ${isActive ? "активно" : "неактивно"}`);
    console.log("---------------------------------------------");
  }
}

// Funkcija za kreiranje novog obaveštenja
async function createNewAnnouncement(announcements: Announcements, content: string) {
  console.log(`\n Креирање новог обавештења: "${content}"`);
  
  try {
    const tx = await announcements.createAnnouncement(content);
    await tx.wait();
    console.log(" Обавештење је успешно креирано!");
  } catch (error) {
    console.error("Грешка при креирању обавештења:", error);
  }
}

// Funkcija za deaktiviranje obaveštenja po indeksu
async function deactivateAnnouncementByIndex(announcements: Announcements, index: number) {
  console.log(`\n🗑️ Деактивирање обавештења са индексом: ${index}`);
  
  try {
    // Ovde moramo dobiti stvarni ID obaveštenja
    // Pošto nemamo direktan pristup ID-u preko strukture, moramo ga dobiti indirektno
    
    // Prvo ćemo dobiti broj ukupnih obaveštenja
    const counter = await announcements.announcementCounter();
    
    // Sada prolazimo kroz obaveštenja i tražimo aktivno obaveštenje sa traženim indeksom
    let currentActiveIndex = 0;
    let targetId = 0;
    
    for (let i = 1; i <= Number(counter); i++) {
      const announcement = await announcements.announcements(i);
      if (announcement.isActive) {
        if (currentActiveIndex === index) {
          targetId = i;
          break;
        }
        currentActiveIndex++;
      }
    }
    
    if (targetId === 0) {
      console.error(" Невалидан индекс обавештења!");
      return;
    }
    
    // Deaktiviramo obaveštenje
    console.log(`Деактивирање обавештења са ID-ом: ${targetId}`);
    const tx = await announcements.deactivateAnnouncement(targetId);
    await tx.wait();
    console.log("Обавештење је успешно деактивирано!");
  } catch (error) {
    console.error("Грешка при деактивирању обавештења:", error);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Повезивање са Announcements уговором...");
  const announcements = Announcements__factory.connect(
    announcementsArtifacts.address,
    deployer
  );
  
  console.log("Тренутни власник:", await announcements.owner());
  console.log("Повезани налог:", await deployer.getAddress());
  
  // Команда се чита из аргумената командне линије
  const args = process.argv.slice(2);
  const command = args[0] || "list";
  
  switch (command) {
    case "list":
      await listActiveAnnouncements(announcements);
      break;
      
    case "create":
      const content = args[1];
      if (!content) {
        console.error(" Морате навести садржај обавештења!");
        console.log("Пример: npx hardhat run scripts/manage-announcements.ts create \"Ваше обавештење\"");
        process.exit(1);
      }
      await createNewAnnouncement(announcements, content);
      break;
      
    case "deactivate":
      const indexStr = args[1];
      if (!indexStr) {
        console.error(" Морате навести индекс обавештења за деактивирање!");
        console.log("Пример: npx hardhat run scripts/manage-announcements.ts deactivate 1");
        process.exit(1);
      }
      const index = parseInt(indexStr) - 1; // Корисници почињу бројање од 1
      await deactivateAnnouncementByIndex(announcements, index);
      break;
      
    default:
      console.error(`Непозната команда: ${command}`);
      console.log("Подржане команде: list, create, deactivate");
      process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 