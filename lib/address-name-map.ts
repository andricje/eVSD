export const addressNameMap: Record<string, string> = {
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "Deployer",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "Fakultet 1",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": "Fakultet 2",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906": "Fakultet 3",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65": "Fakultet 4",
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc": "Fakultet 5",
  "0x976EA74026E726554dB657fA54763abd0C3a0aa9": "Fakultet 6",
};

// Funkcija za ažuriranje mapiranja adresa i imena fakulteta
export function updateAddressNameMap(address: string, facultyName: string): void {
  // Dodajemo novu adresu u mapiranje
  if (typeof window !== 'undefined') {
    // Čitamo postojeću mapu iz localStorage ako postoji
    const storedMap = localStorage.getItem('addressNameMap');
    let updatedMap = { ...addressNameMap };
    
    if (storedMap) {
      try {
        updatedMap = { ...updatedMap, ...JSON.parse(storedMap) };
      } catch (error) {
        console.error("Greška pri čitanju iz localStorage:", error);
      }
    }
    
    // Dodajemo ili ažuriramo adresu
    updatedMap[address] = facultyName;
    
    // Čuvamo ažuriranu mapu u localStorage
    localStorage.setItem('addressNameMap', JSON.stringify(updatedMap));
    
    console.log(`Ažurirana mapa adresa: ${address} -> ${facultyName}`);
  }
}

// Funkcija za dobijanje ažurirane mape adresa
export function getAddressNameMap(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const storedMap = localStorage.getItem('addressNameMap');
    if (storedMap) {
      try {
        return { ...addressNameMap, ...JSON.parse(storedMap) };
      } catch (error) {
        console.error("Greška pri čitanju iz localStorage:", error);
      }
    }
  }
  return { ...addressNameMap };
}
