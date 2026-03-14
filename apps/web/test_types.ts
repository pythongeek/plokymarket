import { Database } from './src/types/database.types';

type UserProfilesInsert = Database['public']['Tables']['user_profiles']['Insert'];

const up: UserProfilesInsert = {
  id: "test",
  email: "test",
};
console.log(up);
