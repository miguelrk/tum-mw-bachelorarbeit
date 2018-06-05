import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import { inject as service } from '@ember/service';
import EmberUploader from 'ember-uploader';



var component = SapientComponent.extend(Evented,{
        classNames: ['xml-load-component'],
        toastMessagesService: service('toast-messages-service'),
        xmlFile:null,
        init(){
            this._super(...arguments);
            this.set('xmlFile', null);
        },
        change: function (event) { // change is a standard event (part of Ember.Evented)
            let targetId = event.target.id;
            if(targetId.includes("file-xml-")){
                this.set('xmlFile', event.target.files.item(0));
                console.log("File selection changed: '"+event.target.files.item(0).name+"'\n");
                this.send('uploadFile');
                //this.get('loadFile')&&this.get('loadFile')(event.target.files.item(0));
            }
        },
        actions : {
            uploadFile(event) {
                //AJAX-Variant without using ember-uploader
                /*
                let umlUpload = Ember.$.ajax({
                    type: "GET",
                    url: URL.createObjectURL(this.get('modelFile')),
                    dataType:"xml",
                }).done(function(data){
                    //Problem: this calls umlUpload instead of Class. At the moment no idea how to
                    this.get('onUploadSuccess') && this.get('onUploadSuccess')(data);
                    console.log(".done passed...");
                }).fail(function(jqXHR, textStatus){
                    this.get('onUploadError') && this.get('onUploadError')();
                    console.log(".fail passed...");
                });
                */
                let dismissFunction = this.get("toastMessagesService").showLoadingToast({title: "Datei wird geladen: " + this.get('xmlFile').name, boardlet:"Model input boardlet",
                    callback: (success) => {
                        if (success) {
                            this.get("toastMessagesService").showSuccessToast({title: "Datei geladen", showDuration: false, duration: 1000});
                        } else {
                            this.get("toastMessagesService").showFailedToast({title: "Datei laden fehlgeschlagen"});
                        }
                    }
                });
                //Variant using EmberUploader
                const uploader = EmberUploader.Uploader.create({
                    url: URL.createObjectURL(this.get('xmlFile')),
                    method: 'GET',
                    dataType: 'xml'
                });
                console.log("Uploader created...\n");
                uploader.upload(this.get('xmlFile')).then(data => {
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
