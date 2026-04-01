CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  nickname TEXT,
  avatar TEXT,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  sort_num INTEGER DEFAULT 0,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id INTEGER NOT NULL,
  account_type TEXT,
  bill_time DATETIME NOT NULL,
  remark TEXT,
  deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_bill_user_id ON bill(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_bill_time ON bill(bill_time);
CREATE INDEX IF NOT EXISTS idx_bill_category_id ON bill(category_id);
CREATE INDEX IF NOT EXISTS idx_category_user_type ON category(user_id, type);
CREATE INDEX IF NOT EXISTS idx_budget_user_month ON budget(user_id, month);

INSERT OR IGNORE INTO category (id, user_id, type, name, icon, sort_num, is_default)
VALUES
  (1, NULL, 'EXPENSE', '餐饮', 'silverware-fork-knife', 0, 1),
  (2, NULL, 'EXPENSE', '交通', 'train-car', 1, 1),
  (3, NULL, 'EXPENSE', '购物', 'shopping', 2, 1),
  (4, NULL, 'EXPENSE', '住房', 'home-city', 3, 1),
  (5, NULL, 'EXPENSE', '娱乐', 'movie-open-star', 4, 1),
  (6, NULL, 'EXPENSE', '其他', 'shape', 5, 1),
  (7, NULL, 'INCOME', '工资', 'briefcase-variant', 0, 1),
  (8, NULL, 'INCOME', '奖金', 'trophy-outline', 1, 1),
  (9, NULL, 'INCOME', '兼职', 'account-tie-outline', 2, 1),
  (10, NULL, 'INCOME', '其他', 'plus-circle-outline', 3, 1);
