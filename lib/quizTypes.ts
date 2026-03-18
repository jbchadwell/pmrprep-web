export type ChoiceKey = "A" | "B" | "C" | "D";

export type DbQuestionRow = {
  id: string;
  question_uid: string;
  question_stem: string;
  question_extra_information: string | null;

  correct_answer: string;
  distractor_1: string;
  distractor_2: string;
  distractor_3: string;

  primary_category: string | null;
};

export type QuizChoice = {
  key: ChoiceKey;
  text: string;
};

export type QuizQuestion = {
  id: string;
  uid: string;
  stem: string;
  primaryCategory?: string | null;
  questionExtraInfo?: string | null;
  choices: QuizChoice[];
};

