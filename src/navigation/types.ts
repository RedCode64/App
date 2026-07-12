import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
};

export type ContractsStackParamList = {
  ContractList: undefined;
  ContractForm: { habitId?: string };
  History: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  HQ: NavigatorScreenParams<HomeStackParamList>;
  Contracts: NavigatorScreenParams<ContractsStackParamList>;
  Rig: undefined;
  Implants: undefined;
  Net: undefined;
};
