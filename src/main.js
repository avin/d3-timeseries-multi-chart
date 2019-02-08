import * as d3 from 'd3';

const defaults = {
    // target element or selector to contain the svg
    target: '#chart',

    // width of chart
    width: 500,

    // height of chart
    height: 300,

    // Default chart duration
    chartDuration: 3600 * 1000, // 1 hour

    // margin
    margin: { top: 5, right: 20, bottom: 5, left: 20 },

    showTimeAxis: true,
    timeAxisHeight: 20,
};

class TimeseriesMultiChart {
    constructor(options) {
        this.set(options);

        this.dragging = false;
        this.currentChartDuration = this.chartDuration;

        this.init();
    }

    /**
     * Set configuration options.
     * @param config
     */
    set(config) {
        Object.assign(this, defaults, config);
    }

    /**
     * Dimensions without margin.
     * @returns {number[]}
     */
    dimensions() {
        const { width, height, margin } = this;
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;
        return [w, h];
    }

    init() {
        const { target, width, height, margin } = this;

        this.svg = d3.select(target).append('svg');

        this.chart = this.svg
            .attr('width', width)
            .attr('height', height)
            .append('g');

        this.xAxisScale = d3.scaleLinear().range([0, width]);
        this.xTimeScale = d3.scaleTime().range([0, width]);
        this.yAxisScale = d3.scaleLinear().range([height - (this.showTimeAxis ? this.timeAxisHeight : 0), 0]);

        this.initDrag();
        this.initZoom();
    }

    initZoom() {
        // Zoom chart action
        const zoom = d3.zoom().on('zoom', () => {
            this.currentChartDuration = this.chartDuration * (1 / d3.event.transform.k);

            this.chart
                .select('.tipGroup')
                .transition()
                .style('opacity', '0');

            this.update();
        });
        this.svg.call(zoom);
    }

    initDrag() {
        let startX;
        const drag = d3
            .drag()
            .clickDistance(10)
            .on('start', () => {
                this.dragging = true;
                startX = d3.event.x;
                this.chart
                    .select('.tipGroup')
                    .transition()
                    .style('opacity', '0');
            })
            .on('end', () => {
                this.dragging = false;
                this.chart
                    .select('.tipGroup')
                    .transition()
                    .style('opacity', '1');
            })
            .on('drag', () => {
                const diff = d3.event.x - startX;

                if (diff < -10 || diff > 10) {
                    startX = d3.event.x;

                    const timeDiff = (this.currentChartDuration / this.width) * diff;

                    this.lastChartTime -= timeDiff;
                    this.lastChartTime = Math.min(this.maxTime + this.currentChartDuration / 5, this.lastChartTime);
                    this.lastChartTime = Math.max(this.minTime + this.currentChartDuration / 2, this.lastChartTime);

                    this.update();
                }
            });

        this.svg.call(drag);
    }

    renderAxis() {}

    renderTimeAxis() {
        if (!this.showTimeAxis) {
            return;
        }

        this.xTimeScale.domain([
            new Date(this.lastChartTime - this.currentChartDuration),
            new Date(this.lastChartTime),
        ]);

        this.xTimeAxis =
            this.xTimeAxis ||
            this.chart
                .append('g')
                .attr('class', 'timeAxis')
                .attr('transform', `translate(0, ${this.height - this.timeAxisHeight})`);

        this.xTimeAxis.call(d3.axisBottom(this.xTimeScale));
    }

    renderLinesAxises() {}

    renderLines() {
        const line = d3
            .line()
            .x(([time]) => this.xAxisScale(+time))
            .y(([time, value]) => this.yAxisScale(value));

        this.chart
            .selectAll('.dataLine')
            .data(this.dataStreams)
            .join(enter => enter.append('path').attr('class', 'dataLine'))
            .each((dataStream, idx, els) => {
                const path = els[idx];

                const { color, data } = dataStream;

                this.yAxisScale.domain(d3.extent(data, d => d[1]));

                const line = d3
                    .line()
                    .x(([time]) => this.xAxisScale(+time))
                    .y(([time, value]) => this.yAxisScale(value));

                d3.select(path)
                    .datum(data)
                    .attr('d', line)
                    .attr('stroke', color)
                    .attr('fill', 'none');
            });
    }

    render(dataStreams) {
        if (dataStreams) {
            this.dataStreams = dataStreams;
        }

        this.maxTime = Number.MAX_SAFE_INTEGER * -1;
        this.minTime = Number.MAX_SAFE_INTEGER;

        this.dataStreams.forEach(({ data }) => {
            const timeExtent = d3.extent(data, d => d[0]);
            this.minTime = Math.min(timeExtent[0], this.minTime);
            this.maxTime = Math.max(timeExtent[1], this.maxTime);
        });

        if (this.lastChartTime === undefined) {
            this.lastChartTime = this.maxTime;
        }

        this.xAxisScale.domain([this.lastChartTime - this.currentChartDuration, this.lastChartTime]);

        this.renderTimeAxis();
        this.renderLinesAxises();
        this.renderLines();
    }

    update(dataStreams) {
        this.render(dataStreams);
    }
}

export default TimeseriesMultiChart;
