export const STRINGS = {
  newProposal: {
    dialog: {
      addNew: "Додај нови предлог",
      title: "Нови предлог за гласање",
      description: "Попуните формулар да бисте додали нови предлог за гласање.",
    },
    success: {
      title: "Предлог успешно послат!",
      description: "Ваш предлог је додат и доступан је за гласање.",
    },
    status: {
      creating: "Креирање предлога... (потврдите трансакцију у новчанику)",
    },
    error: {
      title: "Грешка",
      descriptionRequired: "Опис предлога је обавезан.",
      titleRequired: "Наслов предлога је обавезан.",
      noVoteItems: "Морате додати барем једну тачку за гласање.",
      subitemsIncomplete: "Сви наслови и описи подтачака су обавезни.",
      insufficientTokens:
        "Немате довољно токена за креирање предлога. За креирање предлога потребно је имати најмање 1 EVSD токен и делегирати их себи.",
      txRejectedByUser:
        "Трансакција је одбијена од стране корисника. Потребно је одобрити трансакцију у новчанику.",
      insufficientETH:
        "Недовољно средстава за плаћање трошкова трансакције (ETH).",
      insufficientEVSDTokens: "Недовољно EVSD токена за креирање предлога.",
      badData:
        "Проблем са прослеђеним подацима. Проверите да ли је адреса токена исправна и параметри одговарајући.",
      callException:
        "Трансакција је одбијена. Могућ проблем са адресом паметног уговора.",
      gasEstimate:
        "Неуспешна процена трошкова гаса. Проверите да ли испуњавате услове за предлог.",
      generic: (msg?: string) => `Грешка: ${msg ?? ""}`,
    },
    info: {
      checking: "Провера стања токена и делегација гласова...",
      creating: "Креирање предлога... (потврдите трансакцију у новчанику)",
      processing: "Обрада",
    },
    form: {
      title: {
        label: "Наслов предлога",
        placeholder: "Унесите наслов предлога",
      },
      description: {
        label: "Опис предлога",
        placeholder: "Детаљно опишите ваш предлог",
      },
      voteItems: {
        label: "Тачке за гласање",
        hint: "Додајте све тачке за које желите да се гласа",
        none: "Додајте подтачке предлога за које ће се гласати појединачно",
      },
      subItem: {
        add: "Додај подтачку",
        title: {
          label: "Наслов подтачке",
          placeholder: "Унесите наслов подтачке",
        },
        description: {
          label: "Опис подтачке предлога",
          placeholder: "Опишите детаљније ову подтачку",
        },
        default: "Тачка",
      },
      document: {
        label: "Приложите документ (опционо)",
        pick: "Изаберите фајл",
      },
      submit: {
        default: "Додај предлог",
        loading: "Слање...",
      },
      attachment: {
        label: "Приложите документ (опционо)",
        button: "Изаберите фајл",
      },
    },
  },
  proposalCard: {
    voteButton: "Гласај",
  },
  userActivity: {
    timeLine: {
      title: "Sve aktivnosti",
      created: "Kreiran predlog",
      deleted: "Povučen predlog",
      youVoted: "Glasali ste",
      noActivity: "Nema aktivnosti",
      description: "Vaše aktivnosti na blokchainu će se pojaviti ovde.",
    },
    userProposals: {
      title: "Moji predlozi",
      noProposalsTitle: "Nemate predloga",
      noProposalsDescription:
        "Kada kreirate predlog za glasanje, pojaviće se ovde.",
      activeProposals: "Aktivni predlozi",
      closedProposals: "Završeni predlozi",
      addedAt: "Glasanje započeto",
      closedAt: "Glasanje završeno",
    },
    votingHistory: {
      title: "Istorija glasanja",
      noHistoryTitle: "Još niste glasali",
      noHistoryDescription:
        "Kada glasate na predlozima, ovde će se prikazati vaša istorija glasanja.",
    },
  },
  voting: {
    voteOptions: {
      for: "za",
      against: "protiv",
      abstain: "uzdržano",
    },
    results: {
      passed: "usvojeno",
      failed: "nije usvojeno",
      noQuorum: "nije dostignut kvorum",
    },
    proposal: "Predlog",
    voteItem: "Tačka",
    quorum: "Кворум",
    quorumReached: "Достигнут",
    result: "Резултат",
  },
  proposal: {
    statusActive: "Glasanje aktivno",
    statusClosed: "Glasanje završeno",
    statusCancelled: "Predlog povučen",
    expiresAt: "Ističe za",
  },
  buttons: {
    cancelProposal: "Otkaži",
  },
  results: {
    proposalInfo: {
      perFacultyVotesTitle: "Детаљи гласања по факултетима",
    },
  },
};
