import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';



var component = SapientComponent.extend(Evented,{
  classNames: ['create-pid-component'],
  classNameBindings: ['inBar:component', 'inBar:create-pid-component'],
  toastMessagesService: service('toast-messages-service'),
  pidInstancesObject:null,
  pidShapesLibraryObject:null,
  jsonString:null,
  jsonObject:null,
  init(){
    this._super(...arguments);
    this.set('jsonObject', null);
    this.set('jsonString', "");
  },
  actions : {
    loadSuccess: function(object,response){
      console.log("Response added to object...");
      this.set(object,response);
      //console.log(object + ": " + this.get(object));
      let pidShapesLibraryObject = this.get(object);
      console.log("pidShapesLibraryObject =\n");
      console.log(pidShapesLibraryObject);
      let pidInstancesObject = this.get('pidInstancesObject');
      console.log(pidShapesLibraryObject);
      console.log(pidInstancesObject);
    },
    loadError: function(err){
      console.log("Error during File Upload...\n");
      console.log(err);
    },
    generatePidXml: function(pidShapesLibraryObject, pidInstancesObject){
      this.set('loading',true);
      console.log("XML Generation started...");
      let pidShapesLibraryObject = this.get('pidShapesLibraryObject');
      let pidInstancesObject = this.get('pidInstancesObject');
      console.log(pidShapesLibraryObject);
      console.log(pidInstancesObject);

    }

  }
});

component.reopenClass({
  parameters: {
    jsonModel: {
      displayKey: 'parameters.jsonModel',
      value: null,
      parameterType: 'Object',
      context: ParameterContext.InOut,
      category: 'settings'
    }
  }
});

export default component;
