import React from 'react';
import TimeseriesMultiChart from '@avinlab/d3-timeseries-multi-chart';
import { generateData } from '../../utils/data';
import styles from './styles.module.scss';
import cn from 'clsx';

export default class Chart3 extends React.Component {
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
        });
        this.chart.render([
            {
                label: 'Data 1',
                color: '#F5498B',
                data: generateData(0),
                showAxis: true,
                strokeWidth: 2,
                showDots: true,
            },
            {
                label: 'Data 2',
                color: '#43BF4D',
                data: generateData(Math.PI / 2),
                showAxis: true,
                strokeWidth: 2,
                showDots: true,
            },
            {
                label: 'Data 3',
                color: '#9179F2',
                data: generateData(Math.PI),
                showAxis: true,
                strokeWidth: 2,
            },
            {
                label: 'Data 4',
                color: '#B6D94C',
                data: generateData(Math.PI + 0.3),
                showAxis: true,
                strokeWidth: 2,
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