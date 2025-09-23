import { nanoid } from "@/lib/utils";
import Chat from "@/components/chat";

export default async function ChatPage() {
  const id = nanoid();

  return <Chat key={id} id={id} initialMessages={[]} />;
}
