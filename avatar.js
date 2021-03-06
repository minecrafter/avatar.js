// Gravatar-compatible server. Requires express.

var	fs = require('fs'),
	path = require('path'),
	express = require('express'),
	gm = require("gm");

// paths
var defaultimg = "./res/default.jpg";
var avatarpath = "./avatars/";

// init
var server  = express();
server.use(express.static('res'));

server.get('/avatar/:hash', function(req, res) {
		// aliasing var
		var id = req.params.hash;
		var p = path.join(avatarpath, id);
		// check if even a valid hash (no dir traverse)
		if (!/^[a-f0-9]+$/.test(id)) {
			res.sendStatus(400).end(); return;
		}
		// the size is needed and gravatar uses 80 default
		var size = req.query.s ? req.query.s : 80;
		// if force default OR non-existant, just use default
		if (req.query.f == "y" || !fs.existsSync(p)) {
			gm(defaultimg).resize(size,size).noProfile().toBuffer(
	                        function (err, buffer) {
                                	if (err) {
                        	                console.log("couldn't resize " + id + " to " + size);
                	                        res.sendStatus(500).end(); return;
        	                        }
	                                res.set("Content-Type", "image/jpg");
                                	res.send(buffer).end();
                        	}
                	);
			return;
		}
		// i guess it's fine
		gm(p).resize(size,size).noProfile().toBuffer(
			function (err, buffer) {
				if (err) {
					console.log("couldn't resize " + id + " to " + size);
					res.sendStatus(500).end(); return;
				}
				res.set("Content-Type", "image/jpg");
				res.send(buffer).end();
			}
		);
	}
);

server.listen(3000);
