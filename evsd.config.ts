import { EvsdConfig, NetworkConfig } from "./types/evsd-config";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const hardhat: NetworkConfig = {
  tokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  governorAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  initialUserList: [
    {
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      name: "Alice",
    },
    {
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      name: "Bob",
    },
  ],
};
const sepolia: NetworkConfig = {
  tokenAddress: "0xF4E761f6359b592Edb8002278920AF21d14C9953",
  governorAddress: "0x73836B9F15819daF12dF636a46f19cFc11Cd024e",
  initialUserList: [
    {
      address: "0x5DE5187A457FA721Df7F2dd0e673B9d0a2500788",
      name: "Veliki Humus",
    },
    {
      address: "0x2b6578D9C592e3aF0743Bd4c34c22adaE4e440e9",
      name: "Mali Humus",
    },
  ],
};

const arbitrumSepolia: NetworkConfig = {
  tokenAddress: "0x4183A1Be2aAFA0BBb9b8591A2F4629B007ab7A54",
  governorAddress: "0x4725F9698D218CF21a7E835597d47a6E4a46b1e0",
  initialUserList: [
    {
      address: "0x5DE5187A457FA721Df7F2dd0e673B9d0a2500788",
      name: "Veliki Humus",
    },
    {
      address: "0x2b6578D9C592e3aF0743Bd4c34c22adaE4e440e9",
      name: "Mali Humus",
    },
    {
      address: "0xE60Ea9b8A1fb8190f54924b2A8A4235d2b69cf55",
      name: "Srednji Humus",
    },
  ],
};

