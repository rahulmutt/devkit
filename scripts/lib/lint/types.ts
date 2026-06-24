export interface SkillRecord {
  name: string;
  dir: string;
  description: string;
  hasFrontmatter: boolean;
  body: string;
  referenceFiles: string[];
}

export interface Finding {
  level: "error" | "warn";
  skill: string;
  message: string;
}
