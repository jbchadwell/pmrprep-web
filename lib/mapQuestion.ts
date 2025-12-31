import type { DbQuestionRow, QuizChoice, QuizQuestion } from "@/lib/quizTypes";
import { shuffle } from "@/lib/shuffle";

export function mapDbRowToQuizQuestion(row: DbQuestionRow): QuizQuestion {
  const rawChoices: Array<{
    text: string;
    isCorrect: boolean;
    explanation: string;
  }> = [
    {
      text: row.correct_answer,
      isCorrect: true,
      explanation: row.correct_answer_explanation,
    },
    {
      text: row.distractor_1,
      isCorrect: false,
      explanation: row.distractor_1_explanation,
    },
    {
      text: row.distractor_2,
      isCorrect: false,
      explanation: row.distractor_2_explanation,
    },
    {
      text: row.distractor_3,
      isCorrect: false,
      explanation: row.distractor_3_explanation,
    },
  ];

  const shuffled = shuffle(rawChoices);

  const keys = ["A", "B", "C", "D"] as const;
  const choices: QuizChoice[] = shuffled.map((c, i) => ({
    key: keys[i],
    text: c.text,
    isCorrect: c.isCorrect,
    explanation: c.explanation,
  }));

  return {
    id: row.id,
    uid: row.question_uid,
    stem: row.question_stem,
    primaryCategory: row.primary_category ?? null,
    questionExtraInfo: row.question_extra_information,
    answerExtraInfo: row.answer_extra_information,
    choices,
  };
}
