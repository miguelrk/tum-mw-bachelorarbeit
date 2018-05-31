import ParameterContext from 'core/objects/parameter-context';
import CompactBaseKPIMixin from '../mixins/kpi-compact';
import BoardletBase from 'core/objects/boardlet-base';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

var boardlet = BoardletBase.extend(CompactBaseKPIMixin, {
    pieceCounterService: service(),
    currentKPIId: null,
    currentKPI2Id: null,

    currentKPILabel: 'Einzug',
    currentKPIValue: null,
    currentKPITrend1Label: 'Soll 85%',
    currentKPITrend1Value: null,
    currentKPITrend2Label: 'Soll 100%',
    currentKPITrend2Value: null,
    totalKPILabel: 'FIS R950',
    totalKPIValue: null,
    graphicControlLabel: 'AVG 15min',
    graphicControlValue: '../assets/images/icons/carriage.svg',

    currentFISId: null,
    currentAVG15Id: null,

    startTimeISOString: null,
    endTimeISOString: null,
    
    init() {
        this._super(...arguments);

        let chartOptions = this.get('chartOptions'); // get it from the base component
        chartOptions.chart.type = 'area';
        chartOptions.xAxis.type = 'datetime';

        chartOptions.series = [{
            type: 'area',
            name: 'Piece counter',
            animation: 0,
            data: []
        }];

        chartOptions.xAxis.plotBands = [];

        let f = () => { 
            this.toggleProperty('flag');
            if(!this.isDestroyed) {
                setTimeout(f, 20000);
            }
        };

        setTimeout(f, 20000);
    },
    
    _renderChart() {
        this._super(...arguments);

        const element = this.$() && this.$().closest('.boardlet.piece-counter-compact-boardlet');
        if(!element) {
            return;
        }
        element.addClass('compact-kpi-color'); // needed to ensure the stupid class is there!

        let chart = this.get('chartObject');

        this.set('chartObject', new Highcharts.Chart(this.get('chartOptions')));
        chart = this.get('chartObject');
        chart.reflow();
    },

    nodeChangedObserver: observer('parameters.nodeList.value.[]', function() {
        this.get('pieceCounterService').getKPIforNode(this.get('parameters.nodeList.value.0'))
            .then(result => {
                // a lot of required conventions to make this work -> TODO: solve it generally using the DB and DB-schema

                const currentKPIs = result.content.filter((item) => { return item.value_type && item.value_type == 2 && item.name.includes('Abgabe'); });
                if(currentKPIs && currentKPIs.length) {
                    this.set('currentKPIId', currentKPIs[0].id);
                } else {
                    this.set('currentKPIId', null);
                }

                const currentKPI2s = result.content.filter((item) => { return item.value_type && item.value_type == 2 && item.name.includes('eingezogen'); });
                if(currentKPI2s && currentKPI2s.length) {
                    this.set('currentKPI2Id', currentKPI2s[0].id);
                } else {
                    this.set('currentKPI2Id', null);
                }

                const fisKPIs = result.content.filter((item) => { return item.name && item.name.includes('FIS'); });
                if(fisKPIs && fisKPIs.length) {
                    this.set('currentFISId', fisKPIs[0].id);
                    this.set('totalKPILabel', fisKPIs[0].name);
                } else {
                    this.set('currentFISId', null);
                    this.set('totalKPILabel', null);
                }

                const averageKPIs = result.content.filter((item) => { return item.name && item.name.includes('AVG15'); });
                if(averageKPIs && averageKPIs.length) {
                    this.set('currentAVG15Id', averageKPIs[0].id);
                    this.set('graphicControlLabel', averageKPIs[0].name);
                } else {
                    this.set('currentAVG15Id', null);
                    this.set('graphicControlLabel', null);
                }
            });
    }),

    kpiTarget100Observer: observer('currentKPI2Id', 'flag', function() {
        // currentKPITrend2Value
        this.get('pieceCounterService').getTargetsForKPI(this.get('currentKPI2Id')).then(result => {
            const value = result.objectAt(0);

            if (value !== undefined) {
                this.set('currentKPITrend2Value', Math.floor(value['value_num']));
            } else {
                this.set('currentKPITrend2Value', null);
            }
        });
    }),

    kpiTarget85Observer: observer('currentKPITrend2Value', function() {
        // currentKPITrend1Value
        const currentKPI100Trend = this.get('currentKPITrend2Value');
        if(currentKPI100Trend === 0 || currentKPI100Trend) {
            this.set('currentKPITrend1Value', Math.floor(0.85 * currentKPI100Trend));
        } else {
            this.set('currentKPITrend1Value', null)
        }
    }),

    fisKPIObserver: observer('currentFISId', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentFISId'))
            .then(result => {
                if(result && result.objectAt(0)) {
                    this.set('totalKPIValue', result.objectAt(0)['value_num']);
                } else {
                    this.set('totalKPIValue', null);
                    this.set('totalKPILabel', null);
                }
            });
    }),
    avg15KPIObserver: observer('currentAVG15Id', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentAVG15Id'))
            .then(result => {
                if(result && result.objectAt(0)) {
                    const averageValue = result.objectAt(0)['value_num'];
                    const trend100 = this.get('currentKPITrend2Value');
                    const trend85 = this.get('currentKPITrend1Value');
                    if(trend100 && trend85) {
                        if(averageValue < trend85) {
                            this.set('graphicControlValue', '../assets/images/icons/carriage.svg');
                        } else if( averageValue >= trend85 && averageValue < trend100) {
                            this.set('graphicControlValue', '../assets/images/icons/vw-up.svg');
                        } else if(averageValue >= trend100) {
                            this.set('graphicControlValue', '../assets/images/icons/fast-car.svg');
                        }
                    } else {
                        this.set('graphicControlValue', '');
                        this.set('graphicControlLabel', '');
                    }
                } else {
                    this.set('graphicControlValue', '');
                    this.set('graphicControlLabel', '');
                }
            });
    }),

    currentKPIObserver: observer('currentKPI2Id', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentKPI2Id'))
            .then(result => {
                const value = result.objectAt(0);

                if (value) {
                    this.set('currentKPIValue', value['value_num']);
                } else {
                    this.set('currentKPIValue', null);
                }
            });
    }),

    chartDataObserver: observer('currentKPIId', 'flag', function() {
        let chartOptions = this.get('chartOptions');
        chartOptions.xAxis.plotBands = [];

        this.get('pieceCounterService').getShiftInfoForNode(this.get('parameters.nodeList.value.0'))
            .then(shiftResult => {
                const firstRow = shiftResult.objectAt(0);

                if(firstRow && firstRow['time_start'] && firstRow['time_end']) {
                    this.set('startTimeISOString', moment(firstRow['time_start']).toISOString());
                    this.set('endTimeISOString', moment(firstRow['time_end']).toISOString());

                    chartOptions.xAxis.min = moment(firstRow['time_start']).valueOf();
                    chartOptions.xAxis.max = moment(firstRow['time_end']).valueOf();
                } else {
                    chartOptions.xAxis.min = 0;
                    chartOptions.xAxis.max = 0;
                    this.set('startTimeISOString', null);
                    this.set('endTimeISOString', null);
                    console.warn('No active shift found for the node! Cannot draw any chart');
                }

                if(firstRow) {
                    shiftResult.map(item => {
                        chartOptions.xAxis.plotBands.push({
                            id: item['break_id'],
                            from: moment(item['break_time_start']).valueOf(),
                            to: moment(item['break_time_end']).valueOf()
                        })
                    });
                }

                this.get('pieceCounterService').getArchiveDataForCurrentShift(this.get('currentKPIId'), this.get('startTimeISOString'), this.get('endTimeISOString'))
                .then(archiveResult => {
                    chartOptions.series[0].data = [];
    
                    if(archiveResult && archiveResult.objectAt(0)) {             
                        archiveResult.map(value => 
                            chartOptions.series[0].data.pushObject({
                                x: moment(value.get('time_stamp')).valueOf(), 
                                y: value.get('value_num')
                            })
                        );
    
                        let data = chartOptions.series[0].data;
    
                        if(data && data.length) {
                            data[data.length - 1] = { 
                                x: data[data.length - 1].x,
                                marker: {
                                    enabled: true,
                                    fillColor: '#00d5ff',
                                    lineWidth: 3,
                                    lineColor: "#00d5ff" // inherit from series
                                },
                                y: data[data.length - 1].y
                            };
                        }
                    }
    
                    this._renderChart();
                });
            });
    })
});

boardlet.reopenClass({
	parameters: {
        nodeList: {
            displayKey: 'parameters.selected-nodes',
            value: [],
            filter: {
                filterString: 'filter-string.node-id',
                model: 'l-nodes',
                sort: 1
            },
            parameterType: 'NumberArray',
            context: ParameterContext.InOut,
            category: 'filters',
            editor: {
                component: 'input-multi-component',
                parameters: {
                    placeholder: 'Add node IDs...',
                    hasIcon: true
                }
            }
        },
        title: {
			displayKey: 'parameters.title',
			value: 'Boardlet preview with link',
			parameterType: 'String',
			context: ParameterContext.Local,
            category: 'settings',
            visible: false,
			editor: {
				component: 'input-component',
				parameters: {
					placeholder: 'Add title...'
				}
			}
		},

        showHeader: {
            displayKey: 'parameters.show-header',
            value: false,
            context: ParameterContext.Local,
            parameterType: 'Boolean',
            visible: false,
            editable: false,
            editor: {
                component: 'switch-component',
                parameters: {}
            },
            category: 'settings'
        }
    }
});

export default boardlet;
