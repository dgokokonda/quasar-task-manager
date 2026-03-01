/**
 * Генерирует server/db-1001.json с 1001 задачей (те же projects/users, что в db.json).
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENTRIES_AMOUNT = 1001;
const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, `db-${ENTRIES_AMOUNT}.json`);

const WORK_TYPES = ['editing', 'color', 'graphics', 'sound'];
const STATUSES = ['not_started', 'in_progress', 'on_hold', 'completed'];
const PROJECT_IDS = [1, 2];
const ASSIGNEE_POOL = [[1], [2], [3], [1, 2], [2, 3], [1, 3], [1, 2, 3]];
const PRIORITIES = ['low', 'medium', 'high'];

const names = [
  'Монтаж рекламного ролика', 'Цветокоррекция клипа', 'Звукозапись сингла', 'Разработка CRM-системы',
  'Монтаж тизера', 'Цветокоррекция сцены', 'Озвучка персонажа', 'Графика для соцсетей',
  'Монтаж интервью', 'Финальная цветокоррекция', 'Саунд-дизайн', 'Анимация логотипа',
  'Черновая нарезка', 'Коррекция кожи', 'Запись голоса', 'Рендер 3D-модели',
  'Сведение трека', 'Титры и субтитры', 'Клининг аудио', 'Композитинг',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomDate(startYear, endYear) {
  const y = randomInt(startYear, endYear);
  const m = String(randomInt(1, 12)).padStart(2, '0');
  const d = String(randomInt(1, 28)).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function randomPriority() {
  return randomItem(PRIORITIES);
}

const tasks = [];
for (let i = 1; i <= ENTRIES_AMOUNT; i++) {
  const start = randomDate(2023, 2026);
  const end = randomDate(2024, 2027);
  tasks.push({
    id: i,
    name: `${randomItem(names)} #${i}`,
    projectId: randomItem(PROJECT_IDS),
    workType: randomItem(WORK_TYPES),
    assignees: randomItem(ASSIGNEE_POOL),
    plannedHours: randomInt(2, 40),
    actualHours: randomInt(0, 40),
    status: randomItem(STATUSES),
    startDate: start,
    endDate: end > start ? end : start,
    description: `Описание задачи ${i}.`,
    order: i - 1,
    priority: randomPriority(),
  });
}

const db = {
  tasks,
  projects: [
    { id: '1', name: "Рекламный ролик Nike", code: 'NIKE-2024' },
    { id: '2', name: "Клип 'Лето'", code: 'MUSIC-001' },
  ],
  users: [
    { id: '1', name: 'Анна Петрова', role: 'Монтажер' },
    { id: '2', name: 'Иван Сидоров', role: 'Колорист' },
    { id: '3', name: 'Мария Иванова', role: 'Звукорежиссер' },
  ],
  filters: {
    statuses: [],
    search: "",
    workType: [],
    assigneeId: [],
    dateFrom: "",
    dateTo: "",
    endDateFrom: "",
    endDateTo: "",
    hoursMin: 0,
    hoursMax: 0,
    sortBy: "order",
    sortOrder: "asc"
  },
  pageData: {
    page: 1,
    limit: 50,
    next: true,
    prev: false,
    total: Math.ceil(ENTRIES_AMOUNT / 50),
    totalEntries: ENTRIES_AMOUNT
  }
};

writeFileSync(outPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Written', outPath, 'with', tasks.length, 'tasks');
