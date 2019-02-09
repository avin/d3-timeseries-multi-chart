# d3-timeseries-multi-chart ![build](https://travis-ci.org/avin/d3-timeseries-multi-chart.svg?branch=master)

> Chart for multi timeseries datastreams.

## Demo

[ >> [Online demo](https://avin.github.io/react-flash-change) << ]

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

* `target` _(String)_ - Interval function. Params: `counter` - call action index number.
* `width` _(Number)_ - width of chart.
* `height` _(Number)_ - height of chart.
* `chartDuration` _(Number)_ - default chart duration.
* `showTimeAxis` _(Boolean)_ - show time axis.
* `timeAxisHeight` _(Number)_ - time axis height.
* `tipTimeWidth` _(Number)_ - tip time width.
* `tipTimeFormat` _(String)_ - tip time dateTime format string.

### Chart data item options

* `label` _(String)_ - DataStream human name.
* `color` _(String)_ - hex color string for data line.
* `data` _(Array)_ - array of data values. Array item structure: [date: DateTime, value: Number].
* `showAxis` _(Boolean)_ - Show Y axis for current dataStream.
* `strokeWidth` _(Number)_ - Stroke width of data line.
* `showDots` _(Boolean)_ - Show data points on data line.

## License

MIT © [avin](https://github.com/avin)
