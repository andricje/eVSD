import {
  EvsdGovernor,
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "../typechain-types";

import { Proposal, VoteOption } from "@/types/proposal";
import { Announcement } from "@/types/announcements";
import { BigNumberish, ethers, Signer } from "ethers";
import { convertAddressToName, governorVoteMap } from "./utils";

// Funkcija za kreiranje novog obraćanja (samo za vlasnike/administratore)
export async function createAnnouncement(
  signer: Signer,
  governor: EvsdGovernor,
  content: string
): Promise<string | null> {
  try {
    const tx = await governor.connect(signer).createAnnouncement(content);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Greška pri kreiranju obraćanja:", error);
    return null;
  }
}

// Funkcija za deaktiviranje obraćanja
export async function deactivateAnnouncement(
  signer: Signer,
  governor: EvsdGovernor,
  announcementId: string
): Promise<boolean> {
  try {
    const tx = await governor
      .connect(signer)
      .deactivateAnnouncement(announcementId);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Greška pri deaktiviranju obraćanja:", error);
    return false;
  }
}
