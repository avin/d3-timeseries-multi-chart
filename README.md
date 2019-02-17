# d3-timeseries-multi-chart ![build](https://travis-ci.org/avin/d3-timeseries-multi-chart.svg?branch=master)

> Chart for multi timeseries datastreams.

## Features

-   Draw some data lines on same chart.
-   Draw separate axises or common one for data lines.
-   Canvas render mode for data lines to level up performance.
-   Zoom and drag time periods.
-   Use Line, Area or Bar drawing styles for data lines.
-   Some curve types for data lines.
-   Preview data values on mouse over.
-   Allow to live update chart's data.

## Demo

[ >> [Online demo](https://avin.github.io/d3-timeseries-multi-chart) << ]

[![Preview](./assets/preview.png)](https://avin.github.io/d3-timeseries-multi-chart)

## Install

```bash
# Yarn
yarn add @avinlab/d3-timeseries-multi-chart

# NPM
npm install --save @avinlab/d3-timeseries-multi-chart
```

## Usage

```js
import TimeseriesMultiChart from '@avinlab/d3-timeseries-multi-chart';

const chart = new TimeseriesMultiChart({
    target: '#chartContainer',
    chartDuration: 3600 * 1000,
    width: 800,
    height: 600,
    showTimeAxis: false,
});
chart.render([
    {
        label: 'Data 1',
        color: '#F5498B',
        data: [
            [new Date('2019-01-05 13:00:00'), 1.5],
            [new Date('2019-01-05 13:01:00'), 1.2],
            [new Date('2019-01-05 13:02:00'), 1.0],
            [new Date('2019-01-05 13:03:00'), 0.5],
        ],
        showAxis: true,
        strokeWidth: 2,
    },
    {
        label: 'Data 2',
        color: '#43BF4D',
        data: [
            [new Date('2019-01-05 13:00:00'), 3.2],
            [new Date('2019-01-05 13:01:00'), 1.2],
            [new Date('2019-01-05 13:02:00'), 5.2],
            [new Date('2019-01-05 13:03:00'), 1.2],
        ],
        showAxis: true,
        showDots: true,
    },
]);
```

## API

### Chart options

-   `target` _(String | Element)_ - target element to mount chart svg (default: `#chart`).
-   `renderMode` _(String)_ - render mode for dataLines drawing (`canvas` | `svg`) (default: `canvas`).
-   `width` _(Number)_ - width of chart (default: `500`).
-   `height` _(Number)_ - height of chart (default: `300`).
-   `chartDuration` _(Number)_ - default chart duration (default: `3600000` (1hour)).
-   `showTimeAxis` _(Boolean)_ - show time axis (default: `true`).
-   `timeAxisHeight` _(Number)_ - time axis height (default: `20`).
-   `tipTimeWidth` _(Number)_ - tip time width (default: `125`).
-   `tipTimeFormat` _(String)_ - tip time dateTime format string (default: `%Y-%m-%d %H:%M:%S`).
-   `commonDataAxis` _(Boolean)_ - common axis for data lines (default: `false`).
-   `commonDataAxisWidth` _(Number)_ - width of common data axis (default: `30`).
-   `autoScale` _(Boolean)_ - auto scale data points of visible part.
-   `chartPaddingFactor` _(Number)_ - data lines padding factor : 1/N of chart height (less is more) (default: `30`).
-   `draggable` _(Boolean)_ - allow to drag (default: `true`).
-   `zoomable` _(Boolean)_ - allow to zoom (default: `true`).
-   `showMouseTip` _(Boolean)_ - enable on mouseover values display (default: ).
-   `minZoomTime` _(Number)_ - min limit for zooming (-1 is disabled) (default: `-1`).
-   `maxZoomTime` _(Number)_ - max limit for zooming (-1 is disabled) (default: `-1`).
-   `dataAxisTickHeight` _(Number)_ - tick of data axis height (default: `20`).

### Chart methods

-   `render` - render data on chart. Params: (`DataStreamsArray` - required first time)
-   `update` - `render` method alias.
-   `setChartDuration` - update chart duration (change time zoom level). Params: (newChartDuration)
-   `setLastChartTime` - update last chart time (change chart position). Params: (newLastChartTime)
-   `on` - add event handler.
-   `off` - remove event handler.

### Chart DataStreamsArray item options

-   `data` _(Array)_ **Required** - array of data values. Array item structure: [date: DateTime, value: Number].
-   `color` _(String)_ - color string for data line.
-   `colorGradient` _(Array)_ - colors for data line gradient fill.
-   `label` _(String)_ - dataStream human name.
-   `showAxis` _(Boolean)_ - show Y axis for current dataStream (default: `true`).
-   `strokeWidth` _(Number)_ - stroke width of data line (default: `1`).
-   `showDots` _(Boolean)_ - show data points on data line (default: `false`).
-   `dotsRadius` _(Number)_ - data points radius (default: x2 of strokeWidth).
-   `type` _(String)_ - type of data line (`line` | `area` | `bar`) (default: `line`).
-   `areaFillOpacity` _(Number)_ - opacity factor for color filling of area data line type.
-   `curve` _(String)_ - data line curve type (`linear` | `stepAfter` | `stepBefore` | `monotoneX`) (default: `linear`).
-   `scaleRange` _(array)_ - Scale result range in percents of chart height `[min, max]`. For Example `[0, 50]` - draw
    data line in bottom part of chart and [50, 100] in top one.
-   `scaleDomain` _(Array)_ - Custom scale domain `[min, max]`.
-   `scaleVisible` _(Boolean)_ - Auto scale data line in visible time period.

### Event handlers params

#### zoom

-   `beforeChartDuration` - chart duration before zoom
-   `afterChartDuration` - chart duration after zoom
-   `scaleFactor` - zoom scale factor

#### dragStart

-   `startX` - mouse `x` value on start dragging

#### dragEnd

-   `endX` - mouse `y` value on finish dragging

#### drag

-   `beforeLastChartTime` - last chart time before drag
-   `afterLastChartTime` - last chart time after drag
-   `diff` - dragging diff in pixels

## License

MIT © [avin](https://github.com/avin)
