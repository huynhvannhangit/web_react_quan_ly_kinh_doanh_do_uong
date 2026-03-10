import { redirect } from "next/navigation";

export default function Home() {
  // Logic chuyển hướng chính nằm ở AuthProvider
  redirect("/dashboard");
}
