import { Database, User } from "../database/types";
import { HttpException } from "../errors";

export interface UserService {
  getById(id: number): Promise<User>;
}

export function createUserService(db: Database): UserService {
  const getById = async (id: number): Promise<User> => {
    try {
      const user = await db.selectUserQuery(id);
      return user;
    } catch (error) {
      throw new HttpException(500, "Internal Server Error");
    }
  };

  return {
    getById,
  };
}
