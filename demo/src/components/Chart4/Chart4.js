import React from 'react';
import TimeseriesMultiChart from '@avinlab/d3-timeseries-multi-chart';
import { generateData } from '../../utils/data';
import styles from './styles.module.scss';
import cn from 'clsx';

export default class Chart4 extends React.Component {
    static defaultProps = {
        width: 600,
        height: 400,
    };
    componentDidMount() {
        const { width, height } = this.props;

        this.chart = new TimeseriesMultiChart({
            target: this.chartContainerRef,
            chartDuration: 3600 * 2000,
            width,
            height,
            showTimeAxis: true,
            maxZoomTime: 3600 * 8000,
            minZoomTime: 60*10 * 1000,
        });

        this.chart.render([
            {
                label: 'Data 1',
                color: '#1F4B99',
                data: generateData(Math.PI / 2),
                showAxis: true,
                showDots: true,
            },
            {
                label: 'Data 2',
                color: '#9BBF30',
                data: generateData(Math.PI),
                showAxis: true,
                type: 'area',
                areaFillOpacity: 0.3,
            },
            {
                label: 'Data 3',
                color: '#F5498B',
                data: generateData(0),
                type: 'bar',
                showDots: true,
                strokeWidth: 2,
                dotsRadius: 2.5
            },
        ]);
    }
    render() {
        const { width, height } = this.props;

        return (
            <div
                className={cn('chartContainer', styles.chart)}
                style={{
                    width,
                    height,
                }}
                ref={i => {
                    this.chartContainerRef = i;
                }}
            />
        );
    }
}
