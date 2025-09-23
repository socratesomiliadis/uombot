import { notFound } from "next/navigation";

import PreviewChat from "@/components/chat";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";
import { headers } from "next/headers";
import { authClient } from "@/lib/auth/client";

export default async function Page({ params }: { params: any }) {
  const { id } = await params;
  const chatFromDb = await getChatById({ id });

  if (!chatFromDb) {
    notFound();
  }

  const messages = await getMessagesByChatId({ id });

  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session || !session.user) {
    return notFound();
  }

  if (session.user.id !== chatFromDb.userId) {
    return notFound();
  }

  return (
    <PreviewChat
      id={chatFromDb.id}
      initialMessages={convertToUIMessages(messages)}
    />
  );
}
