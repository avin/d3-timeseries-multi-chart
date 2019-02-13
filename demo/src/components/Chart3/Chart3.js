import React from 'react';
import TimeseriesMultiChart from '@avinlab/d3-timeseries-multi-chart';
import { generateData } from '../../utils/data';
import styles from './styles.module.scss';
import cn from 'clsx';

export default class Chart3 extends React.Component {
    state = {
        hiddenDataStreams: [],
    };

    static defaultProps = {
        width: 600,
        height: 400,
    };

    handleToggleDataStream = e => {
        const dataStreamKey = e.currentTarget.dataset.key;
        let { hiddenDataStreams } = this.state;

        if (hiddenDataStreams.includes(dataStreamKey)) {
            hiddenDataStreams = hiddenDataStreams.filter(i => i !== dataStreamKey);
        } else {
            hiddenDataStreams = [...hiddenDataStreams, dataStreamKey];
        }
        this.setState({ hiddenDataStreams });

        const resultDataStreams = [];
        this.dataStreams.forEach(d => {
            if (!hiddenDataStreams.includes(d.label)) {
                resultDataStreams.push(d);
            }
        });
        this.chart.update(resultDataStreams);
    };

    handleSetDuration = e => {
        const duration = Number(e.currentTarget.dataset.duration);
        this.chart.setChartDuration(duration);
    };

    dataStreams = [
        {
            label: 'D1',
            color: '#F5498B',
            data: generateData(0),
            curve: 'linear',
            showDots: true,
        },
        {
            label: 'D2',
            color: '#43BF4D',
            data: generateData(Math.PI / 2),
            curve: 'stepAfter',
            showDots: true,
        },
        {
            label: 'D3',
            color: '#9179F2',
            data: generateData(Math.PI),
            curve: 'stepBefore',
            showDots: true,
        },
        {
            label: 'D4',
            color: '#B6D94C',
            data: generateData(Math.PI + 0.3),
            curve: 'monotoneX',
            showDots: true,
        },
    ];

    componentDidMount() {
        const { width, height } = this.props;

        this.chart = new TimeseriesMultiChart({
            target: this.chartContainerRef,
            chartDuration: 3600 * 2000,
            width,
            height,
            showTimeAxis: true,
            commonDataAxis: true,
            autoScale: true,
            maxZoomTime: 3600 * 16000,
            minZoomTime: 60 * 10 * 1000,
        });
        this.chart.render(this.dataStreams);
    }
    render() {
        const { width, height } = this.props;
        const { hiddenDataStreams } = this.state;

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
            >
                <div className={styles.controls}>
                    <div className="btn-group">
                        {this.dataStreams.map(d => (
                            <button
                                key={d.label}
                                onClick={this.handleToggleDataStream}
                                data-key={d.label}
                                className={cn({ active: hiddenDataStreams.includes(d.label) })}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                    <div className="btn-group">
                        {[['1h', 3600 * 1000], ['2h', 3600 * 1000 * 2], ['3h', 3600 * 1000 * 3]].map(
                            ([label, duration]) => (
                                <button key={label} onClick={this.handleSetDuration} data-duration={duration}>
                                    {label}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
