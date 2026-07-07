import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // session.user.id'ye Discord ID'yi ekle
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
