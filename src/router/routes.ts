import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@/pages/TasksPage.vue') }],
  },
  {
    path: '/tasks',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'tasks', // имя перенесено на дочерний маршрут
        component: () => import('@/pages/TasksPage.vue'),
      },
    ],
  },
  {
    path: '/tasks/:id',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'task', // имя перенесено на дочерний маршрут
        component: () => import('@/pages/TaskDetailPage.vue'),
      },
    ],
  },
  {
    path: '/projects',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'projects', // имя перенесено на дочерний маршрут
        component: () => import('@/pages/ProjectsPage.vue'),
      },
    ],
  },
  {
    path: '/reports',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'reports', // имя перенесено на дочерний маршрут
        component: () => import('@/pages/ReportsPage.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
