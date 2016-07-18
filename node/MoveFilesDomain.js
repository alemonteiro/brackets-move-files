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

		// Get the final destination path
		getDestinationPath = function(source, dist) {
			// get stats for destination
			var dstat = fs.lstatSync(dist);

			// if destination is file it will be placed on the same folder
			if ( dstat.isFile() ) {
				var tmp = dist.split('/');
				tmp.pop();
				dist = tmp.join('/');
			}

			if ( dist.indexOf(source) > -1 ) throw new Error('Destination cannot be inside of Source!');

			// make the destination full path (with the source file/folder name)
			dist = dist + '/' + source.split('/').reverse()[0];

			// if source and destination are equal, do nothing
			if ( dist === source ) throw new Error('Destination cannot be the same as Source!');

			return dist;
		},

		// Command to copy from source to destination
		cmdCopy = function(source, dist, callback) {
			try{
				// Get the final path to move
				dist = getDestinationPath(source, dist);
				//console.log(domainName + ' Copying => ' + source + ' TO ' + dist);

				// Move those things
				fs.copy(source, dist, function(err) {
					// Give feedback
					callback(err, [dist]);
				});
            }
            catch(err) {
				//console.error(domainName + ' Copy Error => ' + err.toLocaleString());
				// Give error back
				callback(err.toLocaleString());
            }
		},

		// Command to move files and folders
		cmdMove = function(source, dist, callback) {
			try{
				// Get the final path to move
				dist = getDestinationPath(source, dist);
				//console.log(domainName + ' Moving => ' + source + ' TO ' + dist);

				// Move those things
				fs.move(source, dist, function(err) {
					// Give feedback
					callback(err, [dist]);
				});
            }
            catch(err) {
				//console.error(domainName + ' Move Error => ' + err.toLocaleString());
				// Give error back
				callback(err.toLocaleString());
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
