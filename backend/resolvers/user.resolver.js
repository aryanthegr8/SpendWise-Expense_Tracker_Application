import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const userResolver = {
  Mutation: {
    signUp: async (_, { input }, context) => {
      try {
        const { username, name, password, gender } = input;

        if (typeof username !== "string" || !/^[a-zA-Z0-9_.-]{3,40}$/.test(username) ||
            typeof name !== "string" || !name.trim() || name.trim().length > 80 ||
            typeof password !== "string" || password.length < 8 || password.length > 128 ||
            !["male", "female"].includes(gender)) {
          throw new Error("Invalid signup details: username 3–40 characters, name 1–80, password 8–128, valid gender required");
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          throw new Error("User already exists");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // https://avatar.iran.liara.run/
        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUser = new User({
          username,
          name: name.trim(),
          password: hashedPassword,
          gender,
          profilePicture: gender === "male" ? boyProfilePic : girlProfilePic,
        });
        await newUser.save();
        await context.login(newUser);
        return newUser;
      } catch (err) {
        console.error("Signup failed:", err.name);
        throw new Error(err.message || "Internal server error");
      }
    },

    login: async (_, { input }, context) => {
      try {
        const { username, password } = input;
        if (typeof username !== "string" || typeof password !== "string" || !username || !password) throw new Error("Invalid username or password");
        const { user } = await context.authenticate("graphql-local", {
          username,
          password,
        });

        await context.login(user);
        return user;
      } catch (err) {
        console.error("Login failed:", err.name);
        throw new Error(err.message || "Internal server error");
      }
    },
    logout: async (_, __, context) => {
      await context.logout();
      if (context.req.session) {
        await new Promise((resolve, reject) => context.req.session.destroy(err => err ? reject(err) : resolve()));
      }
      context.res.clearCookie("spendwise.sid", { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
      return { message: "Logged out successfully" };
    },
  },
  Query: {
    authUser: async (_, __, context) => {
      try {
        const user = await context.getUser();
        return user;
      } catch (err) {
        console.log("Error in authUser: ", err);
        throw new Error(err.message || "Internal server error");
      }
    },
    user: async (_, { userId }, context) => {
      const current = context.getUser();
      if (!current?._id) throw new Error("Unauthorized");
      if (String(current._id) !== String(userId)) throw new Error("Forbidden");
      return User.findById(current._id);
    },
  },
  User: {
    transactions: async (parent) => {
      try {
        const transactions = await Transaction.find({ userId: parent._id });
        return transactions;
      } catch (err) {
        console.log("Error in user.transactions resolver: ", err);
        throw new Error(err.message || "Internal server error");
      }
    },
  },
};

export default userResolver;
