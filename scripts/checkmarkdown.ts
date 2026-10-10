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
        file: relativePa
