// 反引号转义：防止表名/列名中的反引号破坏 SQL。MySQL 用双反引号转义。
export const esc = (s: string): string => s.replace(/`/g, '``')