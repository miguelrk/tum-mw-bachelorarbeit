import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import { inject as service } from '@ember/service';
import EmberUploader from 'ember-uploader';



var component = SapientComponent.extend(Evented,{
  classNames: ['json-load-component'],
  toastMessagesService: service('toast-messages-service'),
  jsonFile:null,
  init(){
    this._super(...arguments);
    this.set('jsonFile', null);
  },
  change: function (event) { // change is a standard event (part of Ember.Evented)
    let targetId = event.target.id;
    if(targetId.includes("file-json-")){
      this.set('jsonFile', event.target.files.item(0));
      console.log("File selection changed: '"+event.target.files.item(0).name+"'\n");
      this.send('uploadFile');
      //this.get('loadFile')&&this.get('loadFile')(event.target.files.item(0));
    }
  },
  actions : {
    uploadFile(event) {
      let dismissFunction = this.get("toastMessagesService").showLoadingToast({title: "Loading file: " + this.get('jsonFile').name, boardlet:"PID Visualization Boardlet",
      callback: (success) => {
        if (success) {
          this.get("toastMessagesService").showSuccessToast({title: "File successfully Loaded", showDuration: false, duration: 1000});
        } else {
          this.get("toastMessagesService").showFailedToast({title: "Error on loading file"});
        }
      }
    });
    //Variant using EmberUploader
    const uploader = EmberUploader.Uploader.create({
      url: URL.createObjectURL(this.get('jsonFile')),
      method: 'GET',
      dataType: 'json'
    });
    //console.log("Uploader created...\n");
    uploader.upload(this.get('jsonFile')).then(data => {
      this.get('onLoadSuccess') && this.get('onLoadSuccess')(data);
      dismissFunction(true);
    }, error => {
      this.get('onLoadError') && this.get('onLoadError')();
      dismissFunction(false);
      console.log(error);
    });
  }
}
});

export default component;
