export function getPlaceholderText(queryMode: string): string {
  switch (queryMode) {
    case "fact-check":
      return "Example: Covid-19 was leaked from a lab in Wuhan, China";
    case "shop":
      return "Find the best deals on sustainable products";
    case "predict":
      return "Will AI surpass human intelligence by 2030?";
    case "create":
      return "Write a story about the future of technology";
    default:
      return "Ask a question to reach AI consensus";
  }
}