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
    tipTimeWidth: 125,
    tipTimeFormat: '%Y-%m-%d %H:%M:%S',
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
        this.yAxisScales = [];

        this.svg.call(this.initDrag());
        this.svg.call(this.initZoom());
        this.svg.call(this.initMouseTip());
    }

    initZoom() {
        // Zoom chart action
        return d3.zoom().on('zoom', () => {
            this.currentChartDuration = this.chartDuration * (1 / d3.event.transform.k);

            this.chart
                .select('.tipGroup')
                .transition()
                .style('opacity', '0');

            this.update();
        });
    }

    initDrag(svg) {
        let startX;
        return d3
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

                    const timeDiff = this.currentChartDuration / this.width * diff;

                    this.lastChartTime -= timeDiff;
                    this.lastChartTime = Math.min(this.maxTime + this.currentChartDuration / 5, this.lastChartTime);
                    this.lastChartTime = Math.max(this.minTime + this.currentChartDuration / 2, this.lastChartTime);

                    this.update();
                }
            });
    }

    initMouseTip(svg) {
        const showTipGroup = () => {
            if (!this.dragging) {
                this.tipGroup.style('opacity', '1');
            }
        };

        const hideTipGroup = () => {
            this.tipGroup.style('opacity', '0');
        };

        return svg =>
            svg
                .on('mouseover', () => {
                    showTipGroup();
                })
                .on('mouseout', () => {
                    hideTipGroup();
                })
                .on('mousemove', () => {
                    const mouse = d3.mouse(svg.node());
                    const xDate = this.xAxisScale.invert(mouse[0]);

                    // Draw tooltip vertical line
                    this.tipGroup
                        .select(`.tipMouseLine`)
                        .attr('d', () =>
                            d3.line()([
                                [mouse[0], this.height - (this.showTimeAxis ? this.timeAxisHeight : 0)],
                                [mouse[0], 0],
                            ]),
                        );

                    let positionX = mouse[0] - this.tipTimeWidth / 2;
                    positionX = Math.min(positionX, this.width - this.tipTimeWidth);
                    positionX = Math.max(positionX, 0);

                    this.tipGroup.select('.tipTime').attr('transform', `translate(${positionX}, ${this.height - 20})`);

                    this.tipGroup.select('.tipTimeText').text(d3.timeFormat(this.tipTimeFormat)(xDate));

                    // Move tooltip on lines
                    this.tipGroup.selectAll(`.dataStreamTip`).each((item, idx, els) => {
                        const bisect = d3.bisector(([date]) => date).right;

                        const pointIdx = bisect(this.dataStreams[idx].data, xDate);
                        const yScale = this.yAxisScales[idx];

                        if (this.dataStreams[idx].data[pointIdx]) {
                            const y = yScale(this.dataStreams[idx].data[pointIdx][1]);
                            d3.select(els[idx]).attr('transform', `translate(${mouse[0]},${y})`);
                            const value = parseFloat(Number(this.dataStreams[idx].data[pointIdx][1]).toFixed(1));
                            d3
                                .select(els[idx])
                                .select('.tipText')
                                .text(value);
                        } else {
                            d3.select(els[idx]).attr('transform', `translate(-999,-999)`);
                        }
                    });
                });
    }

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

    renderDataAxises() {
        let drawCounter = 0;
        this.chart
            .selectAll('.dataAxis')
            .data(this.dataStreams)
            .join(enter => enter.append('g').attr('class', 'dataAxis'))
            .each((dataStream, idx, els) => {
                const axis = els[idx];
                const yScale = this.yAxisScales[idx];

                const { color, showAxis = true } = dataStream;
                if (!showAxis) {
                    return;
                }

                drawCounter += 1;

                d3
                    .select(axis)
                    .attr('transform', `translate(${drawCounter * 30}, 0)`)
                    .call(d3.axisLeft(yScale))
                    .call(axis => axis.select('.domain').remove())
                    .call(axis => axis.selectAll('line').remove())
                    .call(axis => axis.selectAll('text').attr('fill', color));
            });
    }

    renderDataLines() {
        this.chart
            .selectAll('.dataLine')
            .data(this.dataStreams)
            .join(enter => enter.append('path').attr('class', 'dataLine'))
            .each((dataStream, idx, els) => {
                const path = els[idx];

                const { color, data, strokeWidth = 1 } = dataStream;

                this.yAxisScales[idx] = d3
                    .scaleLinear()
                    .range([this.height - (this.showTimeAxis ? this.timeAxisHeight : 0), 0])
                    .domain(d3.extent(data, d => d[1]));

                const line = d3
                    .line()
                    .x(([time]) => this.xAxisScale(+time))
                    .y(([time, value]) => this.yAxisScales[idx](value));

                d3
                    .select(path)
                    .datum(data)
                    .attr('d', line)
                    .attr('stroke', color)
                    .attr('stroke-width', strokeWidth)
                    .attr('fill', 'none');
            });
    }

    renderLinesTipCircles() {
        this.tipGroup
            .selectAll('.dataStreamTip')
            .data(this.dataStreams)
            .enter()
            .append('g')
            .attr('class', 'dataStreamTip')
            .call(g =>
                g

                    .append('circle')
                    .attr('class', 'tipCircle')
                    .attr('r', 4)
                    .style('stroke', d => d.color),
            )
            .call(g => g.append('text').attr('class', 'tipText'));
    }

    renderTipGroup() {
        if (this.tipGroup) {
            return;
        }

        this.tipGroup = this.chart
            .append('g')
            .attr('class', 'tipGroup')
            .style('opacity', '0');

        this.tipGroup
            .append('path') // this is the black vertical line to follow mouse
            .attr('class', 'tipMouseLine')
            .attr('stroke', this.tipStrokeColor)
            .attr('stroke-width', 2);

        const tipTime = this.tipGroup.append('g').attr('class', 'tipTime');
        tipTime
            .append('rect')
            .attr('class', 'tipTimeRect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.tipTimeWidth)
            .attr('height', this.timeAxisHeight)
            .attr('fill', this.tipStrokeColor);

        tipTime
            .append('text')
            .attr('class', 'tipTimeText')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${this.tipTimeWidth / 2}, ${this.timeAxisHeight / 2})`);
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
        this.renderDataLines();
        this.renderDataAxises();
        this.renderTipGroup();
        this.renderLinesTipCircles();
    }

    update(dataStreams) {
        this.render(dataStreams);
    }
}

export default TimeseriesMultiChart;
