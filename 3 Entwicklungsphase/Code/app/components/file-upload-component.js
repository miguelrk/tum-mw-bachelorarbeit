import { observer, computed } from '@ember/object';
import Evented from '@ember/object/evented';
import EmberUploader from 'ember-uploader';

const uploader = EmberUploader.Uploader.create({
    url: '/public/assets/detail-layout',
    method: 'POST'
});

import SapientComponent from 'core/objects/component-base';
export default SapientComponent.extend(Evented, {
    files: null, // must be empty string or otherwise the binding does not work
    classNames: ['file-upload-component'],

    init() {
        this._super(...arguments);
        this.set('files', []);
    },

    change: function (event) { // change is a standard event (part of Ember.Evented)
        this.set('files', event.target.files);
    },

    uploadFiles: observer('triggerUploadOnChange', function () {
        let files = this.get('files');

        this.get('onUpload') && this.get('onUpload')(files);

        if (files && files.length) {
            for (let i = 0; i < files.length; i++) {
                uploader.upload(files[i], {}).then((data) => {
                    console.log(data);
                }, (error) => {
                    console.log(error);
                });
            }

            // uploader.on('progress', e => {
            //   // Handle progress changes
            //   // Use `e.percent` to get percentage
            // });
        }
    }),

    fileSelectionObserver: observer('files', 'files.[]', function () {
        this.get('onFileSelectionChanged') && this.get('onFileSelectionChanged')(this.get('files'));
    }),

    fileNames: computed('files', 'files.[]', function () {
        let fileNames = '';
        let files = this.get('files');

        if (files && files.length) {
            for (let i = 0; i < files.length; i++) {
                if (i === files.length - 1) {
                    fileNames += files[i].name;
                } else {
                    fileNames += files[i].name + ', ';
                }
            }
        }

        return fileNames;
    }),

    multipleFiles: computed('multiSelect', function () {
        return !!this.get('multiSelect');
    })
});
