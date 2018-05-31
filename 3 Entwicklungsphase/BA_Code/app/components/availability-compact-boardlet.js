import ParameterContext from 'core/objects/parameter-context';
import BoardletBase from 'core/objects/boardlet-base';
import { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import CompactBaseKPIMixin from '../mixins/kpi-compact';

var boardlet = BoardletBase.extend(CompactBaseKPIMixin, {
    pieceCounterService: service(),

    currentAVTECId: null,
    currentFTTECId: null,
    currentAVORGId: null,
    currentFTORGId: null,
    currentAVSYSId: null,
    currentFTSYSId: null,
    currentFTTOTId: null,

    firstKPILabel: 'AVORG',
    firstKPIValue: null,
    firstKPIBoxValue: null,
    secondKPILabel: 'AVTEC',
    secondKPIBoxValue: null,
    secondKPIValue: null,
    thirdKPILabel: 'AVSYS',
    thirdKPIValue: null,
    thirdKPIBoxValue: null,
    totalKPILabel: 'Total',
    totalKPIValue: null,

    flag: false,

    init() {
        this._super(...arguments);

        let chartOptions = this.get('chartOptions'); // get it from the base component
        chartOptions.chart.type = 'bar';

        chartOptions.plotOptions.bar.dataLabels = {
            color: '#dadada',
            enabled: true,
            shadow: false,
            style: {
                fontSize: '3em',
                textOutline: '0'
            }
        };

        chartOptions.plotOptions.series = {
            animation: false,
            dataLabels: {
                enabled: true,
                align: "left",
                formatter: function() { return this.key + ': '+ this.y + '%'; },
                inside: true,
                rotation: 0
            }
        };

        let f = () => { 
            this.toggleProperty('flag');
            if( !this.isDestroyed ) {
                setTimeout(f, 10000);
            } 
        };

        setTimeout(f, 10000);
    },
    
    _renderChart() {
        this._super(...arguments);

        const element = this.$() && this.$().closest('.boardlet.availability-compact-boardlet');
        if(!element) {
            return;
        }
        element.addClass('compact-kpi-color'); // needed to ensure the stupid class is there!

        this.set('chartObject', new Highcharts.Chart(this.get('chartOptions')));
        let chart = this.get('chartObject');
        chart.reflow();
    },

    chartDataObserver: observer('parameters.nodeList.value.[]', 'flag', function() {
        let chartOptions = this.get('chartOptions'); // get it from the base component
        chartOptions && (chartOptions.series = [
            {
                name: 'Organisatorisch',
                data: [{ name: 'O', y: this.get('firstKPIValue')}]
            },
            {
                name: 'Technisch',
                data: [{ name: 'T', y: this.get('secondKPIValue')}]
            },
            {
                name: 'Systembedingt',
                data: [{ name: 'S', y: this.get('thirdKPIValue')}]
            }
        ]);

        this._renderChart();
    }),

    nodeChangedObserver: observer('parameters.nodeList.value.[]', function() {
        this.get('pieceCounterService').getKPIforNode(this.get('parameters.nodeList.value.0'))
            .then(result => {
                const avtecKPIs = result.content.filter((item) => { return item.name && item.name.includes('avtec'); });
                if(avtecKPIs && avtecKPIs.length) {
                    this.set('currentAVTECId', avtecKPIs[0].id);
                } else {
                    this.set('currentAVTECId', null);
                }

                const fttecKPIs = result.content.filter((item) => { return item.name && item.name.includes('fttec'); });
                if(fttecKPIs && fttecKPIs.length) {
                    this.set('currentFTTECId', fttecKPIs[0].id);
                } else {
                    this.set('currentFTTECId', null);
                }

                const avorgKPIs = result.content.filter((item) => { return item.name && item.name.includes('avorg'); });
                if(avorgKPIs && avorgKPIs.length) {
                    this.set('currentAVORGId', avorgKPIs[0].id);
                } else {
                    this.set('currentAVORGId', null);
                }

                const ftorgKPIs = result.content.filter((item) => { return item.name && item.name.includes('ftorg'); });
                if(ftorgKPIs && ftorgKPIs.length) {
                    this.set('currentFTORGId', ftorgKPIs[0].id);
                } else {
                    this.set('currentFTORGId', null);
                }

                const avsysKPIs = result.content.filter((item) => { return item.name && item.name.includes('avsys'); });
                if(avsysKPIs && avsysKPIs.length) {
                    this.set('currentAVSYSId', avsysKPIs[0].id);
                } else {
                    this.set('currentAVSYSId', null);
                }

                const ftsysKPIs = result.content.filter((item) => { return item.name && item.name.includes('ftsys'); });
                if(ftsysKPIs && ftsysKPIs.length) {
                    this.set('currentFTSYSId', ftsysKPIs[0].id);
                } else {
                    this.set('currentFTSYSId', null);
                }

                const fttotKPIs = result.content.filter((item) => { return item.name && item.name.includes('fttot'); });
                if(fttotKPIs && fttotKPIs.length) {
                    this.set('currentFTTOTId', fttotKPIs[0].id);
                } else {
                    this.set('currentFTTOTId', null);
                }
            });
    }),

    avorgObserver: observer('currentAVORGId', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentAVORGId'))
        .then(result => {
            if(result && result.objectAt(0)) {
                this.set('firstKPIValue', Math.round(result.objectAt(0)['value_num']));
            } else {
                this.set('firstKPIValue', null);
            }
        });
    }),

    ftorgObserver: observer('currentFTORGId', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentFTORGId'))
        .then(result => {
            if(result && result.objectAt(0)) {
                this.set('firstKPIBoxValue', moment().startOf('day').seconds(result.objectAt(0)['value_num']).format('HH:mm:ss'));
            } else {
                this.set('firstKPIBoxValue', null);
            }
        });
    }),

    avtecObserver: observer('currentAVTECId', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentAVTECId'))
            .then(result => {
                if(result && result.objectAt(0)) {
                    this.set('secondKPIValue', Math.round(result.objectAt(0)['value_num']));
                } else {
                    this.set('secondKPIValue', null);
                }
            });
    }),

    fttecObserver: observer('currentFTTECId', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentFTTECId'))
            .then(result => {
                if(result && result.objectAt(0)) {
                    this.set('secondKPIBoxValue', moment().startOf('day').seconds(result.objectAt(0)['value_num']).format('HH:mm:ss'));
                } else {
                    this.set('secondKPIBoxValue', null);
                }
            });
    }),

    avsysObserver: observer('currentAVSYSId', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentAVSYSId'))
        .then(result => {
            if(result && result.objectAt(0)) {
                this.set('thirdKPIValue', Math.round(result.objectAt(0)['value_num']));
            } else {
                this.set('thirdKPIValue', null);
            }
        });
    }),

    ftsysObserver: observer('currentFTSYSId', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentFTSYSId'))
        .then(result => {
            if(result && result.objectAt(0)) {
                this.set('thirdKPIBoxValue', moment().startOf('day').seconds(result.objectAt(0)['value_num']).format('HH:mm:ss'));
            } else {
                this.set('thirdKPIBoxValue', null);
            }
        });
    }),

    fttotObserver: observer('currentFTTOTId', 'flag', function() {
        this.get('pieceCounterService').getCurrentValueForKPI(this.get('currentFTTOTId'))
        .then(result => {
            if(result && result.objectAt(0)) {
                this.set('totalKPIValue', moment().startOf('day').seconds(result.objectAt(0)['value_num']).format('HH:mm:ss'));
            } else {
                this.set('totalKPIValue', null);
            }
        });
    })
});

boardlet.reopenClass({
	parameters: {
        nodeList: {
			displayKey: 'parameters.node',
			value: [],
			parameterType: 'Integer',
			context: ParameterContext.In,
            category: 'filters',
			editor: {
				component: 'input-component',
				parameters: {
					placeholder: 'Add title...'
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
