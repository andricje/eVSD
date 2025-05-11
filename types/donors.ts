export interface Donor {
  id: bigint;
  walletAddress: string;
  name: string | null;
  avatar: string | null;
  color: string | null;
  countryCode: string | null;
  anonymous: boolean;
  avatarApproved: boolean;
}

export interface Donation {
  id: bigint;
  donor: Donor;
  dateTime: Date;
  amount: number;
}

export const testDonors: Donor[] = [
  {
    id: 1n,
    walletAddress: "0xabc123...",
    name: "Miloš Petrović",
    avatar:
      "https://media.istockphoto.com/id/1395838909/photo/portrait-of-young-caucasian-men-in-office-school-environment.jpg?s=612x612&w=0&k=20&c=Io5Yro7pVGiLEG4_VF69_8zPWpTI7wieZL8fWrVTHjs=",
    color: "bg-green-400",
    countryCode: "rs",
    anonymous: false,
    avatarApproved: true,
  },
  {
    id: 2n,
    walletAddress: "0xdef456...",
    name: null,
    avatar: null,
    color: null,
    countryCode: "rs",
    anonymous: true,
    avatarApproved: false,
  },
  {
    id: 3n,
    walletAddress: "0x789ghi...",
    name: "Ana Kovač",
    avatar: null,
    color: "bg-orange-400",
    countryCode: "rs",
    anonymous: false,
    avatarApproved: false,
  },
  {
    id: 4n,
    walletAddress: "0xjkl012...",
    name: "Dragan Ilić",
    avatar:
      "https://media.istockphoto.com/id/1444077739/photo/college-study-and-education-student-man-portrait-with-back-to-school-backpack-and-portfolio.jpg?s=612x612&w=0&k=20&c=PAQmqKzYd3OiKhlfrT1DVMQNkGu-drX4rtJ5p6y7D8c=",
    color: "bg-yellow-400",
    countryCode: "me",
    anonymous: false,
    avatarApproved: false,
  },
  {
    id: 5n,
    walletAddress: "0xlmn345...",
    name: null,
    avatar: null,
    color: null,
    countryCode: "rs",
    anonymous: true,
    avatarApproved: false,
  },
  {
    id: 6n,
    walletAddress: "0xopq678...",
    name: "Sara Nikolić",
    avatar:
      "https://media.istockphoto.com/id/1398385367/photo/happy-millennial-business-woman-in-glasses-posing-with-hands-folded.jpg?s=612x612&w=0&k=20&c=Wd2vTDd6tJ5SeEY-aw0WL0bew8TAkyUGVvNQRj3oJFw=",
    color: "#4caf50",
    countryCode: "rs",
    anonymous: false,
    avatarApproved: true,
  },
  {
    id: 7n,
    walletAddress: "0xrst901...",
    name: "Petar Petrović",
    avatar: null,
    color: "bg-green-400",
    countryCode: "rs",
    anonymous: false,
    avatarApproved: false,
  },
  {
    id: 8n,
    walletAddress: "0xuvw234...",
    name: null,
    avatar: null,
    color: null,
    countryCode: "rs",
    anonymous: true,
    avatarApproved: false,
  },
  {
    id: 9n,
    walletAddress: "0xxyz567...",
    name: "Ivana Šarić",
    avatar:
      "https://media.istockphoto.com/id/1289220781/photo/portrait-of-happy-smiling-woman-at-desk.jpg?s=612x612&w=0&k=20&c=FtC05luuxRpiKRj5F84e2CiPf0h_ZuX6o7o5JwlNaJM=",
    color: "bg-red-400",
    countryCode: "rs",
    anonymous: false,
    avatarApproved: true,
  },
  {
    id: 10n,
    walletAddress: "0x000999...",
    name: "Nenad Božić",
    avatar: null,
    color: "bg-blue-400",
    countryCode: "rs",
    anonymous: false,
    avatarApproved: false,
  },
];

export const testDonations: Donation[] = testDonors.map((donor, index) => ({
  id: BigInt(index + 1),
  donor,
  dateTime: new Date(Date.now() - index * 86400000),
  amount: Math.random() * 0.1,
}));
