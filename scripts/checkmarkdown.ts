import { promises as fs } from "fs";
import path from "path";

const EXTENSIONS = new Set([".md", ".mdx"]);
const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".cache",
]);

interface CheckError {
  file: string;
  line: number;
  message: string;
}

const errors: CheckError[] = [];

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function checkFile(filePath: string): Promise<void> {
  const raw = await fs.readFile(filePath, "utf8");

  if (raw.length === 0) {
    return;
  }

  const relativePath = path.relative(process.cwd(), filePath);
  const lines = raw.split("\n");

  if (lines[lines.length - 1] !== "") {
    errors.push({
      file: relativePath,
      line: lines.length,
      message: "Missing final newline",
    });
  }

  const contentLines =
    lines[lines.length - 1] === "" ? lines.slice(0, -1) : lines;

  contentLines.forEach((lineText, index) => {
    const lineNumber = index + 1;

    if (lineText.includes("\t")) {
      errors.push({
        file: relativePath,
        line: lineNumber,
        message: "Tab character found (use spaces instead)",
      });
    }

    if (/[ \t]+$/.test(lineText)) {
      errors.push({
        file: relativePath,
        line: lineNumber,
        message: "Trailing whitespace",
      });
    }
  });
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const files = await walk(rootDir);

  if (files.length === 0) {
    console.log("No .md or .mdx files found.");
    process.exit(0);
  }

  for (const file of files) {
    await checkFile(file);
  }

  if (errors.length > 0) {
    console.error(`\nMarkdown check failed with ${errors.length} error(s):\n`);
    for (const err of errors) {
      console.error(`  ${err.file}:${err.line} - ${err.message}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(`Markdown check passed (${files.length} file(s) scanned).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Markdown checker crashed:", err);
  process.exit(1);
});
