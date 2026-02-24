import { WORK_TYPE_LABELS, STATUS_LABELS, MOCK_PROJECTS, MOCK_USERS } from '@/utils/constants';

export function useTaskFormOptions() {
  const projects = MOCK_PROJECTS;
  const users = MOCK_USERS;

  const workTypeOptions = Object.entries(WORK_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return {
    projects,
    users,
    workTypeOptions,
    statusOptions,
  };
}
