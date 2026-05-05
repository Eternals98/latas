import { redirect } from "next/navigation";
import { getSessionUser } from "../lib/session";

export default async function HomePage() {
  const session = await getSessionUser();
  if (session?.role === "admin") {
    redirect("/dashboard");
  }
  if (session?.role === "cashier") {
    redirect("/salesRegister");
  }
  redirect("/login");
}
