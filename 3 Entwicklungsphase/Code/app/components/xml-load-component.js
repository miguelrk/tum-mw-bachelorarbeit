import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import { inject as service } from '@ember/service';
import EmberUploader from 'ember-uploader';


/**
 * @author: Markus Male
 * @description: Component to be used for generic xml-file uploads. Should be used as follows:
 *      {{xml-load-component typeAccept = '.xml' 
 *          onLoadSuccess=(action 'functionThatSavesFile' 'objectToSaveIn') 
 *          onLoadError=(action 'functionThatSavesFile' 'objectToSaveIn')}}
 * @param onLoadSuccess Action to be called when the loading of the xml-file succeeds
 *      @param functionThatSavesFile Action in parentView to be called when the loading of the xml-file succeeds format: function(objHash,response)
 *          @param objHash =objectToSaveIn, The Object in parentClass to save the file in
 *          @param response the file returned by this.uploadFile()
 */

var component = SapientComponent.extend(Evented,{
        classNames: ['xml-load-component'],
        toastMessagesService: service('toast-messages-service'),
        xmlFile:null,
        init(){
            this._super(...arguments);
            this.set('xmlFile', null);
        },
        change: function (event) {
            /**
             * Function is called when a file is chosen within the file upload dialog. Gets the file from event and starts upload
             * @param change standard event (part of Ember.Evented)
             */
            let targetId = event.target.id;
            if(targetId.includes("file-xml-")){
                this.set('xmlFile', event.target.files.item(0));
                console.log("File selection changed: '"+event.target.files.item(0).name+"'\n");
                this.send('uploadFile');
                //this.get('loadFile')&&this.get('loadFile')(event.target.files.item(0));
            }
        },
        actions : {
            uploadFile() {
                /**
                 * Action uploadFile starts the upload of the file stored in xmlFile
                 */
                let dismissFunction = this.get("toastMessagesService").showLoadingToast({title: "File is loading: " + this.get('xmlFile').name, boardlet:"Model input boardlet",
                    callback: (success) => {
                        if (success) {
                            this.get("toastMessagesService").showSuccessToast({title: "File fully loaded", showDuration: false, duration: 1000});
                        } else {
                            this.get("toastMessagesService").showFailedToast({title: "Loading file failed. Check file consistency."});
                        }
                    }
                });
                //Variant using EmberUploader
                const uploader = EmberUploader.Uploader.create({
                    url: URL.createObjectURL(this.get('xmlFile')),
                    method: 'GET',
                    dataType: 'xml'
                });
                uploader.upload(this.get('xmlFile')).then(data => {
                    this.get('onLoadSuccess') && this.get('onLoadSuccess')(data);
                        dismissFunction(true);
                }, error => {
                    this.get('onLoadError') && this.get('onLoadError')(null);
                        dismissFunction(false);
                    console.log(error);
                });
            }
        }
    });

export default component;
