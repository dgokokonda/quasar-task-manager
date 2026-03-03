import { boot } from 'quasar/wrappers';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart /*LineChart, PieChart*/ } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  // LegendComponent,
  GridComponent,
  // DatasetComponent,
  DataZoomComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

use([
  CanvasRenderer,
  BarChart,
  // LineChart,
  // PieChart,
  TitleComponent,
  TooltipComponent,
  // LegendComponent,
  GridComponent,
  // DatasetComponent,
  DataZoomComponent,
]);

export default boot(({ app }) => {
  app.component('v-chart', VChart);
});
