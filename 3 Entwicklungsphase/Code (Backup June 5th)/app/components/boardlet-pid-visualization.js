
import Evented from '@ember/object/evented';
import BoardletBase from 'core/objects/boardlet-base';
import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';


var boardlet = BoardletBase.extend(Evented,{
  classNames: ['boardlet-pid-visualization'],
  classNameBindings: ['inBar:boardlet', 'inBar:boardlet-pid-visualization'],
  toastService: service('toast-messages-service'),
  pidInstancesObject:null,
  pidShapesLibraryObject:null,
  pidVisualizationObject: null,
  jsonString:null,
  jsonObject:null,
  rootNode:1,
  gateway:1022,
  loading:false,
  init(){
    this._super(...arguments);
    this.set('jsonObject',null);
  },
  actions:{
    onFileLoad: function(object,response){
      console.log("Response added to obj...");
      this.set(object,response);
      console.log(object + ": " + this.get(object));
      if (response.nodes && response.nodes.length) this.set('parameters.modelRootId.value',response.nodes[0].modelId);
      else this.set('parameters.modelRootId.value',"");
    },
    valueChanged(name, oldValue, newValue){
      this.set('parameters.gateway.value',newValue);
      console.log("Chosen Gateway: "+ newValue);
    }
  }
});


boardlet.reopenClass({
  parameters: {
    title: {
      displayKey: 'parameters.title',
      value: 'P&ID Visualization Creator',
      parameterType: 'String',
      context: ParameterContext.Local,
      category: 'settings',
      editor: {
        component: 'input-component',
        parameters: {
          placeholder: 'Add title...'
        }
      }
    },

    node: {
      displayKey: 'parameters.node-id',
      value: null,
      parameterType: 'Integer',
      context: ParameterContext.InOut,
      category: 'filters',
      editor: {
        component: 'input-component',
        parameters: {
          placeholder: 'Add node ID...',
          hasIcon: true
        }
      }
    },

    gateway: {
      displayKey: 'parameters.gateway-id',
      value: null,
      parameterType: 'Integer',
      context: ParameterContext.InOut,
      category: 'filters',
      editor: {
        component: 'input-component',
        parameters: {
          placeholder: 'Add gateway ID...',
          hasIcon: true
        }
      }
    },

    nodeList: {
      displayKey: 'parameters.selected-nodes',
      value: [],
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

    modelRootId: {
      displayKey: 'parameters.model-root-id',
      value: "",
      parameterType: 'String',
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

    modelRootNum: {
      displayKey: 'parameters.model-root-id',
      value: 0,
      parameterType: 'String',
      context: ParameterContext.InOut,
      category: 'filters',
      editor: {
        component: 'input-multi-component',
        parameters: {
          placeholder: 'Add node IDs...',
          hasIcon: true
        }
      }
    }
  }
});
export default boardlet;
