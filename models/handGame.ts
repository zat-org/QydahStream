import type { BoardSettingsI } from "./boardSettings";

export interface HandGameI {
    gameData: HandGameDataI;
    boardSettings: BoardSettingsI;
  }


export interface HandGameDataI {
    id: string
    createdAt: string
    startedAt: string
    endedAt: any
    gameMode: string
    state: string
    lastAppliedEventIndex: number
    settings: Settings
    teams: Team[]
    winnerTeamIndex: any
    gameInterval: number
    pausingIntervals: PausingInterval[]
    location: any
    rounds: Round[]
    comment: Comment
    statistics: Statistics
  }
  
  export interface Settings {
    roundsCount: number
    maxLimit: number
    teamsCount: number
    playersCountInTeam: number
    playingMode: string
    zatMode: string
    handValues: HandValues
  }
  
  export interface HandValues {
    khalis: Khalis
    hand: Hand
    joker: Joker
    twoJokers: TwoJokers
    threeJokers: ThreeJokers
    zat: Zat
    takweesh: Takweesh
  }
  
  export interface Khalis {
    type: string
    arabicName: string
    winnerScore: number
    loserScore: number
    nzoolMultipliedBy: number
  }
  
  export interface Hand {
    type: string
    arabicName: string
    winnerScore: number
    loserScore: number
    nzoolMultipliedBy: number
  }
  
  export interface Joker {
    type: string
    arabicName: string
    winnerScore: number
    loserScore: number
    nzoolMultipliedBy: number
  }
  
  export interface TwoJokers {
    type: string
    arabicName: string
    winnerScore: number
    loserScore: number
    nzoolMultipliedBy: number
  }
  
  export interface ThreeJokers {
    type: string
    arabicName: string
    winnerScore: number
    loserScore: number
    nzoolMultipliedBy: number
  }
  
  export interface Zat {
    type: string
    arabicName: string
    winnerScore: number
    loserScore: number
    nzoolMultipliedBy: number
  }
  
  export interface Takweesh {
    type: string
    arabicName: string
    winnerScore: number
    loserScore: number
    nzoolMultipliedBy: number
  }
  
  export interface Team {
    index: number
    name: string
    score: number
    hasZat: boolean
    players: Player[]
  }
  
  export interface Player {
    index: number
    name: string
    id: any
    imageUrl: any
  }
  
  export interface PausingInterval {
    startedAt: string
    endedAt: any
  }
  
  export interface Round {
    id: number
    startedAt: string
    endedAt?: string
    state: string
    roundInterval: number
    handRoundData?: HandRoundData
  }
  
  export interface HandRoundData {
    selectedValue: SelectedValue
    selectedTeamIndex: number
    teamsRoundData: TeamsRoundDaum[]
  }
  
  export interface SelectedValue {
    type: string
    arabicName: string
    winnerScore: number
    loserScore: number
    nzoolMultipliedBy: number
  }
  
  export interface TeamsRoundDaum {
    teamIndex: number
    score: number
    playersNzoolValues: PlayersNzoolValue[]
  }
  
  export interface PlayersNzoolValue {
    playerIndex: number
    value: number
  }
  
  export interface Comment {
    comment: string
    winnerRef: string
  }
  
  export interface Statistics {}
  