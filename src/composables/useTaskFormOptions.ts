import {
  WORK_TYPE_LABELS,
  STATUS_LABELS,
  MOCK_PROJECTS,
  MOCK_USERS,
  PRIORITY_LABELS,
} from '@/utils/constants';

export function useTaskFormOptions() {
  const projects = MOCK_PROJECTS.map((user) => ({
    id: user.id,
    name: user.name,
  }));
  const users = MOCK_USERS.map((user) => ({
    id: user.id,
    name: user.name,
  }));

  const workTypeOptions = Object.entries(WORK_TYPE_LABELS).map(([value, label]) => ({
    id: value,
    name: label,
  }));

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    id: value,
    name: label,
  }));

  const priorities = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
    id: value,
    name: label,
  }));

  return {
    projects,
    priorities,
    users,
    workTypeOptions,
    statusOptions,
  };
}
