import type { DbQuestionRow, QuizChoice, QuizQuestion } from "@/lib/quizTypes";
import { shuffle } from "@/lib/shuffle";

export function mapDbRowToQuizQuestion(row: DbQuestionRow): QuizQuestion {
  const rawChoices = [
    row.correct_answer,
    row.distractor_1,
    row.distractor_2,
    row.distractor_3,
  ].filter(Boolean);

  const shuffled = shuffle(rawChoices);

  const keys = ["A", "B", "C", "D"] as const;
  const choices: QuizChoice[] = shuffled.map((text, i) => ({
    key: keys[i],
    text,
  }));

  return {
    id: row.id,
    uid: row.question_uid,
    stem: row.question_stem,
    primaryCategory: row.primary_category ?? null,
    questionExtraInfo: row.question_extra_information,
    choices,
  };
}
