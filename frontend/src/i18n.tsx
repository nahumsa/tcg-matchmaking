import React, { createContext, useContext, useMemo, useState } from 'react';

export type Language = 'pt-BR' | 'en';

type MessageKey = keyof typeof MESSAGES.en;
type Params = Record<string, string | number>;

const STORAGE_KEY = 'app_language';

const MESSAGES = {
  en: {
    navDashboard: 'Dashboard',
    navJoin: 'Join',
    navStandings: 'Standings',
    navLanguage: 'Language',
    navSelectLanguage: 'Select language',
    navEnglish: 'English',
    navPortugueseBrazil: 'Portuguese (Brazil)',

    landingWelcome: 'Welcome to TCG Matchmaking',
    landingRolePrompt: 'Please select your role to continue.',
    landingAdminRole: 'Administrator',
    landingAdminDescription: 'Create tournaments, manage participants, and pair rounds.',
    landingPlayerRole: 'Player',
    landingPlayerDescription: 'Join tournaments via code, view pairings, and report scores.',

    joinTitle: 'Join Tournament',
    joinDetails: 'Enter Details',
    joinName: 'Your Name',
    joinNamePlaceholder: 'e.g. Ash Ketchum',
    joinCode: 'Tournament Code',
    joinCodePlaceholder: 'e.g. ABCDEF',
    joinCodeMustBe: 'Tournament code must be {length} letters or numbers.',
    joinCodeExactLength: 'Enter exactly {length} letters or numbers.',
    joinCodeLooksGood: 'Code looks good.',
    joinInvalidForm: 'Please provide a valid name and tournament code.',
    joinFailed: 'Failed to join tournament',
    joinLoading: 'Joining...',
    joinButton: 'Join Tournament',
    joinChoosePokemon: 'Choose a Pokémon',
    joinSearchPokemon: 'Search Pokémon...',
    joinNoPokemonFound: 'No Pokémon found',
    joinDeckPokemon: 'Deck Pokémon (up to 2)',
    joinPokemon1: 'Pokémon 1',
    joinPokemon2: 'Pokémon 2 (optional)',

    activityLogTitle: 'Activity Log',
    activityLogEmpty: 'No recent activity.',
    activityEventParticipantJoined: 'Participant Joined',
    activityEventMatchReported: 'Match Reported',

    participantsTitle: 'Participants',
    participantsNamePlaceholder: 'Player Name',
    participantsAdd: 'Add',
    participantsNoOne: 'No participants joined yet.',
    participantsPoints: 'points',
    participantsRemoveConfirm: 'Are you sure you want to remove this participant?',
    participantsAddFailed: 'Failed to add participant',
    participantsRemoveFailed: 'Failed to remove participant',
    participantsUndrop: 'Undrop',
    participantsUndropFailed: 'Failed to undrop participant',

    commonUnexpectedError: 'An unexpected error occurred',
    commonNone: 'None',
    commonPlayerWithId: 'Player {id}',
    commonScoreForPlayer: 'Score for {name}',

    adminMatchReported: 'Match results reported.',
    adminProvideTournamentName: 'Please provide a tournament name.',
    adminCreateFailed: 'Failed to create tournament',
    adminPairingsFailed: 'Failed to generate pairings',
    adminReportFailed: 'Failed to report result',
    adminExportFailed: 'Failed to export standings',
    adminStartRound: 'Start Round 1',
    adminStartConfirmStep: 'Step {step}/2',
    adminStartConfirmTitle: 'Confirm Tournament Start',
    adminStartConfirmBody: 'Starting will lock the roster and generate Round 1 pairings. Confirm before proceeding.',
    adminStartConfirmLockRoster: 'Roster locks; no more participant edits.',
    adminStartConfirmGenerate: 'Round 1 pairings will be created immediately.',
    adminStartEnterCode: 'Type {code} to confirm start',
    adminStartCodePlaceholder: 'Enter {code} to continue',
    adminStartCodeMismatch: 'Code does not match. Try again.',
    adminStartCancel: 'Cancel',
    adminStartContinue: 'Continue',
    adminStartConfirmButton: 'Confirm & Start',
    adminNextRound: 'Next Round',
    adminEndTournament: 'End Tournament',
    adminEndEarly: 'End Early',
    adminCompleted: 'Tournament Completed',
    adminCompletedDescription: 'All rounds have been played and results are finalized.',
    adminExportResults: 'Export Results',
    adminViewFinalStandings: 'View Final Standings',
    adminCurrentRound: 'Current Round',
    adminRoundOf: 'Round {current} of {total}',
    adminTournamentNotStarted: 'Tournament Not Started',
    adminNoMatches: 'No matches generated yet. Start the round to begin.',
    adminTable: 'Table',
    adminBye: 'BYE',
    adminOverride: 'Override',
    adminReport: 'Report',
    adminTitle: 'Admin Dashboard',
    adminCreateTournament: 'Create Tournament',
    adminTournamentName: 'Tournament Name',
    adminTournamentNamePlaceholder: 'e.g. Swiss Open #1',
    adminRounds: 'Number of Rounds',
    adminRoundsHint: 'Rounds must be between 1 and 10.',
    adminCreating: 'Creating...',
    adminCreateNewTournament: 'Create New Tournament',
    adminPublicView: 'Public View ↗',
    adminViewStandings: 'View Final Standings',
    adminJoinedTournament: '{name} joined the tournament.',
    adminFinalStandings: 'Final Standings',
    adminRank: 'Rank',
    adminPlayer: 'Player',
    adminPlayers: 'Players',
    adminPokemon: 'Pokemon',
    adminPoints: 'Points',
    adminRecord: 'Record',
    adminWinPercent: 'Win %',
    adminOMW: 'OMW%',
    adminCompletedStatus: 'Completed',

    tournamentLoading: 'Loading tournament...',
    tournamentTournament: 'Tournament',
    tournamentConnected: 'Connected',
    tournamentReconnecting: 'Reconnecting...',
    tournamentConnecting: 'Connecting...',
    tournamentPairings: 'Pairings',
    tournamentStandings: 'Standings',
    tournamentMyStatus: 'My Status',
    tournamentCurrentRank: 'Current Rank',
    tournamentPoints: 'Points',
    tournamentRecord: 'Record (W-L-D)',
    tournamentWinPercent: 'Win %',
    tournamentOMW: 'OMW%',
    tournamentPossibleOpponents: 'Possible Opponents',
    tournamentNone: 'None',
    tournamentRound: 'Round',
    tournamentTable: 'Table',
    tournamentCompletedStatus: 'Completed',
    tournamentReportScore: 'Report Score',
    tournamentEditScore: 'Edit Score',
    tournamentRank: 'Rank',
    tournamentPlayer: 'Player',
    tournamentPokemon: 'Pokemon',
    tournamentHidden: 'Hidden',
    tournamentNoParticipants: 'No participants yet.',
    tournamentReportScoreTitle: 'Report Score',
    tournamentReportScoreDescription: 'Select the final score for your match against {name}.',
    tournamentReportOutcomeLabel: 'Result',
    tournamentResultWin: 'Win',
    tournamentResultLoss: 'Loss',
    tournamentResultTie: 'Tie',
    tournamentReportMatchCountLabel: 'Match score',
    tournamentReportYou: 'You',
    tournamentCancel: 'Cancel',
    tournamentSubmitResult: 'Submit Result',
    tournamentLoadingShort: '...',
    tournamentNoMatchesYet: 'No matches yet. Waiting for the organizer to start the round.',
    tournamentReportFailed: 'Failed to report score',
  },
  'pt-BR': {
    navDashboard: 'Painel',
    navJoin: 'Entrar',
    navStandings: 'Classificação',
    navLanguage: 'Idioma',
    navSelectLanguage: 'Selecionar idioma',
    navEnglish: 'Inglês',
    navPortugueseBrazil: 'Português (Brasil)',

    landingWelcome: 'Bem-vindo ao TCG Matchmaking',
    landingRolePrompt: 'Selecione seu perfil para continuar.',
    landingAdminRole: 'Administrador',
    landingAdminDescription: 'Crie torneios, gerencie participantes e gere emparceiramentos.',
    landingPlayerRole: 'Jogador',
    landingPlayerDescription: 'Entre em torneios por código, veja emparceiramentos e reporte resultados.',

    joinTitle: 'Entrar no Torneio',
    joinDetails: 'Preencha os dados',
    joinName: 'Seu nome',
    joinNamePlaceholder: 'ex.: Ash Ketchum',
    joinCode: 'Código do torneio',
    joinCodePlaceholder: 'ex.: ABCDEF',
    joinCodeMustBe: 'O código deve ter {length} letras ou números.',
    joinCodeExactLength: 'Digite exatamente {length} letras ou números.',
    joinCodeLooksGood: 'Código válido.',
    joinInvalidForm: 'Informe um nome e código válidos.',
    joinFailed: 'Falha ao entrar no torneio',
    joinLoading: 'Entrando...',
    joinButton: 'Entrar no torneio',
    joinChoosePokemon: 'Escolha um Pokémon',
    joinSearchPokemon: 'Pesquisar Pokémon...',
    joinNoPokemonFound: 'Nenhum Pokémon encontrado',
    joinDeckPokemon: 'Pokémon do Deck (até 2)',
    joinPokemon1: 'Pokémon 1',
    joinPokemon2: 'Pokémon 2 (opcional)',

    activityLogTitle: 'Registro de atividade',
    activityLogEmpty: 'Nenhuma atividade recente.',
    activityEventParticipantJoined: 'Participante Entrou',
    activityEventMatchReported: 'Partida Reportada',

    participantsTitle: 'Participantes',
    participantsNamePlaceholder: 'Nome do jogador',
    participantsAdd: 'Adicionar',
    participantsNoOne: 'Nenhum participante entrou ainda.',
    participantsPoints: 'pontos',
    participantsRemoveConfirm: 'Tem certeza que deseja remover este participante?',
    participantsAddFailed: 'Falha ao adicionar participante',
    participantsRemoveFailed: 'Falha ao remover participante',
    participantsUndrop: 'Reativar',
    participantsUndropFailed: 'Falha ao reativar participante',

    commonUnexpectedError: 'Ocorreu um erro inesperado',
    commonNone: 'Nenhum',
    commonPlayerWithId: 'Jogador {id}',
    commonScoreForPlayer: 'Resultado de {name}',

    adminMatchReported: 'Resultado de partida reportado.',
    adminProvideTournamentName: 'Informe o nome do torneio.',
    adminCreateFailed: 'Falha ao criar torneio',
    adminPairingsFailed: 'Falha ao gerar emparceiramentos',
    adminReportFailed: 'Falha ao reportar resultado',
    adminExportFailed: 'Falha ao exportar classificação',
    adminStartRound: 'Iniciar Rodada 1',
    adminStartConfirmStep: 'Etapa {step}/2',
    adminStartConfirmTitle: 'Confirmar início do torneio',
    adminStartConfirmBody: 'Iniciar irá travar a lista de participantes e gerar os emparceiramentos da primeira rodada. Confirme antes de prosseguir.',
    adminStartConfirmLockRoster: 'Lista de participantes bloqueada; sem novas edições.',
    adminStartConfirmGenerate: 'Emparceiramentos da Rodada 1 serão criados imediatamente.',
    adminStartEnterCode: 'Digite {code} para confirmar',
    adminStartCodePlaceholder: 'Digite {code} para continuar',
    adminStartCodeMismatch: 'Código não confere. Tente novamente.',
    adminStartCancel: 'Cancelar',
    adminStartContinue: 'Continuar',
    adminStartConfirmButton: 'Confirmar e iniciar',
    adminNextRound: 'Próxima rodada',
    adminEndTournament: 'Finalizar Torneio',
    adminEndEarly: 'Encerrar Antecipadamente',
    adminCompleted: 'Torneio finalizado',
    adminCompletedDescription: 'Todas as rodadas foram jogadas e os resultados finalizados.',
    adminExportResults: 'Exportar resultados',
    adminViewFinalStandings: 'Ver classificação final',
    adminCurrentRound: 'Rodada atual',
    adminRoundOf: 'Rodada {current} de {total}',
    adminTournamentNotStarted: 'Torneio não iniciado',
    adminNoMatches: 'Nenhuma partida gerada ainda. Inicie a rodada para começar.',
    adminTable: 'Mesa',
    adminBye: 'FOLGA',
    adminOverride: 'Sobrescrever',
    adminReport: 'Reportar',
    adminTitle: 'Painel do administrador',
    adminCreateTournament: 'Criar torneio',
    adminTournamentName: 'Nome do torneio',
    adminTournamentNamePlaceholder: 'ex.: Open Suíço #1',
    adminRounds: 'Número de rodadas',
    adminRoundsHint: 'As rodadas devem estar entre 1 e 10.',
    adminCreating: 'Criando...',
    adminCreateNewTournament: 'Criar novo torneio',
    adminPublicView: 'Visão pública ↗',
    adminViewStandings: 'Ver classificação final',
    adminJoinedTournament: '{name} entrou no torneio.',
    adminFinalStandings: 'Classificação Final',
    adminRank: 'Pos.',
    adminPlayer: 'Jogador',
    adminPlayers: 'Jogadores',
    adminPokemon: 'Pokémon',
    adminPoints: 'Pontos',
    adminRecord: 'Resultado',
    adminWinPercent: '% de Vitórias',
    adminOMW: 'OMW%',
    adminCompletedStatus: 'Finalizado',

    tournamentLoading: 'Carregando torneio...',
    tournamentTournament: 'Torneio',
    tournamentConnected: 'Conectado',
    tournamentReconnecting: 'Reconectando...',
    tournamentConnecting: 'Conectando...',
    tournamentPairings: 'Emparelhamentos',
    tournamentStandings: 'Classificação',
    tournamentMyStatus: 'Meu status',
    tournamentCurrentRank: 'Posição atual',
    tournamentPoints: 'Pontos',
    tournamentRecord: 'Resultado (V-D-E)',
    tournamentWinPercent: 'Vitórias %',
    tournamentOMW: 'OMW%',
    tournamentPossibleOpponents: 'Possíveis oponentes',
    tournamentNone: 'Nenhum',
    tournamentRound: 'Rodada',
    tournamentTable: 'Mesa',
    tournamentCompletedStatus: 'Finalizado',
    tournamentReportScore: 'Reportar resultado',
    tournamentEditScore: 'Editar resultado',
    tournamentRank: 'Pos.',
    tournamentPlayer: 'Jogador',
    tournamentPokemon: 'Pokémon',
    tournamentHidden: 'Oculto',
    tournamentNoParticipants: 'Nenhum participante ainda.',
    tournamentReportScoreTitle: 'Reportar resultado',
    tournamentReportScoreDescription: 'Selecione o resultado final da sua partida contra {name}.',
    tournamentReportOutcomeLabel: 'Resultado',
    tournamentResultWin: 'Vitória',
    tournamentResultLoss: 'Derrota',
    tournamentResultTie: 'Empate',
    tournamentReportMatchCountLabel: 'Placar da partida',
    tournamentReportYou: 'Você',
    tournamentCancel: 'Cancelar',
    tournamentSubmitResult: 'Enviar resultado',
    tournamentLoadingShort: '...',
    tournamentNoMatchesYet: 'Nenhuma partida ainda. Aguardando o organizador iniciar a rodada.',
    tournamentReportFailed: 'Falha ao reportar resultado',
  },
} as const;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey, params?: Params) => string;
}

const getInitialLanguage = (): Language => {
  const savedLanguage = localStorage.getItem(STORAGE_KEY);
  if (savedLanguage === 'pt-BR' || savedLanguage === 'en') {
    return savedLanguage;
  }
  return 'pt-BR';
};

function translate(language: Language, key: MessageKey, params?: Params) {
  const template = MESSAGES[language][key];
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? `{${token}}`));
}

const LanguageContext = createContext<LanguageContextValue>({
  language: getInitialLanguage(),
  setLanguage: () => undefined,
  t: (key, params) => translate(getInitialLanguage(), key, params),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: MessageKey, params?: Params) => translate(language, key, params),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  return useContext(LanguageContext);
}
