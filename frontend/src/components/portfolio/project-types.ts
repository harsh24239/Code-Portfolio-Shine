export type StudyKind = 'ai' | 'database' | 'system';

export interface StudyProject {
  title: string;
  tag: string;
  description: string;
  year: string;
  link: string;
}

export const projectKind = (tag: string): StudyKind | null =>
  /langgraph|fastapi/i.test(tag) ? 'ai'
    : /mysql|dbms/i.test(tag) ? 'database'
      : /java|jdbc/i.test(tag) ? 'system' : null;
