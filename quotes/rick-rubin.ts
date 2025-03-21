export const rickRubinQuotes = [
  "Simplicity is harder than complexity.",
  "The space between elements is as important as the elements themselves.",
  "Question everything, especially success.",
  "Limitation breeds creativity.",
  "The first idea isn't always the best idea.",
  "Sometimes the flaws make it better.",
  "The process matters more than the outcome.",
  "Make something that only you could make.",
  "The best ideas often come from accidents.",
  "Design is about removing until you can't remove anymore.",
  "Good design feels inevitable.",
  "The clearer the vision, the better the outcome.",
  "Start with what's essential, then subtract.",
  "Form follows feeling.",
  "The best designs feel like they've always existed."
];

export type Quote = {
  text: string;
  author: string;
};

export const formattedQuotes: Quote[] = rickRubinQuotes.map(text => ({
  text,
  author: "Rick Rubin"
})); 