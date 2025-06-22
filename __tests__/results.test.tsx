import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import RezultatiPage from "../app/rezultati/page";
import { useProposals } from "../hooks/use-proposals";
import { useWallet } from "../context/wallet-context";
import { useRouter } from "next/navigation";
import { Proposal } from "../types/proposal";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  window.HTMLElement.prototype.scrollIntoView = function () {};
});

// Mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../hooks/use-proposals", () => ({
  useProposals: jest.fn(),
}));

jest.mock("../context/wallet-context", () => ({
  useWallet: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

const createVoteMap = (...events: any[]): Map<string, any> => {
  const map = new Map();
  for (const event of events) {
    map.set(event.voter.address, event);
  }
  return map;
};

const mockProposals: Proposal[] = [
  {
    id: BigInt(1),
    title: "Proposal A",
    description: "Description A",
    dateAdded: new Date("2025-06-22"),
    closesAt: new Date("2025-06-22"),
    author: {
      name: "RAF test nalog",
      address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    },
    status: "closed",
    voteItems: [
      {
        id: BigInt(3),
        title: "Item 1",
        description: "Item 1 Description",
        userVotes: createVoteMap({
          vote: "for",
          date: new Date("2025-06-22"),
          voter: {
            name: "FON test nalog",
            address: "0x696a45A7150c1d294Ce6E4168A7373b6c38aBC40",
          },
        }),
      },
    ],
  },
  {
    id: BigInt(2),
    title: "Proposal B",
    description: "Description B",
    dateAdded: new Date("2025-06-22"),
    closesAt: new Date("2025-06-22"),
    author: {
      name: "FON test nalog",
      address: "0x696a45A7150c1d294Ce6E4168A7373b6c38aBC40",
    },
    status: "open",
    voteItems: [
      {
        id: BigInt(4),
        title: "Item 2",
        description: "Item 2 Description",
        userVotes: createVoteMap({
          vote: "against",
          date: new Date("2025-06-22"),
          voter: {
            name: "FON test nalog",
            address: "0x696a45A7150c1d294Ce6E4168A7373b6c38aBC40",
          },
        }),
      },
    ],
  },
];

const mockUser = {
  name: "Test User",
  address: "0x999",
};

beforeEach(() => {
  (useProposals as jest.Mock).mockReturnValue({
    proposals: mockProposals,
    loading: false,
  });

  (useWallet as jest.Mock).mockReturnValue({
    user: mockUser,
    loading: false,
  });
});

test("filters proposals by search term (title)", async () => {
  render(<RezultatiPage />);
  const input = screen.getByPlaceholderText("Претрага предлога...");
  fireEvent.change(input, { target: { value: "Proposal A" } });

  await waitFor(() => {
    expect(screen.getByText("Proposal A")).toBeInTheDocument();
    expect(screen.queryByText("Proposal B")).not.toBeInTheDocument();
  });
});

test("filters proposals by author", async () => {
  render(<RezultatiPage />);

  fireEvent.click(screen.getAllByText("Aутор")[0]);
  await waitFor(() => screen.getByText("RAF test nalog"));
  fireEvent.click(screen.getByText("RAF test nalog"));

  await waitFor(() => {
    expect(screen.getByText("Proposal A")).toBeInTheDocument();
    expect(screen.queryByText("Proposal B")).not.toBeInTheDocument();
  });
});

test("filters proposals by users who voted", async () => {
  render(<RezultatiPage />);
  fireEvent.click(screen.getByText("Прикажи гласове корисника"));
  await waitFor(() => screen.getByText("FON test nalog"));
  fireEvent.click(screen.getByText("FON test nalog"));

  await waitFor(() => {
    expect(screen.getByText("Proposal A")).toBeInTheDocument();
    expect(screen.getByText("Proposal B")).toBeInTheDocument();
  });
});

test("shows no results message when nothing matches", async () => {
  render(<RezultatiPage />);
  const input = screen.getByPlaceholderText("Претрага предлога...");
  fireEvent.change(input, { target: { value: "Something nonexistent" } });

  await waitFor(() => {
    expect(screen.getByText("Нема резултата за приказ")).toBeInTheDocument();
  });
});
