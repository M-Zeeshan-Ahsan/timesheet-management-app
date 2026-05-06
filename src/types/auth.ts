export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthMeResponse = {
  user: User;
};
