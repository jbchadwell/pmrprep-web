import fs from "fs";
import path from "path";
import process from "process";
import { createClient } from "@supabase/supabase-js";

// =====================================
// Usage:
//   node scripts/import-questions.mjs ./pmrprep_questions.csv
// =====================================

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/import-questions.mjs /path/to/file.csv");
  process.exit(1);
}

// --------- Load .env.local (so you don't need to export vars manually) ---------
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();

    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvLocal();

// --------- Supabase client ---------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "Missing env vars. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

// --------- CSV parser (supports quoted commas/newlines) ---------
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        field = "";
        if (row.some((x) => x !== "")) rows.push(row);
        row = [];
      } else if (c !== "\r") {
        field += c;
      }
    }
  }
  row.push(field);
  if (row.some((x) => x !== "")) rows.push(row);

  return rows;
}

const csvText = fs.readFileSync(path.resolve(csvPath), "utf8");
const [header, ...dataRows] = parseCSV(csvText);

const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

function get(row, name) {
  const i = idx[name];
  return i === undefined ? null : (row[i] ?? "").trim() || null;
}

// --------- Build records ---------
const records = dataRows.map((r) => ({
  question_uid: get(r, "Question ID"),
  question_stem: get(r, "Question Stem"),
  correct_answer: get(r, "Correct Answer"),
  distractor_1: get(r, "Distractor 1"),
  distractor_2: get(r, "Distractor 2"),
  distractor_3: get(r, "Distrator 3") ?? get(r, "Distractor 3"),

  correct_answer_explanation: get(r, "Correct Answer Explanation"),
  distractor_1_explanation: get(r, "Distractor 1 Explanation"),
  distractor_2_explanation: get(r, "Distractor 2 Explanation"),
  distractor_3_explanation: get(r, "Distractor 3 Explanation"),

  question_extra_information: get(r, "Question Extra Information"),
  answer_extra_information: get(r, "Answer Extra Information"),

  primary_category: get(r, "Primary Category"),
  secondary_category: get(r, "Secondary Category"),
  tertiary_category: get(r, "Tertiary Category"),

  diagnosis: get(r, "Diagnosis"),
  order: get(r, "Order"),
  treatment: get(r, "Treatment"),
  prognosis: get(r, "Prognosis"),
  laboratory: get(r, "Laboratory"),
  radiology: get(r, "Radiology"),
  ultrasound: get(r, "Ultrasound"),
  embryology: get(r, "Embryology"),
  epidemiology: get(r, "Epidemiology"),
  risk_factors: get(r, "Risk Factors"),
  physical_exam_testing: get(r, "Physical Exam Testing"),
  histology: get(r, "Histology"),
  genetics: get(r, "Genetics"),
  physiology: get(r, "Physiology"),
  anatomy: get(r, "Anatomy"),
  physics: get(r, "Physics"),
  statistics: get(r, "Statistics"),
  pharmacology: get(r, "Pharmacology"),

  citations: get(r, "Citations"),
}));

// --------- Validate: report ALL missing required fields ---------
const required = [
  "question_uid",
  "question_stem",
  "correct_answer",
  "distractor_1",
  "distractor_2",
  "distractor_3",
  "correct_answer_explanation",
  "distractor_1_explanation",
  "distractor_2_explanation",
  "distractor_3_explanation",
  "primary_category",
];

const issues = [];

for (const [i, rec] of records.entries()) {
  const missing = required.filter((k) => !rec[k]);
  if (missing.length) {
    issues.push({
      csvRow: i + 2, // header is row 1
      question_uid: rec.question_uid || "(missing Question ID)",
      missing,
    });
  }
}

if (issues.length) {
  console.error(`\n❌ Found ${issues.length} row(s) with missing required fields:\n`);
  for (const it of issues) {
    console.error(`Row ${it.csvRow} | ${it.question_uid} | missing: ${it.missing.join(", ")}`);
  }
  console.error("\nFix these in Excel, re-export CSV, then re-run the import.\n");
  process.exit(1);
}

// --------- Import to Supabase (upsert by question_uid) ---------
console.log(`Parsed ${records.length} questions. Uploading in batches...`);

const batchSize = 500;
for (let i = 0; i < records.length; i += batchSize) {
  const batch = records.slice(i, i + batchSize);

  const { error } = await supabase
    .from("questions")
    .upsert(batch, { onConflict: "question_uid" });

  if (error) {
    console.error("Supabase error:", error);
    process.exit(1);
  }

  console.log(`Uploaded ${Math.min(i + batchSize, records.length)} / ${records.length}`);
}

console.log("✅ Import complete.");

