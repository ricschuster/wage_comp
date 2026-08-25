import { niceTicks, project, toPoints, type LinearScale } from './chart-scale.ts';

export interface Series {
  readonly label: string;
  /** CSS custom property or colour for the stroke. */
  readonly colour: string;
  /**
   * Dash pattern, so the series are distinguishable without relying on colour.
   * An empty string draws a solid line.
   */
  readonly dash: string;
  readonly points: readonly { x: number; y: number }[];
}

export interface ReferenceLine {
  readonly y: number;
  readonly label: string;
}

export interface LineChartProps {
  readonly title: string;
  readonly description: string;
  readonly series: readonly Series[];
  readonly formatX: (value: number) => string;
  readonly formatY: (value: number) => string;
  readonly referenceLine?: ReferenceLine;
  /** Forces the y axis to include zero, for charts where that matters. */
  readonly includeZero?: boolean;
}

const WIDTH = 760;
const HEIGHT = 340;
const MARGIN = { top: 16, right: 20, bottom: 44, left: 72 };

export function LineChart({
  title,
  description,
  series,
  formatX,
  formatY,
  referenceLine,
  includeZero = false,
}: LineChartProps) {
  const allPoints = series.flatMap((line) => line.points);
  if (allPoints.length === 0) {
    return null;
  }

  const xValues = allPoints.map((point) => point.x);
  const yValues = allPoints.map((point) => point.y);
  if (referenceLine) {
    yValues.push(referenceLine.y);
  }
  if (includeZero) {
    yValues.push(0);
  }

  const xAxis = niceTicks(Math.min(...xValues), Math.max(...xValues), 6);
  const yAxis = niceTicks(Math.min(...yValues), Math.max(...yValues), 5);

  const xScale: LinearScale = {
    domainMin: xAxis.min,
    domainMax: xAxis.max,
    rangeMin: MARGIN.left,
    rangeMax: WIDTH - MARGIN.right,
  };
  const yScale: LinearScale = {
    domainMin: yAxis.min,
    domainMax: yAxis.max,
    // Inverted: SVG y grows downward.
    rangeMin: HEIGHT - MARGIN.bottom,
    rangeMax: MARGIN.top,
  };

  return (
    <figure className="chart">
      <figcaption>
        <h3>{title}</h3>
        <p className="hint">{description}</p>
      </figcaption>

      <div className="chart-scroll">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${title}. ${description}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title>{title}</title>
          <desc>{description}</desc>

          {yAxis.ticks.map((tick) => {
            const y = project(tick, yScale);
            return (
              <g key={`y-${tick}`}>
                <line
                  className="grid"
                  x1={MARGIN.left}
                  x2={WIDTH - MARGIN.right}
                  y1={y}
                  y2={y}
                />
                <text className="tick" x={MARGIN.left - 8} y={y + 4} textAnchor="end">
                  {formatY(tick)}
                </text>
              </g>
            );
          })}

          {xAxis.ticks.map((tick) => {
            const x = project(tick, xScale);
            return (
              <text
                key={`x-${tick}`}
                className="tick"
                x={x}
                y={HEIGHT - MARGIN.bottom + 18}
                textAnchor="middle"
              >
                {formatX(tick)}
              </text>
            );
          })}

          <line
            className="axis"
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={HEIGHT - MARGIN.bottom}
            y2={HEIGHT - MARGIN.bottom}
          />

          {referenceLine ? (
            <g>
              <line
                className="reference"
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={project(referenceLine.y, yScale)}
                y2={project(referenceLine.y, yScale)}
              />
              <text
                className="reference-label"
                x={WIDTH - MARGIN.right}
                y={project(referenceLine.y, yScale) - 6}
                textAnchor="end"
              >
                {referenceLine.label}
              </text>
            </g>
          ) : null}

          {series.map((line) => (
            <polyline
              key={line.label}
              className="series"
              fill="none"
              stroke={line.colour}
              strokeDasharray={line.dash || undefined}
              points={toPoints(
                line.points.map(
                  (point) =>
                    [project(point.x, xScale), project(point.y, yScale)] as const,
                ),
              )}
            />
          ))}
        </svg>
      </div>

      <ul className="legend">
        {series.map((line) => (
          <li key={line.label}>
            <svg className="swatch" viewBox="0 0 24 8" aria-hidden="true">
              <line
                x1="0"
                x2="24"
                y1="4"
                y2="4"
                stroke={line.colour}
                strokeDasharray={line.dash || undefined}
              />
            </svg>
            {line.label}
          </li>
        ))}
      </ul>
    </figure>
  );
}
