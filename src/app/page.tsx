import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("ts_session")?.value;

  redirect(sessionToken ? "/dashboard" : "/login");
}
