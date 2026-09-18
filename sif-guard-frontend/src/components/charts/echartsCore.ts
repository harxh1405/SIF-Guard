import * as echarts from 'echarts/core';
import {
  LineChart,
  BarChart,
  ScatterChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  VisualMapComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register only required ECharts modules for optimal bundle size and tree-shaking
echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  VisualMapComponent,
  TitleComponent,
  CanvasRenderer,
]);

export type { EChartsCoreOption as EChartsOption, EChartsType } from 'echarts/core';
export default echarts;
