$(function() {
	//We need to call this function on jQuery's "ready" so the Materialize.css's modal works:
	$('.modal').modal();
	$('select').material_select();
	
	ax.ready(function(){
		//alert("AIDAX is ready.");
	});
	ax.toggle_debug();
	
	//We are going to declare the functions we are going to user throughout the code.
	//My JS skills are not that "up to date", but I have seen people doing this way:
	var noop = function(e){ e.preventDefault(); e.stopPropagation(); },
	
		/**
		 * This function is responsable for checking if the file is OK before importing, 
		 * if it is, then it shows the "import options" menu/modal.
		 *
		 * csvFile: the file the user selected.
		 */
		fileImportVerifier = function(csvFile){
			//We need to check if the file is of the expected type. Apps can change this so it's not a very secure way of doing it, but it works in this case:
			
			if (csvFile.name.includes(".csv") === false){
				swal('Sorry, we only accept .csv files','The file you uploaded was not in the expected extension (application/vnd.ms-excel).','error').catch(swal.noop);
				return false;
			}

			//We are not going to let the user upload a file bigger than 1 MB, 
			//there are not many reasons to do that in this case as no file will be uploaded to the server:
			if(csvFile.size > 1024*1024){
				swal('Sorry, the file you uploaded was too big','The limit is 1 MB (or 1024 bytes).','error').catch(swal.noop);
				return false; 
			}
			
			//The file the user uploaded is OK, let's show him the options to import the users:
			$('.modal').modal('open');
			
			//We are going to keep this reference alive, we still need input from the user
			//before importing:
			$("#filename").text(csvFile.name);
			selectedFile = csvFile;
		},
		
		/**
		 * This is the function that will read the file and import the users.
		 * It will be called by the click event of the Import button on the options modal.
		 *
		 * csvFile: the file the user selected.
		 */
		importDataClientSide = function(csvFile){

			var reader = new FileReader();
			
			//We start by creating a feedback alert for the user:
			swal({
					title: "Importing users.",
					showCancelButton: false,
					html:"<span id='txt'>Reading file.</span><br><div class='progress'><div id='pImporting' class='determinate' style='width: 0%'></div></div>",
					useRejections: false,
					allowOutsideClick: false,
					allowEscapeKey: false,
					allowEnterKey: false
				});
				
			//For this particular file (well, any file below 1 MB) this will be pretty fast, 
			//but it's important to report anyway:
			reader.onprogress = function(e) {
				if (e.lengthComputable) {
					$("#pImporting").css("width", (e.loaded / e.total * 100)+"%");
				}
			};
				
			//This is the event which will be called after the file is loaded:
			reader.onload = function(progressEvent){
				$("#txt").text("Importing users");
				$("#pImporting").css("width", "0%");
				
				//We can do this client side, but it's not very effective as the whole file must be loaded into memory before processing.
				//There are some JS alternatives to this capable of reading chucks of the file (lines) individually, but this will work 
				//just fine for this purpose:
				var lines = this.result.split('\n'),
					attr = [],
					delimiter = $("#delimiter").val(),
					header = $("#header").is(':checked');
					
				//If the file doesn't provide a header we will create one now:
				if (header === false) {
					for (var i = 0; i < lines[0].split(delimiter).length; i++){
						attr.push('property_'+i);
					}
				}
				
				//We need to read every line from the file to add all the users:
				for(var line = 0; line < lines.length; line++){
					if (lines[line].trim() === '') { continue; }
					
					
					//We split the content of the line to get the properties:
					var content = lines[line].split(delimiter);
					
					//If this is the first line and we have a header, let's read it:
					if (line == 0 && header === true){ 
						attr = content;
						continue;
					} 
					
					
					var userProperties = {};
					
					//We are going to create a new object with the properties of this user, skipping the e-mail:
					for (var currentProperty = 1; currentProperty < content.length; currentProperty++){
						if (content[currentProperty] !== '')
							userProperties[attr[currentProperty]] = content[currentProperty];
					}
					
					//Using the first property as a id we can add the user calling this AIDAX function:
					
					ax.user({
						id:content[0],
						properties : userProperties
					});
					
					$("#pImporting").css("width", (lines.length / line * 100)+"%");
				}
				
				swal("Success!", "This file has been imported correctly.", "success");
			};
			
			//Let's read the file as text:
			reader.readAsText(selectedFile);
			selectedFile = undefined;
		}, 
		
		/**
		 * This function is used to process the file on the server side, to do this
		 * we must upload the file and 
		 */
		importDataServerSide = function (csvFile){
			swal({
				title: "Importing users.",
				showCancelButton: false,
				html:"<span id='txt'>Uploading file.</span><br><div class='progress'><div id='pImporting' class='determinate' style='width: 0%'></div></div>",
				useRejections: false,
				allowOutsideClick: false,
				allowEscapeKey: false,
				allowEnterKey: false
			});
			
			//This is the data we will submit to the server:
			var formData = new FormData();
			formData.append('csvFile', csvFile);
			formData.append('header', $("#header").is(":checked"));
			formData.append('delimiter', $("#delimiter").val());
			
			//We submit the form with Ajax:
			$.ajax({
				type: 'POST',
				url: '/fileupload',
				data: formData,
				processData: false,
				contentType: false,
				xhr: function() {
					var xhr = new window.XMLHttpRequest();
					//We are going to attach a event to the progress event on the Ajax request so we can monitor the progress.
					xhr.upload.addEventListener("progress", function(evt){
							if (evt.lengthComputable) {
								$("#pImporting").css("width",  evt.loaded / evt.total * 100 + "%");
							}
						}, false);
					return xhr;
				},
			}).done(function(res){
				console.log(res);
				if (res.result){
					swal("Success!", "The csv file was uploaded correctly and all users have been imported to AIDAX.", "success");
				} else {
					swal("Oops, something went wrong.", "Your file was uploaded correctly but we weren't able to import your data to AIDAX.", "error");
				}
			}).error(function(){
				swal("Oops, something went wrong.", "Please check your internet connection and try again later.", "error");
			});
		},
		
		//A reference to the selected file.
		selectedFile = undefined;
		
	$("#file").on("change", function(e){
		//A file was selected, we need to check if it's ok to be imported:
		fileImportVerifier(this.files[0]);
		$(this).val('');
	});
	
    $(".dropzone").on( { 
		drop : function(e){
			//Return the background color to normal and tell the browser to not do anything:
			$("main").removeClass("fileover");
			e.preventDefault();
			
			
			//A file was dropped, we need to check if it is ok to be imported:
			var csvFile = e.originalEvent.dataTransfer.files[0];
			fileImportVerifier(csvFile);
		}, 
		click : function(){
			//If the user clicks in anywhere in the screen we trigger the "click" event on a file input so the browser
			//may ask the user to select a file:
			$("#file").trigger('click');
		},
		
		//In order to support the drag and drop effect we need to tell the browser to let us handle the following events:
		dragenter: noop,
		dragover: function (e) { noop(e); if ($("main").hasClass("fileover") === false) { $("main").addClass("fileover"); } },
		dragleave: function (e) { noop(e);  $("main").removeClass("fileover"); } 
	});
	
	
	$(".btn-import").on("click", function(){
		//The user clicked the "import" button on the options' modal. We are going to import the data to AIDAX now:
		if (selectedFile === undefined){
			//This function should not be called if we don't have a reference to a file,
			//so we tell the user that something unexpected happened:
			swal("Oops, we don't know what to import.", "Please, select or drop the file again to continue.", "error").catch(swal.noop);
		} else {
			swal({
				title: 'Are you sure you want to continue?',
				text:'The users in this file will be imported to AIDAX.',
				showCancelButton:true,
				reverseButtons:true,
				type:'question'
			}).then(function (result) {
				if ($("#type").val() === 'client'){ importDataClientSide(selectedFile); } 
				else { importDataServerSide(selectedFile); }
			}).catch(swal.noop);
		}
	});
});