import { ref, computed } from 'vue';
import { format, eachDayOfInterval, subDays, subMonths, subYears } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Task } from '@/types';
import type { CallbackDataParams } from 'echarts/types/dist/shared';

export function useTaskChart(tasks: Task[]) {
  const dateRange = ref<'year' | 'month' | 'quarter' | 'week'>('month');
  const chartType = ref<'start' | 'end' | 'active'>('start');
  const rangeOptions = [
    {
      label: 'Год',
      value: 'year',
    },
    {
      label: 'Квартал',
      value: 'quarter',
    },
    {
      label: 'Месяц',
      value: 'month',
    },
    {
      label: 'Неделя',
      value: 'week',
    },
  ];

  const tasksByStartDate = computed(() => {
    const stats: Record<string, number> = {};
    tasks.forEach((task) => {
      const date = format(new Date(task.startDate), 'yyyy-MM-dd');
      stats[date] = (stats[date] || 0) + 1;
    });
    return stats;
  });

  const tasksByEndDate = computed(() => {
    const stats: Record<string, number> = {};
    tasks.forEach((task) => {
      const date = format(new Date(task.endDate), 'yyyy-MM-dd');
      stats[date] = (stats[date] || 0) + 1;
    });
    return stats;
  });

  const activeTasksByDay = computed(() => {
    if (!tasks.length) return {};

    const minDate = new Date(Math.min(...tasks.map((t) => new Date(t.startDate).getTime())));
    const maxDate = new Date(Math.max(...tasks.map((t) => new Date(t.endDate).getTime())));
    const days = eachDayOfInterval({ start: minDate, end: maxDate });

    const stats: Record<string, number> = {};
    days.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      stats[dateStr] = tasks.filter(
        (task) => new Date(task.startDate) <= day && new Date(task.endDate) >= day,
      ).length;
    });

    return stats;
  });

  const filteredData = computed(() => {
    const stats =
      chartType.value === 'start'
        ? tasksByStartDate.value
        : chartType.value === 'end'
          ? tasksByEndDate.value
          : activeTasksByDay.value;

    const now = new Date();
    let startDate: Date;

    switch (dateRange.value) {
      case 'year':
        startDate = subYears(now, 1);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;

      default:
        startDate = subMonths(now, 1);
        break;
    }

    return Object.entries(stats)
      .filter(([date]) => new Date(date) >= startDate)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  });

  const chartOption = computed(() => ({
    title: {
      text: `Распределение задач по ${chartType.value === 'start' ? 'дате начала' : chartType.value === 'end' ? 'дате окончания' : 'активным дням'}`,
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: CallbackDataParams[]) => {
        const data = params[0];
        if (!data) return '';

        let value: string;
        if (typeof data.value === 'number' || typeof data.value === 'string') {
          value = data.value.toString();
        } else {
          value = '0';
        }

        return `${data.name}<br/>Задач: ${value}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: filteredData.value.map(([date]) => format(new Date(date), 'dd.MM', { locale: ru })),
      axisLabel: { rotate: 45 },
    },
    yAxis: {
      type: 'value',
      name: 'Количество задач',
    },
    series: [
      {
        name: 'Задачи',
        type: 'bar',
        data: filteredData.value.map(([, count]) => count),
        itemStyle: {
          color: '#1976D2',
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '60%',
      },
    ],
    dataZoom:
      filteredData.value.length > 30
        ? [
            { type: 'slider', start: 0, end: 100 },
            { type: 'inside', start: 0, end: 100 },
          ]
        : [],
  }));

  return { chartType, dateRange, rangeOptions, chartOption };
}