const arbitrum: NetworkConfig = {
  tokenAddress: "0xF72f46ae05A92719037D073c85d7d25b883145c3",
  governorAddress: "0x9cFb455c5976b76c327c8dF9588E4627ACba089C",
  initialUserList: [
    {
      address: "0x84f52e7Ed5Efc7cb6C6Ee6b25230bEb37e97079B",
      name: "Архитектонски факултет",
    },
    {
      address: "0x30389b29739b69aD9ceaeb31c9875e6ed5F1473C",
      name: "Биолошки факултет",
    },
    {
      address: "0x0b7BF92fCfD2C9EbB4B3b0ec9819DC2A53D2e849",
      name: "Географски факултет",
    },
    {
      address: "0xd98DA6b5dedF7059D90Cf846c5F3153506e230b6",
      name: "Грађевински факултет",
    },
    {
      address: "0x97f4Cf7F7896Eba8cfd03D0Ce0F31D17fbe3AFAD",
      name: "Економски факултет",
    },
    {
      address: "0xF6f42f4a5Fa685773c0c2c720E963cF61387D611",
      name: "Електротехнички факултет",
    },
    {
      address: "0xd0eC0D56228f122B430F55bdfCad89144465567B",
      name: "Математички факултет",
    },
    {
      address: "0x6AD7B33C2a37b59e025E8aE35FFdb6e57915D051",
      name: "Машински факултет",
    },
    {
      address: "0xD7f280335D6c05CDEDA6dCF673fc0F74B60F46D4",
      name: "Медицински факултет",
    },
    {
      address: "0x1F7efF906B11E8704D1b5475a52C38F875003600",
      name: "Пољопривредни факултет",
    },
    {
      address: "0xe6Ef94d3080a7115b9d9b6a4745efB18f7357FFB",
      name: "Правни факултет",
    },
    {
      address: "0xEF103CB7eF43717Bc27A66783A3841C34c45058A",
      name: "Православно богословски факултет",
    },
    {
      address: "0x33cCc89a77b4D180D758CE9A506F9BD9dD698AcE",
      name: "Рударско-геолошки факултет",
    },
    {
      address: "0xB9aBb3eeA4978C7e6b947671957AFf6B86A26016",
      name: "Саобраћајни факултет",
    },
    {
      address: "0xcD846F312AB9a8EfEE0e974aBE37FeFF031010Ca",
      name: "Стоматолошки факултет",
    },
    {
      address: "0x25d748378ebC6350396bAee5109eDb0dD88311B7",
      name: "Технички факултет у Бору",
    },
    {
      address: "0x3340876d76F53D527997F3d79dF216E75B908Cee",
      name: "Технолошко-металуршки факултет",
    },
    {
      address: "0x91a6c4aE8A8D3Ca2fDAf965a7ea54090098011f8",
      name: "Факултет безбедност",
    },
    {
      address: "0x8F76523054606e44753b88ee12699A1913c4817a",
      name: "Факултет за образовање учитеља и васпитача",
    },
    {
      address: "0xe636E286FFdA2C22f85d3D277317ADd55183d6ed",
      name: "Факултет за специјалну едукацију и рехабилитацију",
    },
    {
      address: "0xE6Cc392539785E3dDA236410412b1C7aaBE9D4De",
      name: "Факултет за физичку хемије",
    },
    {
      address: "0x08d8Cbd5CEBFE7cAA579e337450748486C06d105",
      name: "Факултет организационих наука",
    },
    {
      address: "0xDb0F18cb30377Cf4C6EF171701ccEC9F317c8490",
      name: "Факултет политичких наука",
    },
    {
      address: "0x71bF7ea18DF0E949Eb802DcD712711a57b72d79C",
      name: "Факултет спорта и физичког васпитања",
    },
    {
      address: "0x2982F003202Bd5FDAE537C95cBF9e8E664ED27Bb",
      name: "Фармацеутски факултет",
    },
    {
      address: "0x19CDFb92d8C2EdBEDf7f33258855A8D4f299a0A0",
      name: "Физички факултет",
    },
    {
      address: "0x7c881c57b45Ac07E2234F6EAA8fEf67468E1ef9a",
      name: "Филозофски факултет",
    },
    {
      address: "0xEd00B8bE5F08d0eFbdA49326bE298713af341d1f",
      name: "Филолошки факултет",
    },
    {
      address: "0x858ac0e263eeC9283ddfE0Aa49c5EA5bb39e8cE2",
      name: "Хемијски факултет",
    },
    {
      address: "0x3D57a847F7afF37A324dE5b05B7360c75d69C13c",
      name: "Шумарски факултет",
    },
    {
      address: "0x4383aD2f490D58Ca623097B63EFD14B83DB79493",
      name: "Факултет драмских уметности",
    },
    {
      address: "0xc05773866a2f579022F55F1A898b5e6c0310Fa5A",
      name: "Факултет ликовних уметности",
    },
    {
      address: "0x6A06472B887063537463E32247df3667A416e53F",
      name: "Факултет музичке уметности",
    },
    {
      address: "0x8D066629De22DdC5b665F4c73A5ab3616Bc96CEb",
      name: "Факултет примењених уметности",
    },
    {
      address: "0xfbb27C0c87d46A8b393A5C9d64D51Efdd3e39ad0",
      name: "Академија струковних студија Политехника",
    },
    {
      address: "0x2C2FAA4ee2955D93dF2e22DE1036374C6E6E0dDA",
      name: "Београдска академија пословних и уметничких струковних студија",
    },
    {
      address: "0xF66c0416ad9C645Db00c66f0191c74100cdB51A5",
      name: "Висока грађевинско геодетска школа",
    },
    {
      address: "0xA8AcA238111DCE0f4c0704b0a95dA8Cf0F93c11A",
      name: "Висока школа електротехнике и рачунарства",
    },
    {
      address: "0xF21D3B40DaFF6567040aFe49E1dADbf0F7C4b10B",
      name: "Висока школа за информационе и комуникационе технологије",
    },
    {
      address: "0xA191ecF2d58408C39bEde423428e69B1337195A5",
      name: "Виша здравствена школа",
    },
    {
      address: "0x5701947ab66a2475fC389e6e0fd50c129Afc64F7",
      name: "Висока текстилна струковна школа",
    },
    {
      address: "0xb460aAcc6bFad46cFF6B0d2f29ecc4fb9fC25E5E",
      name: "Рачунарски факултет",
    },
    {
      address: "0x3a3bF5b35d04Cfe47FF328a40ec1A8bB86B14eD6",
      name: "Факултет за економију, финансије и администрацију",
    },
    {
      address: "0x2caefCBB7e05528970Dd5a3115244F8598fC8F9e",
      name: "Факултет за медије и комуникације",
    },
    {
      address: "0x985Aeb065dBadda6D67807906B786D8147da4008",
      name: "Факултет савремених уметности",
    },
    {
      address: "0x284C582cF729B367Fd9a07dABF15ef28F3809157",
      name: "Универзитет Унион Правни Факултет",
    },
  ],
};

export const config: EvsdConfig = {
  proposalService: {
    type: "blockchain",
    network: arbitrum,
  },
};
