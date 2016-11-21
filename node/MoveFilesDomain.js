/*jshint node: true*/
(function () {

	// get dependencies
	var fs = require('fs-extra'),

		// domain info
		domainName = "BracketsMoveFilesDomain",
		domainVersion = {
			major: 0,
			minor: 1
		},
		_domainManager,

		checkDistName = function(path, name) {
			var i = 0,
				ext = name.indexOf('.') > 0 ? name.split('.').reverse()[0] : false,
				no_ext_name = ext ? name.substring(0, name.lastIndexOf('.')) : name,
				new_name, f;
			
			do {
				new_name = no_ext_name + ( i == 0 ? "" : '_' + i ) + ( ext ? "." + ext : "" );
				try {
					f = fs.lstatSync(path + '/' + new_name);
					i = i+1;	
					if ( !f.isFile() && ! f.isDirectory() )
						f = false;
				}
				catch(err) {
					f = false;
				}
			} while (f !== false);
			
			return new_name;
		},
		
		// Get the final destination path
		getDestinationPath = function(source, dist, forCopy) {
			// get stats for destination
			var alreadyExists = false,
				dstat,
				dist_name,
				isFile = false;	
			
			try {
				dstat = fs.lstatSync(dist);
				// if destination is file it will be placed on the same folder
				if ( dstat.isFile() ) {
					isFile = true;
					var tmp = dist.split('/');
					tmp.pop();
					dist = tmp.join('/');
				}
			}
			catch(err) {
				alreadyExists = false;
			}

			if ( dist.indexOf(source) > -1 ) throw new Error('Destination cannot be inside of Source!');
			
			var original_name = source.split('/').reverse()[0];
			dist_name = checkDistName(dist, original_name);
			
			console.log('Source: ' + source + ' => ' + (dist+'/'+dist_name));
			
			if ( forCopy === false && original_name !== dist_name ) {
				 throw new Error('Destination file already exists!');
			}
			
			// Make the full path
			dist = dist + '/' + dist_name;

			// if source and destination are equal, do nothing
			if ( dist === source ) throw new Error('Destination cannot be the same as Source!');

			return dist;
		},

		// Command to copy from source to destination
		cmdCopy = function(source, dist, callback) {
			try{
				// Get the final path to move
				console.log(domainName + ' Copying => ' + source + ' TO ' + dist);
				dist = getDestinationPath(source, dist, true);
				console.log(domainName + ' Copying => ' + source + ' TO ' + dist);

				// Move those things
				fs.copy(source, dist, function(err) {
					// Give feedback
					callback(err, [dist]);
				});
            }
            catch(err) {
				//console.error(domainName + ' Copy Error => ' + err.toLocaleString());
				// Give error back
				callback('Copy Error => ' + err.toLocaleString());
            }
		},

		// Command to move files and folders
		cmdMove = function(source, dist, callback) {
			// Get the final path to move
			try {
				//console.log(domainName + ' Moving => ' + source + ' TO ' + dist);
				dist = getDestinationPath(source, dist, false);
				
				fs.copy(source, dist, function(err) {
					// Give feedback
					if ( ! err ) {
						fs.remove(source, function(err) {
							callback(err, [dist]);
						});
					}
					else {
						callback(err, [dist]);
					}
				});
			}
			catch(err) {
				callback("Move Error: " + err.toLocaleString());
			}
		},

		// Initialization
		init = function (domainManager) {
			_domainManager = domainManager;

			console.log(domainName + ' => Domain Initializing');

			// Register domain
			if (!domainManager.hasDomain()) domainManager.registerDomain(domainName, domainVersion);

			// Register Events
			domainManager.registerEvent(domainName, "error",
				[{
					name: "message",
					type: "string",
					description: "error message"
				},{
					name: "details",
					type: "object",
					description: "error details"
				}]);

			// Register Command
			domainManager.registerCommand(domainName, "copy", 	cmdCopy, 		true, "Copy files and folders");

			return domainManager.registerCommand(domainName, "move", 	cmdMove, 		true, "Move files and folders");
		};

	exports.init = init;

}());
