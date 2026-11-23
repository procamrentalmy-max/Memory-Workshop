import { redirect } from "next/navigation";

export default function CreatePage() {
  redirect("/book/pages?mode=custom");
}
