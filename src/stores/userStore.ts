import { defineStore } from 'pinia';
import { userService } from '@/services/userService';
import { ref } from 'vue';
import type { User } from '@/types';

export const userStore = defineStore('userStore', () => {
  const users = ref<User[]>([]);

  async function fetchUsers() {
    const response = await userService.getUsers();
    if (response) users.value = response;
  }

  return {
    users,
    fetchUsers,
  };
});
