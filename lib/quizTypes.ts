export type ChoiceKey = "A" | "B" | "C" | "D";

export type DbQuestionRow = {
  id: string;
  question_uid: string;
  question_stem: string;
  question_extra_information: string | null;
  answer_extra_information: string | null;

  correct_answer: string;
  distractor_1: string;
  distractor_2: string;
  distractor_3: string;

  correct_answer_explanation: string;
  distractor_1_explanation: string;
  distractor_2_explanation: string;
  distractor_3_explanation: string;

  primary_category: string | null; // ✅ ADD
};

export type QuizChoice = {
  key: ChoiceKey;
  text: string;
  isCorrect: boolean;
  explanation: string;
};

export type QuizQuestion = {
  id: string;
  uid: string;
  stem: string;
  primaryCategory?: string | null; // ✅ ADD
  questionExtraInfo?: string | null;
  answerExtraInfo?: string | null;
  choices: QuizChoice[];
};

