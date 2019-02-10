import * as d3 from 'd3';

const defaults = {
    // target element to mount chart svg
    target: '#chart',

    // width of chart
    width: 500,

    // height of chart
    height: 300,

    // default chart duration
    chartDuration: 3600 * 1000, // 1 hour

    // show time axis
    showTimeAxis: true,

    // One axis fot all data lines
    commonDataAxis: false,

    // Width of common data axis
    commonDataAxisWidth: 30,

    // Data lines padding factor (less is more)
    chartPaddingFactor: 30,

    // Auto scale data points of visible part
    autoScale: false,

    // height of time axis
    timeAxisHeight: 20,

    // width of time label of the tip line
    tipTimeWidth: 125,

    // tip line time's format
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

    get chartWidth() {
        return this.width - (this.commonDataAxis ? this.commonDataAxisWidth : 0);
    }

    get chartHeight() {
        return this.height - (this.showTimeAxis ? this.timeAxisHeight : 0);
    }

    init() {
        const { target, width, height, chartWidth, chartHeight } = this;

        this.svg = d3.select(target).append('svg');

        this.chart = this.svg
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${this.commonDataAxis ? this.commonDataAxisWidth : 0}, 0)`)
            .style('pointer-events', 'all');

        // Mouse event catcher
        this.chart
            .append('rect')
            .attr('fill', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', chartWidth)
            .attr('height', chartHeight);

        this.chart
            .append('clipPath')
            .attr('id', 'chart-clip')
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', chartWidth)
            .attr('height', chartHeight);

        this.xAxisScale = d3.scaleLinear().range([0, chartWidth]);
        this.xTimeScale = d3.scaleTime().range([0, chartWidth]);
        this.yAxisScales = [];
        this.commonYAxisScale = d3.scaleLinear().range([chartHeight, 0]);

        this.initDrag();
        this.initZoom();
        this.initMouseTip();
    }

    initZoom() {
        // Zoom chart action
        const zoomAction = d3.zoom().on('zoom', () => {
            this.currentChartDuration = this.chartDuration * (1 / d3.event.transform.k);

            this.chart
                .select('.tipGroup')
                .transition()
                .style('opacity', '0');

            this.update();
        });

        this.svg.call(zoomAction);
    }

    initDrag() {
        let startX;
        const dragAction = d3
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

                    const timeDiff = (this.currentChartDuration / this.chartWidth) * diff;

                    this.lastChartTime -= timeDiff;
                    this.lastChartTime = Math.min(this.maxTime + this.currentChartDuration / 5, this.lastChartTime);
                    this.lastChartTime = Math.max(this.minTime + this.currentChartDuration / 2, this.lastChartTime);

                    this.update();
                }
            });

        this.svg.call(dragAction);
    }

    initMouseTip() {
        this.showTipGroup = () => {
            if (!this.dragging) {
                this.tipGroup.style('opacity', '1');
            }
        };

        this.hideTipGroup = () => {
            this.tipGroup.style('opacity', '0');
        };

        this.chart
            .on('mouseover', () => {
                [this.mouseX, this.mouseY] = d3.mouse(this.chart.node());

                this.showTipGroup();
            })
            .on('mouseleave', () => {
                this.hideTipGroup();
            })
            .on('mousemove', () => {
                [this.mouseX, this.mouseY] = d3.mouse(this.chart.node());

                this.updateTipGroup();
            });
    }

    updateTipGroup() {
        const { mouseX, mouseY } = this;

        if (mouseX === undefined) {
            return;
        }

        const xDate = this.xAxisScale.invert(mouseX);

        this.mouseVerticalPosition = Math.round(mouseY / this.height) ? 'bottom' : 'top';

        // Draw tooltip vertical line
        this.tipGroup
            .select(`.tipMouseLine`)
            .attr('d', () =>
                d3.line()([[mouseX, this.height - (this.showTimeAxis ? this.timeAxisHeight : 0)], [mouseX, 0]]),
            );

        let positionX = mouseX - this.tipTimeWidth / 2;
        positionX = Math.min(positionX, this.chartWidth - this.tipTimeWidth);
        positionX = Math.max(positionX, 0 - (this.commonDataAxis ? this.commonDataAxisWidth : 0));

        let positionY = this.height - this.timeAxisHeight;
        if (this.mouseVerticalPosition === 'top' && !this.showTimeAxis) {
            positionY = 0;
        }

        this.tipGroup.select('.tipTime').attr('transform', `translate(${positionX}, ${positionY})`);

        this.tipGroup.select('.tipTimeText').text(d3.timeFormat(this.tipTimeFormat)(xDate));

        const tipNodes = [];

        this.tipGroup.selectAll(`.dataStreamTip`).each((item, idx) => {
            const { data } = this.dataStreams[idx];
            const yAxisScale = this.commonDataAxis ? this.commonYAxisScale : this.yAxisScales[idx];

            const bisect = d3.bisector(([date]) => date).right;
            const bisectPointIdx = bisect(data, xDate);
            const pointIdx = bisectPointIdx - 1;

            if (data[pointIdx]) {
                const y = yAxisScale(data[pointIdx][1]);

                tipNodes.push({
                    idx,
                    fx: 0,
                    targetY: y,
                    value: parseFloat(Number(data[pointIdx][1]).toFixed(1)),
                    date: data[pointIdx][0],
                });
            }
        });

        // Calculate optimal non-overlaping label tips positions
        const tipHeight = 10;
        const force = d3
            .forceSimulation()
            .nodes(tipNodes)
            .force('collide', d3.forceCollide(tipHeight / 2))
            .force('y', d3.forceY(d => d.targetY).strength(1))
            .stop();
        for (let i = 0; i < 300; i += 1) {
            force.tick();
        }

        this.tipGroup.selectAll(`.dataStreamTip`).each((item, idx, els) => {
            const tipNode = tipNodes.find(i => i.idx === idx);
            if (tipNode) {
                d3.select(els[idx]).attr('transform', `translate(${mouseX},${tipNode.y})`);

                d3.select(els[idx])
                    .select('.tipText')
                    .text(tipNode.value);

                d3.select(els[idx])
                    .select('.tipPointerLine')
                    .attr('d', () =>
                        d3.line()([
                            [-3, 0],
                            [Math.min(-3, this.xAxisScale(tipNode.date) - mouseX), tipNode.targetY - tipNode.y],
                        ]),
                    );
            } else {
                d3.select(els[idx]).attr('transform', `translate(-999,-999)`);
            }
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
        if (this.commonDataAxis) {
            let dataAxis = this.chart.select('.commonDataAxis');
            if (dataAxis.empty()) {
                dataAxis = this.chart.append('g').attr('class', 'commonDataAxis');
            }

            dataAxis.call(d3.axisLeft(this.commonYAxisScale));
        } else {
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

                    d3.select(axis)
                        .attr('transform', `translate(${drawCounter * 30}, 0)`)
                        .call(d3.axisLeft(yScale))
                        .call(axis => axis.select('.domain').remove())
                        .call(axis => axis.selectAll('line').remove())
                        .call(axis => axis.selectAll('text').attr('fill', color));
                });
        }
    }

    renderDataLines() {
        // First make scales
        let commonMinValue = Number.MAX_SAFE_INTEGER;
        let commonMaxValue = -Number.MAX_SAFE_INTEGER;
        this.dataStreams.forEach((dataStream, idx) => {
            const { data } = dataStream;

            let scalingData = data;
            if (this.autoScale) {
                scalingData = this.filterVisibleDataPoints(data, this.xAxisScale);
            }

            const extent = d3.extent(scalingData, d => d[1]);
            const extentPadding = (extent[1] - extent[0]) / this.chartPaddingFactor;
            this.yAxisScales[idx] = d3
                .scaleLinear()
                .range([this.chartHeight, 0])
                .domain([extent[0] - extentPadding, extent[1] + extentPadding]);
            commonMinValue = Math.min(commonMinValue, extent[0]);
            commonMaxValue = Math.max(commonMaxValue, extent[1]);
        });
        const extentPadding = (commonMaxValue - commonMinValue) / this.chartPaddingFactor;
        this.commonYAxisScale.domain([commonMinValue - extentPadding, commonMaxValue + extentPadding]);

        this.chart
            .selectAll('.dataLine')
            .data(this.dataStreams)
            .join(enter =>
                enter
                    .append('g')
                    .attr('class', 'dataLine')
                    .attr('clip-path', 'url(#chart-clip)'),
            )
            .each((dataStream, idx, els) => {
                const container = d3.select(els[idx]);
                const yAxisScale = this.commonDataAxis ? this.commonYAxisScale : this.yAxisScales[idx];

                const {
                    color,
                    data,
                    strokeWidth = 1,
                    type = 'line',
                    areaFillOpacity = 0.5,
                    curve = 'linear',
                } = dataStream;

                let curveFunc = d3.curveLinear;
                switch (curve) {
                    case 'linear': {
                        curveFunc = d3.curveLinear;
                        break;
                    }
                    case 'stepAfter': {
                        curveFunc = d3.curveStepAfter;
                        break;
                    }
                    case 'stepBefore': {
                        curveFunc = d3.curveStepBefore;
                        break;
                    }
                    case 'monotoneX': {
                        curveFunc = d3.curveMonotoneX;
                        break;
                    }
                    default:
                }

                switch (type) {
                    case 'line': {
                        const line = d3
                            .line()
                            .x(([time]) => this.xAxisScale(+time))
                            .y(([, value]) => yAxisScale(value))
                            .curve(curveFunc);

                        let path = container.select('path');
                        if (path.empty()) {
                            path = container.append('path');
                        }

                        path.datum(this.filterVisibleDataPoints(data, this.xAxisScale))
                            .attr('d', line)
                            .attr('stroke', color)
                            .attr('stroke-width', strokeWidth)
                            .attr('fill', 'none');
                        break;
                    }
                    case 'area': {
                        const area = d3
                            .area()
                            .x(([time]) => this.xAxisScale(+time))
                            .y0(() => yAxisScale(yAxisScale.domain()[0]))
                            .y1(([, value]) => yAxisScale(value));

                        let path = container.select('path');
                        if (path.empty()) {
                            path = container.append('path');
                        }

                        path.datum(this.filterVisibleDataPoints(data, this.xAxisScale))
                            .attr('d', area)
                            .attr('stroke', color)
                            .attr('stroke-width', strokeWidth)
                            .attr('fill', color)
                            .attr('fill-opacity', areaFillOpacity);
                        break;
                    }
                    case 'bar': {
                        container
                            .selectAll('rect')
                            .data(this.filterVisibleDataPoints(data, this.xAxisScale))
                            .join('rect')
                            .attr('fill', color)
                            .attr('width', strokeWidth)
                            .attr('x', ([time]) => this.xAxisScale(+time) - strokeWidth / 2)
                            .attr('y', ([, value]) => yAxisScale(value))
                            .attr(
                                'height',
                                ([, value]) =>
                                    this.height - (this.showTimeAxis ? this.timeAxisHeight : 0) - yAxisScale(value),
                            );

                        break;
                    }
                    default:
                }
            });
    }

    renderDataDots() {
        this.chart
            .selectAll('.dataDotsGroup')
            .data(this.dataStreams)
            .join(enter =>
                enter
                    .append('g')
                    .attr('class', 'dataDotsGroup')
                    .attr('clip-path', 'url(#chart-clip)'),
            )
            .each((dataStream, idx, els) => {
                const group = els[idx];
                const yAxisScale = this.commonDataAxis ? this.commonYAxisScale : this.yAxisScales[idx];

                const { color, data, strokeWidth = 1, showDots = false } = dataStream;
                const dotsRadius = dataStream.dotsRadius || strokeWidth * 2;

                if (showDots) {
                    d3.select(group)
                        .selectAll('.dataDot')
                        .data(this.filterVisibleDataPoints(data, this.xAxisScale))
                        .join(enter => enter.append('circle').attr('class', 'dataDot'))
                        .attr('r', dotsRadius)
                        .attr('fill', color)
                        .attr('cx', ([time]) => this.xAxisScale(+time))
                        .attr('cy', ([, value]) => yAxisScale(value));
                }
            });
    }

    filterVisibleDataPoints(data, xScale, regionMargin = 20) {
        return data.filter(([time]) => {
            const x = xScale(+time);
            return x > -regionMargin && x < this.chartWidth + regionMargin;
        });
    }

    renderTipGroup() {
        // Render only first time
        if (!this.tipGroup) {
            this.tipGroup = this.chart
                .append('g')
                .attr('class', 'tipGroup')
                .style('opacity', '0');

            this.tipGroup
                .append('path') // this is the black vertical line to follow mouse
                .attr('class', 'tipMouseLine')
                .attr('stroke', this.tipStrokeColor)
                .attr('stroke-width', 2);

            this.tipGroup
                .selectAll('.dataStreamTip')
                .data(this.dataStreams)
                .enter()
                .append('g')
                .attr('class', 'dataStreamTip')
                .call(g => g.append('path').attr('class', 'tipPointerLine'))
                .call(g =>
                    g

                        .append('circle')
                        .attr('class', 'tipCircle')
                        .attr('r', 4)
                        .style('stroke', d => d.color),
                )
                .call(g => g.append('text').attr('class', 'tipText'));

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
        this.renderDataDots();
        this.renderDataAxises();
        this.renderTipGroup();

        this.updateTipGroup();
    }

    update(dataStreams) {
        this.render(dataStreams);
    }
}

export default TimeseriesMultiChart;
