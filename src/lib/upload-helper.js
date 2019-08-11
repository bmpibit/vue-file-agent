import ajax from './ajax-request';

class UploadHelper {

	useAxios(axios){
		this.axios = axios;
	}

	doUpload(url, formData, progressCallback, configureFn){
		return ajax.post(url, formData, (xhr)=> {
			xhr.setRequestHeader('Accept', 'application/json');
			xhr.upload.addEventListener('progress', progressCallback, false);
			configureFn(xhr);
		});

	}

	doDeleteUpload(url, data, configureFn){
		if (typeof data != 'string') {
			data = JSON.stringify(data);
		}
		return ajax.delete(url, data, (xhr)=> {
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.setRequestHeader('Accept', 'application/json');
			configureFn(xhr);
		});
	}

	doUploadAxios(axios, formData, progressCallback){
		return axios.post('/upload', formData, {
		  onUploadProgress: progressCallback,
		});
	}

	doDeleteUploadAxios(axios, data, configureFn){
		return axios.delete('/upload', data, {
		});
	}

	upload(url, filesData, progressFn){
		var self = this;
		progressFn = progressFn || function(){};
		var promises = [];
	  function updateOverallProgress(){
	    var prgTotal = 0;
			for(var i = 0; i < filesData.length; i++){
	      prgTotal += filesData[i].progress();
	    }
	    progressFn(prgTotal/filesData.length);
	  }
		for(let i = 0; i < filesData.length; i++){
		  let fileData = filesData[i];
		  var formData = new FormData();
		  formData.append('file', fileData.file);
		  // function updateOverallProgress(){
		  //   var prgTotal = 0;
		  //   for(var fD of filesData){
		  //     prgTotal += fD.progress();
		  //   }
		  //   progressFn(prgTotal/filesData.length);
		  // }
		  (function(fileData){
		    var promise = self.doUpload(url, formData, function(progressEvent) {
		        var percentCompleted = (progressEvent.loaded * 100) / progressEvent.total;
		        var percentCompletedRounded = Math.round(percentCompleted);
		        console.log(percentCompletedRounded, percentCompleted, progressEvent);
		        fileData.progress(percentCompleted);
		        updateOverallProgress();
		    }, function(xhr){
		    	fileData.xhr = xhr;
		    });
		    promise.then(function(response){
		      console.log('received data:::::', response.data);
		      delete fileData.xhr;
		      fileData.upload = response.data;
		    } /* */ , function(err){
		    	var errorText = err.message;
		    	if(err.response && err.response.data){
		    		try {
		    			var errorMsg = JSON.parse(err.response.data).error;
			    		errorText = errorMsg;
		    		} catch(e){}
		    	}
		    	if(!fileData.error){
		    		fileData.error = {};
		    	}
		    	fileData.error.upload = errorText;
		      console.log('upload failed:::::', err);
		    } /* */);
		    promises.push(promise);
		  })(fileData);
		}
		return Promise.all(promises);
	}

	deleteUpload(url, fileData){
		return new Promise((resolve, reject)=> {
			console.log('to be deleted fileData:', fileData);
			if (fileData.xhr) {
				fileData.xhr.abort();
				console.log('xhr.readyState:', fileData.xhr.readyState);
			}
			if (fileData.upload) {
				this.doDeleteUpload(url, fileData.upload, (xhr)=> {
				}).then((result)=> {
					resolve(result);
				}, reject);
			}
		});
	}

}

export default new UploadHelper();