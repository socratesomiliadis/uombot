import type { InferUITool, UIMessage, UIDataTypes } from "ai";
import type { getInformation } from "./ai/tools/get-information";

type getInformationTool = InferUITool<ReturnType<typeof getInformation>>;

export type ChatTools = {
  getInformation: getInformationTool;
};

export type ChatMessage = UIMessage<UIDataTypes, ChatTools>;
