export function getPlaceholderText(queryMode: string): string {
  switch (queryMode) {
    case "factCheck":
      return "Ask the validator network a yes/no question";
    case "shop":
      return "Find me the best deals on sneakers";
    case "predict":
      return "What will the weather be like tomorrow?";
    case "create":
      return "Generate a short story about a robot";
    default:
      return "Ask the validator network a yes/no question";
  }
}