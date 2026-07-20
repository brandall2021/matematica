import { MathResponse, PlotResponse } from '../../core/services/api.service';

export interface Operation {
  id: string;
  label: string;
  example: string;
  category: string;
  needsPoint?: boolean;
  pointLabel?: string;
  needsRange?: boolean;
  needsTwoNumbers?: boolean;
  isPlot?: boolean;
}

export interface HistoryEntry {
  operation: string;
  operationLabel: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  expanded: boolean;
}
