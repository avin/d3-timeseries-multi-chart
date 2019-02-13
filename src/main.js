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

    // Allow to drag
    draggable: true,

    // Allow to zoom
    zoomable: true,

    // Enable on mouseover values display
    showMouseTip: true,

    // Min limit for zooming (-1 is disabled)
    minZoomTime: -1,

    // Max limit for zooming (-1 is disabled)
    maxZoomTime: -1,

    // Render mode for data lines (canvas|svg)
    renderMode: 'canvas',

    dataAxisTickHeight: 20,
};

class TimeseriesMultiChart {
    constructor(options) {
        this.set(options);

        this._dragging = false;
        this.currentChartDuration = this.chartDuration;

        this._handlers = {};

        this._init();
    }

    /**
     * Set configuration options.
     * @param config
     */
    set(config) {
        Object.assign(this, defaults, config);
    }

    /**
     * Calculate chart width using original width and commonData axis width
     * @returns {number}
     */
    get chartWidth() {
        return this.width - (this.commonDataAxis ? this.commonDataAxisWidth : 0);
    }

    /**
     * Calculate chart height using original height and time axis height
     * @returns {number}
     */
    get chartHeight() {
        return this.height - (this.showTimeAxis ? this.timeAxisHeight : 0);
    }

    _init() {
        const { target, width, height, chartWidth, chartHeight } = this;

        d3.select(target)
            .style('position', 'relative')
            .style('overflow', 'hidden');

        if (this.renderMode) {
            this.canvasChart = d3
                .select(target)
                .append('canvas')
                .style('position', 'absolute')
                .style('top', 0)
                .style('left', (this.commonDataAxis ? this.commonDataAxisWidth : 0) + 'px')
                .attr('width', chartWidth)
                .attr('height', chartHeight);
            this.canvasChartCtx = this.canvasChart.node().getContext('2d');
        }

        this.svg = d3
            .select(target)
            .append('svg')
            .style('position', 'absolute')
            .style('top', 0)
            .style('left', 0)
            .attr('width', width)
            .attr('height', height);

        this.chart = this.svg
            .append('g')
            .attr('transform', `translate(${this.commonDataAxis ? this.commonDataAxisWidth : 0}, 0)`)
            .style('pointer-events', 'all');

        // Need to mouse event handle
        this.chart
            .append('rect')
            .attr('fill', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', chartWidth)
            .attr('height', chartHeight);

        // Need to crop line dataLines outgrowths
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

        this._initDrag();
        this._initZoom();
        this._initMouseTip();
    }

    /**
     * Handle chart zoom
     */
    _initZoom() {
        if (!this.zoomable) {
            return;
        }

        const maxScale = this.minZoomTime === -1 ? Number.MAX_SAFE_INTEGER : this.chartDuration / this.minZoomTime;
        const minScale = this.minZoomTime === -1 ? 0 : this.chartDuration / this.maxZoomTime;

        this._zoomHandler = d3
            .zoom()
            .scaleExtent([minScale, maxScale])
            .on('zoom', () => {
                const beforeChartDuration = this.currentChartDuration;
                this.currentChartDuration = this.chartDuration * (1 / d3.event.transform.k);

                this.chart
                    .select('.tipGroup')
                    .transition()
                    .style('opacity', '0');

                this.update();

                this._callHandler('zoom', {
                    beforeChartDuration,
                    afterChartDuration: this.currentChartDuration,
                    scaleFactor: d3.event.transform.k,
                });
            });

        this.svg.call(this._zoomHandler).on('wheel', function() {
            d3.event.preventDefault();
        });
    }

    /**
     * Handle chart drag
     */
    _initDrag() {
        if (!this.draggable) {
            return;
        }

        let startX;
        const dragAction = d3
            .drag()
            .clickDistance(10)
            .on('start', () => {
                this._dragging = true;
                startX = d3.event.x;
                this.chart
                    .select('.tipGroup')
                    .transition()
                    .style('opacity', '0');

                this._callHandler('dragStart', {
                    startX,
                });
            })
            .on('end', () => {
                this._dragging = false;
                this.chart
                    .select('.tipGroup')
                    .transition()
                    .style('opacity', '1');

                this._callHandler('dragEnd', {
                    endX: d3.event.x,
                });
            })
            .on('drag', () => {
                const diff = d3.event.x - startX;

                if (diff < -10 || diff > 10) {
                    startX = d3.event.x;

                    const timeDiff = (this.currentChartDuration / this.chartWidth) * diff;

                    const beforeLastChartTime = this.lastChartTime;
                    this.lastChartTime -= timeDiff;
                    this.lastChartTime = Math.min(this.maxTime + this.currentChartDuration / 5, this.lastChartTime);
                    this.lastChartTime = Math.max(this.minTime + this.currentChartDuration / 2, this.lastChartTime);

                    this.update();

                    this._callHandler('drag', {
                        beforeLastChartTime,
                        afterLastChartTime: this.lastChartTime,
                        diff,
                    });
                }
            });

        this.svg.call(dragAction);
    }

    /**
     * Mouse tip handle
     */
    _initMouseTip() {
        if (!this.showMouseTip) {
            return;
        }

        this.chart
            .on('mouseover', () => {
                [this.mouseX, this.mouseY] = d3.mouse(this.chart.node());

                this._showTipGroup();
            })
            .on('mouseleave', () => {
                this._hideTipGroup();
            })
            .on('mousemove', () => {
                [this.mouseX, this.mouseY] = d3.mouse(this.chart.node());

                this._updateTipGroup();
            });
    }

    _showTipGroup() {
        if (!this._dragging && this.tipGroup) {
            this.tipGroup.style('opacity', '1');
        }
    }

    _hideTipGroup() {
        if (this.tipGroup) {
            this.tipGroup.style('opacity', '0');
        }
    }

    /**
     * Update mouse tip position and values
     */
    _updateTipGroup() {
        if (!this.showMouseTip) {
            return;
        }

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
                d3.line()([[mouseX, this.height - (this.showTimeAxis ? this.timeAxisHeight : 0)], [mouseX, 0]])
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
                        ])
                    );
            } else {
                d3.select(els[idx]).attr('transform', `translate(-999,-999)`);
            }
        });
    }

    /**
     * Render time bottom axis
     */
    _renderTimeAxis() {
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

    /**
     * Render data lines axises or one common value axis
     */
    _renderDataAxises() {
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

                    const { color, showAxis = true, scaleRange = [0, 100] } = dataStream;
                    if (!showAxis) {
                        return;
                    }

                    drawCounter += 1;

                    const ticksCount = Math.floor(
                        (this.chartHeight * (scaleRange[1] / 100) - this.chartHeight * (scaleRange[0] / 100)) /
                            this.dataAxisTickHeight
                    );

                    d3.select(axis)
                        .attr('transform', `translate(${drawCounter * 30}, 0)`)
                        .call(d3.axisLeft(yScale).ticks(ticksCount))
                        .call(axis => axis.select('.domain').remove())
                        .call(axis => axis.selectAll('line').remove())
                        .call(axis => axis.selectAll('text').attr('fill', color));
                });
        }
    }

    /**
     * Render main data lines/areas/bars
     */
    _renderDataLines() {
        // First make scales
        let commonMinValue = Number.MAX_SAFE_INTEGER;
        let commonMaxValue = -Number.MAX_SAFE_INTEGER;
        this.dataStreams.forEach((dataStream, idx) => {
            const { data, scaleRange = [0, 100], scaleVisible = false } = dataStream;

            let scalingData = data;
            if (this.autoScale || scaleVisible) {
                scalingData = this._filterVisibleDataPoints(data, this.xAxisScale);
            }

            const extent = d3.extent(scalingData, d => d[1]);
            const extentPadding = (extent[1] - extent[0]) / this.chartPaddingFactor;
            this.yAxisScales[idx] = d3
                .scaleLinear()
                .range([this.chartHeight * (scaleRange[1] / 100), this.chartHeight * (scaleRange[0] / 100)])
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
                    .attr('clip-path', 'url(#chart-clip)')
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

                let strokeStyle = this._getDataStreamStrokeStyle(dataStream);

                switch (type) {
                    case 'line': {
                        const line = d3
                            .line()
                            .x(([time]) => this.xAxisScale(+time))
                            .y(([, value]) => yAxisScale(value))
                            .curve(curveFunc);

                        if (this.renderMode === 'canvas') {
                            line.context(this.canvasChartCtx);

                            this.canvasChartCtx.beginPath();
                            line(this._filterVisibleDataPoints(data, this.xAxisScale));
                            this.canvasChartCtx.lineWidth = strokeWidth;
                            this.canvasChartCtx.strokeStyle = strokeStyle;
                            this.canvasChartCtx.stroke();
                        } else {
                            let path = container.select('path');
                            if (path.empty()) {
                                path = container.append('path');
                            }

                            path.datum(this._filterVisibleDataPoints(data, this.xAxisScale))
                                .attr('d', line)
                                .attr('stroke', strokeStyle)
                                .attr('stroke-width', strokeWidth)
                                .attr('fill', 'none');
                        }

                        break;
                    }
                    case 'area': {
                        const area = d3
                            .area()
                            .x(([time]) => this.xAxisScale(+time))
                            .y0(() => yAxisScale(yAxisScale.domain()[0]))
                            .y1(([, value]) => yAxisScale(value));

                        if (this.renderMode === 'canvas') {
                            area.context(this.canvasChartCtx);

                            this.canvasChartCtx.strokeStyle = strokeStyle;
                            this.canvasChartCtx.beginPath();
                            area(this._filterVisibleDataPoints(data, this.xAxisScale));
                            this.canvasChartCtx.save();
                            this.canvasChartCtx.globalAlpha = areaFillOpacity;
                            this.canvasChartCtx.fillStyle = strokeStyle;
                            this.canvasChartCtx.fill();
                            this.canvasChartCtx.restore();
                            this.canvasChartCtx.lineWidth = strokeWidth;
                            this.canvasChartCtx.stroke();
                        } else {
                            let path = container.select('path');
                            if (path.empty()) {
                                path = container.append('path');
                            }

                            path.datum(this._filterVisibleDataPoints(data, this.xAxisScale))
                                .attr('d', area)
                                .attr('stroke', strokeStyle)
                                .attr('stroke-width', strokeWidth)
                                .attr('fill', strokeStyle)
                                .attr('fill-opacity', areaFillOpacity);
                        }

                        break;
                    }
                    case 'bar': {
                        if (this.renderMode === 'canvas') {
                            this._filterVisibleDataPoints(data, this.xAxisScale).forEach(([time, value]) => {
                                this.canvasChartCtx.fillStyle = strokeStyle;
                                this.canvasChartCtx.fillRect(
                                    this.xAxisScale(+time) - strokeWidth / 2,
                                    yAxisScale(value),
                                    strokeWidth,
                                    this.height - (this.showTimeAxis ? this.timeAxisHeight : 0) - yAxisScale(value)
                                );
                            });
                        } else {
                            container
                                .selectAll('rect')
                                .data(this._filterVisibleDataPoints(data, this.xAxisScale))
                                .join('rect')
                                .attr('fill', strokeStyle)
                                .attr('width', strokeWidth)
                                .attr('x', ([time]) => this.xAxisScale(+time) - strokeWidth / 2)
                                .attr('y', ([, value]) => yAxisScale(value))
                                .attr(
                                    'height',
                                    ([, value]) =>
                                        this.height - (this.showTimeAxis ? this.timeAxisHeight : 0) - yAxisScale(value)
                                );
                        }

                        break;
                    }
                    default:
                }
            });
    }

    _getDataStreamStrokeStyle(dataStream) {
        const { colorTo, colorFrom, scaleRange = [0, 100] } = dataStream;
        const color = dataStream.color || '#000';
        let strokeStyle;
        if (this.renderMode === 'canvas') {
            strokeStyle = this.canvasChartCtx.createLinearGradient(
                this.chartWidth / 2,
                this.chartHeight * (scaleRange[1] / 100),
                this.chartWidth / 2,
                this.chartHeight * (scaleRange[0] / 100)
            );
            strokeStyle.addColorStop(0, colorFrom || color);
            strokeStyle.addColorStop(1, colorTo || color);
        } else {
            return color;
        }
        return strokeStyle;
    }

    /**
     * Render data points on lines
     */
    _renderDataDots() {
        this.chart
            .selectAll('.dataDotsGroup')
            .data(this.dataStreams)
            .join(enter =>
                enter
                    .append('g')
                    .attr('class', 'dataDotsGroup')
                    .attr('clip-path', 'url(#chart-clip)')
            )
            .each((dataStream, idx, els) => {
                const group = els[idx];
                const yAxisScale = this.commonDataAxis ? this.commonYAxisScale : this.yAxisScales[idx];

                const { color, data, strokeWidth = 1, showDots = false } = dataStream;
                const dotsRadius = dataStream.dotsRadius || strokeWidth * 2;

                if (showDots) {
                    const dotsColor = this._getDataStreamStrokeStyle(dataStream);
                    if (this.renderMode === 'canvas') {
                        this._filterVisibleDataPoints(data, this.xAxisScale).forEach(([time, value]) => {
                            this.canvasChartCtx.beginPath();
                            this.canvasChartCtx.arc(
                                this.xAxisScale(+time),
                                yAxisScale(value),
                                dotsRadius,
                                0,
                                2 * Math.PI,
                                true
                            );
                            this.canvasChartCtx.fillStyle = dotsColor;
                            this.canvasChartCtx.fill();
                        });
                    } else {
                        d3.select(group)
                            .selectAll('.dataDot')
                            .data(this._filterVisibleDataPoints(data, this.xAxisScale))
                            .join(enter => enter.append('circle').attr('class', 'dataDot'))
                            .attr('r', dotsRadius)
                            .attr('fill', dotsColor)
                            .attr('cx', ([time]) => this.xAxisScale(+time))
                            .attr('cy', ([, value]) => yAxisScale(value));
                    }
                }
            });
    }

    /**
     * Filter data to get only data in xScale domain
     * @param data
     * @param xScale
     * @param regionMargin
     * @returns {*}
     */
    _filterVisibleDataPoints(data, xScale, regionMargin = 20) {
        return data.filter(([time]) => {
            const x = xScale(+time);
            return x > -regionMargin && x < this.chartWidth + regionMargin;
        });
    }

    /**
     * Render mouse tip group
     */
    _renderTipGroup() {
        this.tipGroup = this.chart.select('.tipGroup');
        const renderFirstTime = this.tipGroup.empty();
        if (renderFirstTime) {
            this.tipGroup = this.chart
                .append('g')
                .attr('class', 'tipGroup')
                .style('opacity', '0');

            this.tipGroup
                .append('path') // this is the black vertical line to follow mouse
                .attr('class', 'tipMouseLine')
                .attr('stroke', this.tipStrokeColor)
                .attr('stroke-width', 2);
        }

        this.tipGroup
            .selectAll('.dataStreamTip')
            .data(this.dataStreams)
            .join(
                enter =>
                    enter
                        .append('g')
                        .attr('class', 'dataStreamTip')
                        .call(g => g.append('path').attr('class', 'tipPointerLine'))
                        .call(g =>
                            g

                                .append('circle')
                                .attr('class', 'tipCircle')
                                .attr('r', 4)
                        )
                        .call(g => g.append('text').attr('class', 'tipText')),
                enter => enter.select('.tipCircle'),
                exit => exit.remove()
            )
            .select('.tipCircle')
            .style('stroke', d => d.color);

        if (renderFirstTime) {
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

    _callHandler(actionType, ...params) {
        this._handlers[actionType] = this._handlers[actionType] || [];
        this._handlers[actionType].forEach(handler => {
            handler(...params);
        });
    }

    /**
     * Main render func
     * @param dataStreams
     */
    render(dataStreams) {
        if (dataStreams) {
            this.dataStreams = dataStreams.filter(d => d.data && d.data.length);
        }

        this.canvasChartCtx.clearRect(0, 0, this.chartWidth, this.chartHeight);

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

        this._renderTimeAxis();
        this._renderDataLines();
        this._renderDataDots();
        this._renderDataAxises();
        if (dataStreams) {
            this._renderTipGroup();
        }

        this._updateTipGroup();
    }

    /**
     * Render func alias
     * @param dataStreams
     */
    update(dataStreams) {
        this.render(dataStreams);
    }

    /**
     * Update chart duration (change time zoom level)
     * @param newChartDuration
     */
    setChartDuration(newChartDuration) {
        const scaleFactor = this.chartDuration / newChartDuration;
        this.svg.call(this._zoomHandler.transform, d3.zoomIdentity.scale(scaleFactor));

        this.update();
    }

    /**
     * Update last chart time (change chart position)
     * @param newLastChartTime
     */
    setLastChartTime(newLastChartTime) {
        this.lastChartTime = newLastChartTime;

        this.update();
    }

    /**
     * Add event handler
     * @param actionType
     * @param handler
     */
    on(actionType, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Handle must be a function');
        }
        this._handlers[actionType] = this._handlers[actionType] || [];

        this._handlers[actionType].push(handler);
    }

    /**
     * Remove event handler
     * @param actionType
     * @param handler
     */
    off(actionType, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Handle must be a function');
        }
        this._handlers[actionType] = this._handlers[actionType] || [];
        this._handlers[actionType] = this._handlers[actionType].filter(i => i !== handler);
    }
}

export default TimeseriesMultiChart;
